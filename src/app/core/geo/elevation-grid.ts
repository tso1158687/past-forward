import { GeoBounds, GeographicLocation } from './geo-types';

/**
 * A regular longitude/latitude grid of terrain heights. Samples sit on the grid nodes: column 0 is
 * the western edge, the last column the eastern edge; row 0 is the northern edge.
 */
export interface ElevationGrid {
  readonly bounds: GeoBounds;
  readonly width: number;
  readonly height: number;
  /** Multiply a raw sample by this to get metres. */
  readonly metersPerUnit: number;
  readonly samples: Int16Array;
}

/** Fractional column/row of a location, clamped to the grid. */
export function gridCoordinates(
  grid: ElevationGrid,
  location: GeographicLocation,
): { column: number; row: number } {
  const { bounds, width, height } = grid;
  const u = (location.lon - bounds.west) / (bounds.east - bounds.west);
  const v = (bounds.north - location.lat) / (bounds.north - bounds.south);
  return {
    column: clamp(u, 0, 1) * (width - 1),
    row: clamp(v, 0, 1) * (height - 1),
  };
}

/** Bilinearly interpolated elevation in metres. Locations outside the grid use the nearest edge. */
export function sampleElevationMeters(grid: ElevationGrid, location: GeographicLocation): number {
  const { column, row } = gridCoordinates(grid, location);
  const col0 = Math.min(Math.floor(column), grid.width - 2);
  const row0 = Math.min(Math.floor(row), grid.height - 2);
  const tx = column - col0;
  const ty = row - row0;

  const at = (c: number, r: number) => grid.samples[r * grid.width + c];
  const top = at(col0, row0) * (1 - tx) + at(col0 + 1, row0) * tx;
  const bottom = at(col0, row0 + 1) * (1 - tx) + at(col0 + 1, row0 + 1) * tx;
  return (top * (1 - ty) + bottom * ty) * grid.metersPerUnit;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
