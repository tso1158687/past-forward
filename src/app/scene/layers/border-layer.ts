import { Group, Vector3 } from 'three';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { GeographicLocation } from '../../core/geo/geo-types';
import { TerrainSurface } from '../terrain/terrain-surface';
import { createLabel } from './label';

export interface SceneBorder {
  readonly lines: readonly (readonly GeographicLocation[])[];
  /** Shown once, half-way along the border's longest line. */
  readonly label: string;
}

const LINE_COLOR = '#3b1d4f';
const LINE_WIDTH_PIXELS = 3.2;
/** Dash and gap lengths in scene units (kilometres on the ground). */
const DASH_KM = 9;
const GAP_KM = 3.5;
/** A pale band under the line keeps it readable on any relief colour. */
const CASING_COLOR = '#fff6dc';
const CASING_WIDTH_PIXELS = 6.5;
const CASING_OPACITY = 0.45;
const LIFT_ABOVE_TERRAIN = 0.35;
/** Above the rivers (1), below unit trails (3) and pieces; the dashes go over their casing. */
const CASING_RENDER_ORDER = 2;
const DASH_RENDER_ORDER = 2.5;

export function createBorderLayer(borders: readonly SceneBorder[], surface: TerrainSurface): Group {
  const group = new Group();
  for (const border of borders) {
    if (border.lines.length === 0) continue;
    const lines = border.lines.map((line) =>
      line.map((location) => surface.positionAt(location, LIFT_ABOVE_TERRAIN)),
    );
    const positions = segmentPositions(lines);

    const casing = new LineSegments2(
      new LineSegmentsGeometry().setPositions(positions),
      // Like the rivers, borders are a map overlay and ignore depth.
      new LineMaterial({
        color: CASING_COLOR,
        linewidth: CASING_WIDTH_PIXELS,
        transparent: true,
        opacity: CASING_OPACITY,
        depthTest: false,
        depthWrite: false,
      }),
    );
    casing.renderOrder = CASING_RENDER_ORDER;

    const dashes = new LineSegments2(
      new LineSegmentsGeometry().setPositions(positions),
      new LineMaterial({
        color: LINE_COLOR,
        linewidth: LINE_WIDTH_PIXELS,
        dashed: true,
        dashSize: DASH_KM,
        gapSize: GAP_KM,
        // Transparent objects are drawn after opaque ones, so an opaque line would end up under
        // its own casing.
        transparent: true,
        depthTest: false,
        depthWrite: false,
      }),
    );
    // Dashes are measured along the line; the segments are in order, so the pattern runs on.
    dashes.computeLineDistances();
    dashes.renderOrder = DASH_RENDER_ORDER;

    const label = createLabel('border-label', border.label);
    label.position.copy(pointHalfWayAlong(longest(lines)));
    // The label ends at the line instead of sitting on top of it.
    label.center.set(1, 0.5);
    group.add(casing, dashes, label);
  }
  return group;
}

/** Flat [x, y, z, x, y, z, ...] list with one start/end pair per line segment. */
function segmentPositions(lines: readonly (readonly Vector3[])[]): number[] {
  const positions: number[] = [];
  for (const points of lines) {
    for (let i = 1; i < points.length; i++) {
      positions.push(...points[i - 1].toArray(), ...points[i].toArray());
    }
  }
  return positions;
}

function lengthOf(line: readonly Vector3[]): number {
  let length = 0;
  for (let i = 1; i < line.length; i++) length += line[i].distanceTo(line[i - 1]);
  return length;
}

function longest(lines: readonly (readonly Vector3[])[]): readonly Vector3[] {
  return lines.reduce((a, b) => (lengthOf(b) > lengthOf(a) ? b : a));
}

function pointHalfWayAlong(line: readonly Vector3[]): Vector3 {
  let remaining = lengthOf(line) / 2;
  for (let i = 1; i < line.length; i++) {
    const segment = line[i].distanceTo(line[i - 1]);
    if (segment >= remaining) return line[i - 1].clone().lerp(line[i], remaining / segment);
    remaining -= segment;
  }
  return line[line.length - 1].clone();
}
