// Bakes the static map assets used by the 3D scene from open data:
//   - public/map/terrain.bin / terrain.json : elevation grid (AWS Terrain Tiles, "terrarium" encoding)
//   - public/map/rivers.json                : river centre lines (Natural Earth 1:10m, public domain)
//   - public/map/borders.json               : historical borders (OpenHistoricalMap, CC0)
//   - public/map/railways.json              : railways open in 1941, today's track (OpenStreetMap, ODbL)
//
// Run with `pnpm bake:map`, or `pnpm bake:map railways` (or terrain, rivers, borders) for one
// asset. Downloads are cached in tools/.cache so re-runs are offline.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
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

const OHM_OVERPASS_URL = 'https://overpass-api.openhistoricalmap.org/api/interpreter';
/**
 * A border is the set of boundary ways that two OpenHistoricalMap relations have in common. Each
 * relation is one state's outline during the period in its name. Which lines these are, and how
 * they were checked, is recorded in docs/research/minsk-borders.md.
 */
const BORDERS = [
  {
    id: 'german-soviet-1941',
    // Soviet Union 1940-08-06..1941-07-17 and Deutsches Reich 1941-04-14..1941-08-01
    relations: [2848812, 2704717],
  },
  {
    id: 'polish-soviet-1939',
    // Polska 1938-11-01..1939-10-06 and Soviet Union 1926..1939-10-06
    relations: [2741574, 2851157],
  },
];
/** Points closer than this to the simplified line are dropped; the relief grid is about 0.4 km. */
const BORDER_TOLERANCE_KM = 0.15;

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

// ---------- Borders ----------

/** The member ways of a boundary relation that touch the region, keyed by way id. */
async function loadBoundaryWays(relationId) {
  const margin = 0.2;
  const box = [
    BOUNDS.south - margin,
    BOUNDS.west - margin,
    BOUNDS.north + margin,
    BOUNDS.east + margin,
  ];
  const query = `[out:json][timeout:120];relation(${relationId});way(r)(${box.join(',')});out geom;`;
  const url = `${OHM_OVERPASS_URL}?data=${encodeURIComponent(query)}`;
  const response = JSON.parse(await fetchCached(url, `ohm/relation-${relationId}.json`));
  const ways = new Map(response.elements.map((way) => [way.id, way]));
  return { ways, dataTimestamp: response.osm3s.timestamp_osm_base };
}

/** Joins ways that share an end node into the longest possible chains of [lon, lat] points. */
function chainWays(ways) {
  const waysByEndNode = new Map();
  for (const way of ways) {
    for (const node of [way.nodes[0], way.nodes.at(-1)]) {
      waysByEndNode.set(node, [...(waysByEndNode.get(node) ?? []), way]);
    }
  }
  const used = new Set();
  const pointsOf = (way) => way.geometry.map(({ lon, lat }) => [lon, lat]);
  /** The one unused way that continues from `node`, with its points ordered away from it. */
  const continuationFrom = (node) => {
    const candidates = waysByEndNode.get(node).filter((way) => !used.has(way.id));
    if (candidates.length !== 1) return undefined;
    const [way] = candidates;
    const startsHere = way.nodes[0] === node;
    return {
      way,
      points: startsHere ? pointsOf(way) : pointsOf(way).reverse(),
      endNode: startsHere ? way.nodes.at(-1) : way.nodes[0],
    };
  };

  const chains = [];
  for (const first of ways) {
    if (used.has(first.id)) continue;
    used.add(first.id);
    let chain = pointsOf(first);
    for (let end = first.nodes.at(-1), next; (next = continuationFrom(end)); end = next.endNode) {
      used.add(next.way.id);
      chain = [...chain, ...next.points.slice(1)];
    }
    for (let start = first.nodes[0], next; (next = continuationFrom(start)); start = next.endNode) {
      used.add(next.way.id);
      chain = [...next.points.slice(1).reverse(), ...chain];
    }
    chains.push(chain);
  }
  return chains;
}

/** Douglas–Peucker simplification with the tolerance measured in kilometres on the ground. */
function simplifyLine(line, toleranceKm) {
  const kmPerDegLat = 111.2;
  const kmPerDegLon = kmPerDegLat * Math.cos(degToRad((BOUNDS.south + BOUNDS.north) / 2));
  const flat = line.map(([lon, lat]) => [lon * kmPerDegLon, lat * kmPerDegLat]);
  const distanceToSegment = ([px, py], [ax, ay], [bx, by]) => {
    const lengthSquared = (bx - ax) ** 2 + (by - ay) ** 2;
    const t =
      lengthSquared === 0
        ? 0
        : Math.max(0, Math.min(1, ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / lengthSquared));
    return Math.hypot(px - (ax + t * (bx - ax)), py - (ay + t * (by - ay)));
  };

  const keep = new Array(line.length).fill(false);
  keep[0] = keep[line.length - 1] = true;
  const pending = [[0, line.length - 1]];
  while (pending.length > 0) {
    const [first, last] = pending.pop();
    let farthest = -1;
    let farthestDistance = toleranceKm;
    for (let i = first + 1; i < last; i++) {
      const distance = distanceToSegment(flat[i], flat[first], flat[last]);
      if (distance > farthestDistance) {
        farthest = i;
        farthestDistance = distance;
      }
    }
    if (farthest === -1) continue;
    keep[farthest] = true;
    pending.push([first, farthest], [farthest, last]);
  }
  return line.filter((_, i) => keep[i]);
}

async function bakeBorders() {
  const borders = [];
  for (const { id, relations } of BORDERS) {
    const loaded = [];
    // One request at a time: this is a small volunteer-run server.
    for (const relationId of relations) loaded.push(await loadBoundaryWays(relationId));
    const shared = [...loaded[0].ways.values()].filter((way) => loaded[1].ways.has(way.id));
    const lines = chainWays(shared)
      .flatMap(clipLineToBounds)
      .map((line) => simplifyLine(line, BORDER_TOLERANCE_KM))
      .sort((a, b) => b.length - a.length);
    if (lines.length === 0) throw new Error(`Border ${id} has no line inside the region`);
    // OpenHistoricalMap keeps being edited; this is the state of the newer of the two downloads.
    const dataTimestamp = loaded
      .map((relation) => relation.dataTimestamp)
      .sort()
      .at(-1);
    borders.push({ id, relations, dataTimestamp, lines });
  }
  const output = {
    source: 'OpenHistoricalMap (CC0), boundary relations as listed for each border',
    borders,
  };
  await writeFile(join(OUTPUT_DIR, 'borders.json'), JSON.stringify(output) + '\n');
  console.log(
    `borders: ${borders.map((b) => `${b.id}: ${b.lines.length} lines, ${b.lines.flat().length} points`).join('; ')}`,
  );
}

// ---------- Railways ----------

const OSM_OVERPASS_URLS = [
  'https://overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];
/**
 * Main railways open in June 1941, each as the OpenStreetMap station nodes it runs through in
 * order. Which lines these are and when each opened is recorded in docs/research/minsk-railways.md;
 * the line between two stations is today's shortest track, so the course is today's alignment.
 */
const RAILWAYS = [
  {
    id: 'st-petersburg-warsaw',
    // Warszawa Wschodnia, Małkinia, Białystok, Гродна, Lentvaris, Vilnius, Daugavpils
    stations: [33210583, 3275141671, 3298971170, 11005642028, 31451531, 6624987344, 7800844381],
    // Between Grodno and Lentvaris the old line crosses today's Belarus–Lithuania border on
    // track that is now disused or lifted; OpenStreetMap still maps its bed.
    formerTrackAfter: [11005642028],
  },
  {
    id: 'lentvaris-kybartai',
    // Lentvaris, Kaunas, Kybartai
    stations: [31451531, 6629286841, 3161707936],
  },
  {
    id: 'warsaw-brest-smolensk',
    // Warszawa Wschodnia, Siedlce, Terespol, Брэст-Цэнтральны, Баранавічы Цэнтральныя,
    // Мінск-Пасажырскі, Барысаў, Орша-Цэнтральная, Смоленск-Центральный
    stations: [
      33210583, 359467337, 3456263616, 1034170744, 5844409159, 27184541, 11030311018, 11438875116,
      2011389433,
    ],
  },
  {
    id: 'libau-romny',
    // Naujoji Vilnia, Маладзечна, Мінск-Пасажырскі, Асіповічы 1, Бабруйск, Гомель Пасажырскі
    stations: [4568215628, 9825809815, 27184541, 306066747, 11027468523, 452534425],
  },
  {
    id: 'riga-oryol',
    // Daugavpils, Полацк, Віцебск, Смоленск-Центральный
    stations: [7800844381, 10702924390, 10637312516, 2011389433],
  },
  {
    id: 'vitebsk-zhlobin',
    // Віцебск, Орша-Цэнтральная, Магілёў 1, Жлобін Паўночны
    stations: [10637312516, 11438875116, 11453777381, 8917662541],
  },
  {
    id: 'brest-gomel',
    // Брэст-Цэнтральны, Жабінка, Кобрын, Пінск, Лунінец, Гомель Пасажырскі
    stations: [1034170744, 5843905344, 476416018, 460411021, 12484334093, 452534425],
  },
  {
    id: 'vilnius-rivne',
    // Vilnius, Ліда, Баранавічы Палескія, Лунінец, Сарни, Рівне
    stations: [6624987344, 306067705, 2737375271, 12484334093, 1459071429, 1216887890],
    // Between Luninets and Sarny the line crosses today's Belarus–Ukraine border on track that
    // OpenStreetMap maps as disused.
    formerTrackAfter: [12484334093],
  },
  {
    id: 'bialystok-baranovichi',
    // Białystok, Ваўкавыск-Цэнтральны, Баранавічы Палескія
    stations: [3298971170, 12922627532, 2737375271],
    // Between Białystok and Vawkavysk the line crosses today's Poland–Belarus border on track that
    // is now disused or lifted.
    formerTrackAfter: [3298971170],
  },
  {
    id: 'grodno-mosty',
    // Гродна, Масты
    stations: [11005642028, 12920637565],
  },
];
/** Track between two stations is looked for within their bounding box widened by this much. */
const RAIL_CORRIDOR_DEGREES = 0.3;
/** A route this much longer than the straight line has probably strayed onto another line. */
const RAIL_MAX_DETOUR = 1.5;
const RAILWAY_TOLERANCE_KM = 0.3;
/**
 * Way ends this close are taken to be joined: in today's network a few pieces meet without a shared
 * node (2 m apart at Zhabinka); pieces of a lifted line's bed often lie farther apart.
 */
const TRACK_GAP_KM = 0.02;
const FORMER_TRACK_GAP_KM = 0.3;

/** Runs an Overpass query on the OpenStreetMap servers in turn, waiting between attempts. */
async function queryOsm(query, cacheName) {
  const cachePath = join(CACHE_DIR, cacheName);
  if (existsSync(cachePath)) return JSON.parse(await readFile(cachePath, 'utf8'));
  // The public servers are often busy; wait longer after each failure.
  for (let attempt = 0; attempt < 10; attempt++) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, Math.min(attempt * 30_000, 120_000)));
    }
    const url = OSM_OVERPASS_URLS[attempt % OSM_OVERPASS_URLS.length];
    const text = (await postWithFetch(url, query)) ?? postWithCurl(url, query);
    // A query that runs out of time or memory still answers 200, with partial data and a remark.
    if (!text || JSON.parse(text).remark) continue;
    await mkdir(dirname(cachePath), { recursive: true });
    await writeFile(cachePath, text);
    return JSON.parse(text);
  }
  throw new Error(`Overpass kept failing for ${cacheName}`);
}

/** Set once Node cannot connect at all, so that later queries go straight to curl. */
let fetchUnreachable = false;

async function postWithFetch(url, query) {
  if (fetchUnreachable) return undefined;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'User-Agent': 'map-research/1.0' },
    body: new URLSearchParams({ data: query }),
    signal: AbortSignal.timeout(300_000),
  }).catch((error) => {
    if (error?.cause?.code === 'ETIMEDOUT' || error?.cause?.code === 'ECONNREFUSED') {
      fetchUnreachable = true;
    }
    return undefined;
  });
  return response?.ok ? response.text() : undefined;
}

/**
 * On some machines a firewall lets curl reach the Overpass servers but not Node; curl then
 * fetches the same response.
 */
function postWithCurl(url, query) {
  const result = spawnSync(
    'curl',
    [
      '-sf',
      '-A',
      'map-research/1.0',
      '--max-time',
      '300',
      '--data-urlencode',
      `data=${query}`,
      url,
    ],
    { encoding: 'utf8', maxBuffer: 512 * 1024 * 1024 },
  );
  return result.status === 0 ? result.stdout : undefined;
}

const kmBetween = ([lonA, latA], [lonB, latB]) => {
  const kmPerDegLon = 111.32 * Math.cos(degToRad((latA + latB) / 2));
  return Math.hypot((lonA - lonB) * kmPerDegLon, (latA - latB) * 110.57);
};

/** Shortest path along the track network from `from` to `to`, as node ids; undefined if none. */
function shortestPath(neighbours, from, to) {
  const distance = new Map([[from, 0]]);
  const previous = new Map();
  const done = new Set();
  // A plain array is fast enough for corridors of a few thousand nodes.
  const queue = [[0, from]];
  while (queue.length > 0) {
    let best = 0;
    for (let i = 1; i < queue.length; i++) if (queue[i][0] < queue[best][0]) best = i;
    const [d, node] = queue.splice(best, 1)[0];
    if (done.has(node)) continue;
    done.add(node);
    if (node === to) break;
    for (const [next, length] of neighbours.get(node) ?? []) {
      if (d + length < (distance.get(next) ?? Infinity)) {
        distance.set(next, d + length);
        previous.set(next, node);
        queue.push([d + length, next]);
      }
    }
  }
  if (!done.has(to)) return undefined;
  const path = [to];
  while (path[0] !== from) path.unshift(previous.get(path[0]));
  return path;
}

/**
 * Today's track from one station to the next; with `formerTrack`, also disused and lifted track
 * as OpenStreetMap maps it.
 */
async function routeBetween(from, to, formerTrack) {
  const west = Math.min(from.lon, to.lon) - RAIL_CORRIDOR_DEGREES;
  const east = Math.max(from.lon, to.lon) + RAIL_CORRIDOR_DEGREES;
  const south = Math.min(from.lat, to.lat) - RAIL_CORRIDOR_DEGREES;
  const north = Math.max(from.lat, to.lat) + RAIL_CORRIDOR_DEGREES;
  const bbox = `${south},${west},${north},${east}`;
  // Sidings are left out of today's network; a former line's bed is taken whatever its tags (the
  // disused crossing into Belarus east of Białystok is mapped as a spur).
  const former = formerTrack ? `way["railway"~"^(disused|abandoned)$"](${bbox});` : '';
  const query = `[out:json][timeout:180];(way["railway"="rail"][!"service"](${bbox});${former});out geom;`;
  const suffix = formerTrack ? '-former' : '';
  const { elements } = await queryOsm(query, `osm/rail-${from.id}-${to.id}${suffix}.json`);

  const position = new Map();
  const neighbours = new Map();
  const link = (a, b, length) => neighbours.set(a, [...(neighbours.get(a) ?? []), [b, length]]);
  for (const way of elements) {
    way.nodes.forEach((node, i) => position.set(node, [way.geometry[i].lon, way.geometry[i].lat]));
    for (let i = 1; i < way.nodes.length; i++) {
      const length = kmBetween(position.get(way.nodes[i - 1]), position.get(way.nodes[i]));
      link(way.nodes[i - 1], way.nodes[i], length);
      link(way.nodes[i], way.nodes[i - 1], length);
    }
  }
  const gap = formerTrack ? FORMER_TRACK_GAP_KM : TRACK_GAP_KM;
  const ends = [...new Set(elements.flatMap((way) => [way.nodes[0], way.nodes.at(-1)]))];
  for (const a of ends) {
    for (const b of ends) {
      const length = kmBetween(position.get(a), position.get(b));
      if (a < b && length <= gap) {
        link(a, b, length);
        link(b, a, length);
      }
    }
  }
  // A station node usually sits beside the track rather than on it.
  const nearest = ({ lon, lat }) =>
    [...position.keys()].reduce((best, node) =>
      kmBetween(position.get(node), [lon, lat]) < kmBetween(position.get(best), [lon, lat])
        ? node
        : best,
    );
  const path = shortestPath(neighbours, nearest(from), nearest(to));
  const label = `${from.name} → ${to.name}`;
  if (!path) throw new Error(`No track found ${label}`);
  const points = path.map((node) => position.get(node));
  const length = points.slice(1).reduce((sum, point, i) => sum + kmBetween(points[i], point), 0);
  const straight = kmBetween([from.lon, from.lat], [to.lon, to.lat]);
  if (length > straight * RAIL_MAX_DETOUR) {
    throw new Error(`Track ${label} is ${Math.round(length)} km for ${Math.round(straight)} km`);
  }
  return { points, label: `${label} ${Math.round(length)} km` };
}

async function bakeRailways() {
  const stationIds = [...new Set(RAILWAYS.flatMap((railway) => railway.stations))];
  const stationsResponse = await queryOsm(
    `[out:json][timeout:60];node(id:${stationIds.join(',')});out;`,
    `osm/stations-${stationIds.length}.json`,
  );
  const stations = new Map(
    stationsResponse.elements.map((node) => [
      node.id,
      { id: node.id, lon: node.lon, lat: node.lat, name: node.tags?.name ?? String(node.id) },
    ]),
  );
  const railways = [];
  const legs = [];
  for (const { id, stations: stops, formerTrackAfter = [] } of RAILWAYS) {
    let line = [];
    for (let i = 1; i < stops.length; i++) {
      const [from, to] = [stations.get(stops[i - 1]), stations.get(stops[i])];
      if (!from || !to)
        throw new Error(`Railway ${id}: station ${stops[i - 1]} or ${stops[i]} not found`);
      const leg = await routeBetween(from, to, formerTrackAfter.includes(from.id));
      legs.push(leg.label);
      line = [...line, ...(line.length > 0 ? leg.points.slice(1) : leg.points)];
    }
    const lines = clipLineToBounds(line).map((part) => simplifyLine(part, RAILWAY_TOLERANCE_KM));
    railways.push({ id, stations: stops.map((stop) => stations.get(stop).name), lines });
  }
  const output = {
    source:
      'OpenStreetMap contributors (ODbL), today’s track; which lines existed in 1941 is in docs/research/minsk-railways.md',
    dataTimestamp: stationsResponse.osm3s?.timestamp_osm_base,
    railways,
  };
  await writeFile(join(OUTPUT_DIR, 'railways.json'), JSON.stringify(output) + '\n');
  console.log(`railways: ${railways.length} lines; legs: ${legs.join('; ')}`);
}

await mkdir(OUTPUT_DIR, { recursive: true });
const only = process.argv[2];
if (!only || only === 'terrain') await bakeTerrain();
if (!only || only === 'rivers') await bakeRivers();
if (!only || only === 'borders') await bakeBorders();
if (!only || only === 'railways') await bakeRailways();
