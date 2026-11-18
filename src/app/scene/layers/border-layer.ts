import { Group, Vector3 } from 'three';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { GeographicLocation } from '../../core/geo/geo-types';
import { TerrainSurface } from '../terrain/terrain-surface';
import { createLabel } from './label';

export interface SceneBorder {
  /** `former` borders had been abolished and are drawn fainter than those `in-force`. */
  readonly kind: 'in-force' | 'former';
  readonly lines: readonly (readonly GeographicLocation[])[];
  /** Shown once, beside the border's longest line. */
  readonly label: string;
}

interface BorderStyle {
  readonly color: string;
  readonly widthPixels: number;
  /** Dash and gap lengths in scene units (kilometres on the ground). */
  readonly dashKm: number;
  readonly gapKm: number;
  /** A pale band under the line keeps it readable on any relief colour. */
  readonly casingWidthPixels: number;
  readonly casingOpacity: number;
  /**
   * How far along the line its name sits, from 0 (its start) to 1. Chosen by eye so that the
   * names stay clear of city names.
   */
  readonly labelFraction: number;
}

const STYLES: Readonly<Record<SceneBorder['kind'], BorderStyle>> = {
  'in-force': {
    color: '#3b1d4f',
    widthPixels: 3.2,
    dashKm: 9,
    gapKm: 3.5,
    casingWidthPixels: 6.5,
    casingOpacity: 0.45,
    labelFraction: 0.5,
  },
  former: {
    color: '#5b4a3a',
    widthPixels: 2,
    dashKm: 3,
    gapKm: 3,
    casingWidthPixels: 4.5,
    casingOpacity: 0.3,
    labelFraction: 0.3,
  },
};
const CASING_COLOR = '#fff6dc';
const LIFT_ABOVE_TERRAIN = 0.35;
/** Above the rivers (1), below unit trails (3) and pieces; the dashes go over their casing. */
const CASING_RENDER_ORDER = 2;
const DASH_RENDER_ORDER = 2.5;

export function createBorderLayer(borders: readonly SceneBorder[], surface: TerrainSurface): Group {
  const group = new Group();
  for (const border of borders) {
    if (border.lines.length === 0) continue;
    const style = STYLES[border.kind];
    const lines = border.lines.map((line) =>
      line.map((location) => surface.positionAt(location, LIFT_ABOVE_TERRAIN)),
    );
    const positions = segmentPositions(lines);

    const casing = new LineSegments2(
      new LineSegmentsGeometry().setPositions(positions),
      // Like the rivers, borders are a map overlay and ignore depth.
      new LineMaterial({
        color: CASING_COLOR,
        linewidth: style.casingWidthPixels,
        transparent: true,
        opacity: style.casingOpacity,
        depthTest: false,
        depthWrite: false,
      }),
    );
    casing.renderOrder = CASING_RENDER_ORDER;

    const dashes = new LineSegments2(
      new LineSegmentsGeometry().setPositions(positions),
      new LineMaterial({
        color: style.color,
        linewidth: style.widthPixels,
        dashed: true,
        dashSize: style.dashKm,
        gapSize: style.gapKm,
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

    const label = createLabel(`border-label border-label-${border.kind}`, border.label);
    label.position.copy(pointAlong(longest(lines), style.labelFraction));
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

/** The point `fraction` of the way along the line, measured by length. */
function pointAlong(line: readonly Vector3[], fraction: number): Vector3 {
  let remaining = lengthOf(line) * fraction;
  for (let i = 1; i < line.length; i++) {
    const segment = line[i].distanceTo(line[i - 1]);
    if (segment > 0 && segment >= remaining)
      return line[i - 1].clone().lerp(line[i], remaining / segment);
    remaining -= segment;
  }
  return line[line.length - 1].clone();
}
