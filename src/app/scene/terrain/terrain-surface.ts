import { Vector3 } from 'three';
import { ElevationGrid, sampleElevationMeters } from '../../core/geo/elevation-grid';
import { GeographicLocation } from '../../core/geo/geo-types';
import { createMapProjection, MapProjection } from '../../core/geo/map-projection';

/**
 * Answers "where in the scene is this place?" for every layer, so that terrain, rivers, labels
 * and (later) units all agree on projection and vertical exaggeration.
 */
export interface TerrainSurface {
  readonly grid: ElevationGrid;
  readonly projection: MapProjection;
  /** Scene position on the terrain surface, optionally lifted above it by `lift` scene units. */
  positionAt(location: GeographicLocation, lift?: number): Vector3;
}

export function createTerrainSurface(
  grid: ElevationGrid,
  verticalExaggeration: number,
): TerrainSurface {
  const projection = createMapProjection(grid.bounds);
  return {
    grid,
    projection,
    positionAt(location, lift = 0) {
      const { x, z } = projection.project(location);
      // Water is drawn as a flat surface at sea level rather than as a basin.
      const landMeters = Math.max(sampleElevationMeters(grid, location), 0);
      return new Vector3(x, (landMeters / 1000) * verticalExaggeration + lift, z);
    },
  };
}
