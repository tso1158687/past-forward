import { ElevationGrid } from '../../core/geo/elevation-grid';
import { GeoBounds, GeographicLocation } from '../../core/geo/geo-types';

/** A river as baked by tools/bake-map-data.mjs from Natural Earth. */
export interface River {
  /** Natural Earth name; used as a stable key, not as display text. */
  readonly name: string;
  /** Natural Earth scale rank: lower means a more important river. */
  readonly scaleRank: number;
  readonly lines: readonly (readonly GeographicLocation[])[];
}

/** The course of a border as baked by tools/bake-map-data.mjs from OpenHistoricalMap. */
export interface BorderLine {
  readonly id: string;
  readonly lines: readonly (readonly GeographicLocation[])[];
}

export interface MapAssets {
  readonly elevation: ElevationGrid;
  readonly rivers: readonly River[];
  readonly borders: readonly BorderLine[];
}

interface TerrainMetadata {
  readonly bounds: GeoBounds;
  readonly width: number;
  readonly height: number;
  readonly metersPerUnit: number;
}

type LineCoordinates = readonly (readonly [lon: number, lat: number])[];

interface RiversFile {
  readonly rivers: readonly {
    readonly name: string;
    readonly scaleRank: number;
    readonly lines: readonly LineCoordinates[];
  }[];
}

interface BordersFile {
  readonly borders: readonly {
    readonly id: string;
    readonly lines: readonly LineCoordinates[];
  }[];
}

const ASSET_BASE = 'map/';

/** Loads the static map assets produced by `pnpm bake:map`. */
export async function loadMapAssets(): Promise<MapAssets> {
  const [metadata, samples, riversFile, bordersFile] = await Promise.all([
    fetchAsset('terrain.json').then((response) => response.json() as Promise<TerrainMetadata>),
    fetchAsset('terrain.bin').then((response) => response.arrayBuffer()),
    fetchAsset('rivers.json').then((response) => response.json() as Promise<RiversFile>),
    fetchAsset('borders.json').then((response) => response.json() as Promise<BordersFile>),
  ]);

  if (samples.byteLength !== metadata.width * metadata.height * Int16Array.BYTES_PER_ELEMENT) {
    throw new Error('terrain.bin does not match the size declared in terrain.json');
  }

  return {
    elevation: { ...metadata, samples: new Int16Array(samples) },
    rivers: riversFile.rivers.map((river) => ({
      name: river.name,
      scaleRank: river.scaleRank,
      lines: river.lines.map(toLocations),
    })),
    borders: bordersFile.borders.map((border) => ({
      id: border.id,
      lines: border.lines.map(toLocations),
    })),
  };
}

function toLocations(line: LineCoordinates): GeographicLocation[] {
  return line.map(([lon, lat]) => ({ lon, lat }));
}

async function fetchAsset(fileName: string): Promise<Response> {
  const response = await fetch(ASSET_BASE + fileName);
  if (!response.ok) throw new Error(`Failed to load ${fileName} (HTTP ${response.status})`);
  return response;
}
