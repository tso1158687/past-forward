import { Group } from 'three';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { GeographicLocation } from '../../core/geo/geo-types';
import { TerrainSurface } from '../terrain/terrain-surface';
import { createLabel } from './label';

export interface SceneRiver {
  /** Natural Earth scale rank: lower means a more important river. */
  readonly scaleRank: number;
  readonly lines: readonly (readonly GeographicLocation[])[];
  /** Shown once along the river when present. */
  readonly label?: string;
}

const RIVER_COLOR = '#3f7fbf';
const LIFT_ABOVE_TERRAIN = 0.3;
const RENDER_ORDER = 1;

/** Line width in screen pixels by importance. */
const WIDTH_CLASSES = [
  { maxScaleRank: 7, widthPixels: 2.6 },
  { maxScaleRank: 9, widthPixels: 1.8 },
  { maxScaleRank: Infinity, widthPixels: 1.1 },
] as const;

export function createRiverLayer(rivers: readonly SceneRiver[], surface: TerrainSurface): Group {
  const group = new Group();

  let previousMaxRank = -Infinity;
  for (const { maxScaleRank, widthPixels } of WIDTH_CLASSES) {
    const minRank = previousMaxRank;
    const members = rivers.filter((r) => r.scaleRank > minRank && r.scaleRank <= maxScaleRank);
    previousMaxRank = maxScaleRank;
    if (members.length === 0) continue;

    const geometry = new LineSegmentsGeometry().setPositions(segmentPositions(members, surface));
    // Rivers are a map overlay: they ignore depth so that small mismatches between the river
    // centre lines and the low-resolution relief never hide them.
    const material = new LineMaterial({
      color: RIVER_COLOR,
      linewidth: widthPixels,
      depthTest: false,
      depthWrite: false,
    });
    const lines = new LineSegments2(geometry, material);
    lines.renderOrder = RENDER_ORDER;
    group.add(lines);
  }

  for (const river of rivers) {
    if (!river.label) continue;
    const label = createLabel('river-label', river.label);
    label.position.copy(surface.positionAt(labelAnchor(river), LIFT_ABOVE_TERRAIN));
    group.add(label);
  }
  return group;
}

/** Flat [x, y, z, x, y, z, ...] list with one start/end pair per line segment. */
function segmentPositions(rivers: readonly SceneRiver[], surface: TerrainSurface): number[] {
  const positions: number[] = [];
  for (const river of rivers) {
    for (const line of river.lines) {
      const points = line.map((location) => surface.positionAt(location, LIFT_ABOVE_TERRAIN));
      for (let i = 1; i < points.length; i++) {
        positions.push(...points[i - 1].toArray(), ...points[i].toArray());
      }
    }
  }
  return positions;
}

/** Middle vertex of the river's longest line – a simple, stable place for its name. */
function labelAnchor(river: SceneRiver): GeographicLocation {
  const longest = river.lines.reduce((a, b) => (b.length > a.length ? b : a));
  return longest[Math.floor(longest.length / 2)];
}
