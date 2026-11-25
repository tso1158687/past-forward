import { Group } from 'three';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { GeographicLocation } from '../../core/geo/geo-types';
import { TerrainSurface } from '../terrain/terrain-surface';

export interface SceneRailway {
  readonly lines: readonly (readonly GeographicLocation[])[];
}

/** The classic map railway: a dark line with pale dashes along it. */
const RAIL_COLOR = '#2a2622';
const RAIL_WIDTH_PIXELS = 3;
const TIE_COLOR = '#f4ecd8';
const TIE_WIDTH_PIXELS = 1.4;
/** Dash and gap lengths in scene units (kilometres on the ground). */
const TIE_DASH_KM = 4;
const TIE_GAP_KM = 4;
const LIFT_ABOVE_TERRAIN = 0.3;
/** Above the rivers (1), below the borders (2) and unit trails (3). */
const RAIL_RENDER_ORDER = 1.5;
const TIE_RENDER_ORDER = 1.6;

export function createRailwayLayer(
  railways: readonly SceneRailway[],
  surface: TerrainSurface,
): Group {
  const group = new Group();
  const positions: number[] = [];
  for (const railway of railways) {
    for (const line of railway.lines) {
      const points = line.map((location) => surface.positionAt(location, LIFT_ABOVE_TERRAIN));
      for (let i = 1; i < points.length; i++) {
        positions.push(...points[i - 1].toArray(), ...points[i].toArray());
      }
    }
  }
  if (positions.length === 0) return group;

  // Like rivers and borders, railways are a map overlay and ignore depth.
  const rail = new LineSegments2(
    new LineSegmentsGeometry().setPositions(positions),
    new LineMaterial({
      color: RAIL_COLOR,
      linewidth: RAIL_WIDTH_PIXELS,
      transparent: true,
      opacity: 0.85,
      depthTest: false,
      depthWrite: false,
    }),
  );
  rail.renderOrder = RAIL_RENDER_ORDER;

  const ties = new LineSegments2(
    new LineSegmentsGeometry().setPositions(positions),
    new LineMaterial({
      color: TIE_COLOR,
      linewidth: TIE_WIDTH_PIXELS,
      dashed: true,
      dashSize: TIE_DASH_KM,
      gapSize: TIE_GAP_KM,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    }),
  );
  // Dashes are measured along the segments in order, so the pattern runs on along each line.
  ties.computeLineDistances();
  ties.renderOrder = TIE_RENDER_ORDER;

  group.add(rail, ties);
  return group;
}
