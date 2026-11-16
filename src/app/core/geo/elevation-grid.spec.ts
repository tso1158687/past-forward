import { ElevationGrid, gridCoordinates, sampleElevationMeters } from './elevation-grid';

/**
 * 3x3 grid over lon 0..2, lat 0..2, raw units of 0.1 m.
 * Row 0 is the north (lat 2):
 *   lat 2:  0  100  200
 *   lat 1: 10  110  210
 *   lat 0: 20  120  220
 */
const GRID: ElevationGrid = {
  bounds: { west: 0, east: 2, south: 0, north: 2 },
  width: 3,
  height: 3,
  metersPerUnit: 0.1,
  samples: Int16Array.from([0, 100, 200, 10, 110, 210, 20, 120, 220]),
};

describe('gridCoordinates', () => {
  it('maps the north-west corner to column 0, row 0', () => {
    expect(gridCoordinates(GRID, { lon: 0, lat: 2 })).toEqual({ column: 0, row: 0 });
  });

  it('maps the south-east corner to the last column and row', () => {
    expect(gridCoordinates(GRID, { lon: 2, lat: 0 })).toEqual({ column: 2, row: 2 });
  });
});

describe('sampleElevationMeters', () => {
  it('returns the node value in metres at a grid node', () => {
    expect(sampleElevationMeters(GRID, { lon: 1, lat: 1 })).toBeCloseTo(11);
    expect(sampleElevationMeters(GRID, { lon: 2, lat: 0 })).toBeCloseTo(22);
  });

  it('interpolates between nodes', () => {
    expect(sampleElevationMeters(GRID, { lon: 0.5, lat: 2 })).toBeCloseTo(5);
    expect(sampleElevationMeters(GRID, { lon: 0, lat: 1.5 })).toBeCloseTo(0.5);
    expect(sampleElevationMeters(GRID, { lon: 1.5, lat: 0.5 })).toBeCloseTo(16.5);
  });

  it('clamps locations outside the grid to the nearest edge', () => {
    expect(sampleElevationMeters(GRID, { lon: -5, lat: 9 })).toBeCloseTo(0);
    expect(sampleElevationMeters(GRID, { lon: 9, lat: -5 })).toBeCloseTo(22);
  });
});
