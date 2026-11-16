// Bakes the static map assets used by the 3D scene from open data:
//   - public/map/terrain.bin / terrain.json : elevation grid (AWS Terrain Tiles, "terrarium" encoding)
//   - public/map/rivers.json                : river centre lines (Natural Earth 1:10m, public domain)
//
// Run with `pnpm bake:map`. Downloads are cached in tools/.cache so re-runs are offline.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE_DIR = join(ROOT, 'tools', '.cache');
const OUTPUT_DIR = join(ROOT, 'public', 'map');

/** MVP region: eastern Poland to the upper Dnieper. Degrees, WGS84. */
const BOUNDS = { west: 19.5, east: 31.5, south: 50.5, north: 56.0 };
const GRID_WIDTH = 2048;
const TILE_ZOOM = 8;
const TILE_SIZE = 256;
/** Elevation is stored as Int16 in units of 0.1 m, which keeps flat lowlands free of banding. */
const METERS_PER_UNIT = 0.1;
const SPIKE_THRESHOLD_METERS = 150;

const TERRAIN_TILE_URL = (z, x, y) =>
  `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`;
const NATURAL_EARTH_URL = (name) =>
  `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/${name}.geojson`;
const RIVER_DATASETS = ['ne_10m_rivers_lake_centerlines', 'ne_10m_rivers_europe'];

async function fetchCached(url, cacheName) {
  const cachePath = join(CACHE_DIR, cacheName);
  if (existsSync(cachePath)) return readFile(cachePath);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed (${response.status}): ${url}`);
  const data = Buffer.from(await response.arrayBuffer());
  await mkdir(dirname(cachePath), { recursive: true });
  await writeFile(cachePath, data);
  return data;
}

// ---------- Terrain ----------

const degToRad = (deg) => (deg * Math.PI) / 180;

/** Web Mercator pixel coordinates at TILE_ZOOM. */
function lonLatToMercatorPixel(lon, lat) {
  const worldSize = TILE_SIZE * 2 ** TILE_ZOOM;
  const latRad = degToRad(lat);
  return {
    x: ((lon + 180) / 360) * worldSize,
    y: ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * worldSize,
  };
}

function gridHeightForSquareCells() {
  const midLat = (BOUNDS.south + BOUNDS.north) / 2;
  const widthKm = (BOUNDS.east - BOUNDS.west) * Math.cos(degToRad(midLat));
  const heightKm = BOUNDS.north - BOUNDS.south;
  return Math.round(GRID_WIDTH * (heightKm / widthKm));
}

async function loadElevationTiles() {
  const topLeft = lonLatToMercatorPixel(BOUNDS.west, BOUNDS.north);
  const bottomRight = lonLatToMercatorPixel(BOUNDS.east, BOUNDS.south);
  const tiles = new Map();
  const jobs = [];
  // One extra pixel of margin so bilinear sampling never leaves the loaded tiles.
  for (
    let ty = Math.floor((topLeft.y - 1) / TILE_SIZE);
    ty <= Math.floor((bottomRight.y + 1) / TILE_SIZE);
    ty++
  ) {
    for (
      let tx = Math.floor((topLeft.x - 1) / TILE_SIZE);
      tx <= Math.floor((bottomRight.x + 1) / TILE_SIZE);
      tx++
    ) {
      jobs.push(
        fetchCached(
          TERRAIN_TILE_URL(TILE_ZOOM, tx, ty),
          `terrarium/${TILE_ZOOM}-${tx}-${ty}.png`,
        ).then((data) => tiles.set(`${tx}/${ty}`, PNG.sync.read(data))),
      );
    }
  }
  await Promise.all(jobs);
  return tiles;
}

function elevationAtPixel(tiles, px, py) {
  const tile = tiles.get(`${Math.floor(px / TILE_SIZE)}/${Math.floor(py / TILE_SIZE)}`);
  const offset = ((py % TILE_SIZE) * TILE_SIZE + (px % TILE_SIZE)) * 4;
  const [r, g, b] = [tile.data[offset], tile.data[offset + 1], tile.data[offset + 2]];
  return r * 256 + g + b / 256 - 32768;
}

function sampleElevation(tiles, lon, lat) {
  const { x, y } = lonLatToMercatorPixel(lon, lat);
  // Pixel values sit at pixel centres.
  const fx = x - 0.5;
  const fy = y - 0.5;
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const tx = fx - x0;
  const ty = fy - y0;
  const top = elevationAtPixel(tiles, x0, y0) * (1 - tx) + elevationAtPixel(tiles, x0 + 1, y0) * tx;
  const bottom =
    elevationAtPixel(tiles, x0, y0 + 1) * (1 - tx) + elevationAtPixel(tiles, x0 + 1, y0 + 1) * tx;
  return top * (1 - ty) + bottom * ty;
}

/**
 * The source data contains a few isolated void spikes (e.g. -696 m in the middle of the Lublin
 * upland). A sample that differs wildly from the median of its neighbours is replaced by it.
 */
function removeSpikes(elevations, width, height) {
  let replaced = 0;
  const source = Float32Array.from(elevations);
  for (let row = 1; row < height - 1; row++) {
    for (let col = 1; col < width - 1; col++) {
      const neighbours = [];
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr !== 0 || dc !== 0) neighbours.push(source[(row + dr) * width + col + dc]);
        }
      }
      neighbours.sort((a, b) => a - b);
      const median = (neighbours[3] + neighbours[4]) / 2;
      if (Math.abs(source[row * width + col] - median) > SPIKE_THRESHOLD_METERS) {
        elevations[row * width + col] = median;
        replaced++;
      }
    }
  }
  return replaced;
}

async function bakeTerrain() {
  const tiles = await loadElevationTiles();
  const width = GRID_WIDTH;
  const height = gridHeightForSquareCells();
  const elevations = new Float32Array(width * height);

  // Row 0 is the northern edge; samples sit on grid nodes, so both edges of the bounds are included.
  for (let row = 0; row < height; row++) {
    const lat = BOUNDS.north - (row / (height - 1)) * (BOUNDS.north - BOUNDS.south);
    for (let col = 0; col < width; col++) {
      const lon = BOUNDS.west + (col / (width - 1)) * (BOUNDS.east - BOUNDS.west);
      elevations[row * width + col] = sampleElevation(tiles, lon, lat);
    }
  }
  const spikes = removeSpikes(elevations, width, height);

  const samples = new Int16Array(width * height);
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < elevations.length; i++) {
    min = Math.min(min, elevations[i]);
    max = Math.max(max, elevations[i]);
    samples[i] = Math.round(elevations[i] / METERS_PER_UNIT);
  }

  const meta = {
    bounds: BOUNDS,
    width,
    height,
    metersPerUnit: METERS_PER_UNIT,
    minElevationMeters: Math.round(min),
    maxElevationMeters: Math.round(max),
    source: `Terrain Tiles on AWS Open Data (Mapzen terrarium), zoom ${TILE_ZOOM}`,
  };
  await writeFile(join(OUTPUT_DIR, 'terrain.bin'), Buffer.from(samples.buffer));
  await writeFile(join(OUTPUT_DIR, 'terrain.json'), JSON.stringify(meta, null, 2) + '\n');
  console.log(
    `terrain: ${width}x${height}, ${meta.minElevationMeters}..${meta.maxElevationMeters} m, ${spikes} spikes removed`,
  );
}

// ---------- Rivers ----------

const isInsideBounds = ([lon, lat]) =>
  lon >= BOUNDS.west && lon <= BOUNDS.east && lat >= BOUNDS.south && lat <= BOUNDS.north;

/** Splits a line into the runs of consecutive points that lie inside the region. */
function clipLineToBounds(line) {
  const runs = [];
  let current = [];
  for (const point of line) {
    if (isInsideBounds(point)) {
      current.push(point.map((value) => Math.round(value * 1e4) / 1e4));
    } else if (current.length > 0) {
      runs.push(current);
      current = [];
    }
  }
  if (current.length > 0) runs.push(current);
  return runs.filter((run) => run.length >= 2);
}

function featureLines(geometry) {
  if (!geometry) return [];
  return geometry.type === 'MultiLineString' ? geometry.coordinates : [geometry.coordinates];
}

async function bakeRivers() {
  const riversByName = new Map();
  for (const dataset of RIVER_DATASETS) {
    const geojson = JSON.parse(await fetchCached(NATURAL_EARTH_URL(dataset), `${dataset}.geojson`));
    for (const feature of geojson.features) {
      const lines = featureLines(feature.geometry).flatMap(clipLineToBounds);
      if (lines.length === 0) continue;
      const { name, name_en: nameEn, scalerank } = feature.properties;
      const key = nameEn ?? name ?? `unnamed-${riversByName.size}`;
      const river = riversByName.get(key) ?? { name: key, scaleRank: scalerank, lines: [] };
      river.scaleRank = Math.min(river.scaleRank, scalerank);
      river.lines.push(...lines);
      riversByName.set(key, river);
    }
  }
  const rivers = [...riversByName.values()].sort((a, b) => a.scaleRank - b.scaleRank);
  const output = { source: 'Natural Earth 1:10m rivers (public domain)', rivers };
  await writeFile(join(OUTPUT_DIR, 'rivers.json'), JSON.stringify(output) + '\n');
  console.log(
    `rivers: ${rivers.length} (${rivers.map((r) => `${r.name}:${r.scaleRank}`).join(', ')})`,
  );
}

await mkdir(OUTPUT_DIR, { recursive: true });
await bakeTerrain();
await bakeRivers();
