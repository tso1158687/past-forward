import { CanvasTexture, Group, MathUtils, Raycaster, Vector3 } from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { GeographicLocation } from '../../core/geo/geo-types';
import { Faction } from '../../core/history/scenario';
import { TerrainSurface } from '../terrain/terrain-surface';
import { createLabel, setLabelText } from './label';
import { spreadApart } from './spread-apart';
import {
  createUnitToken,
  drawTokenFace,
  TOKEN_THICKNESS,
  UnitSymbol,
  UnitToken,
} from './unit-token';

/** A unit to draw right now. The scene is told where units are; it never works that out itself. */
export interface UnitMarker {
  readonly id: string;
  /** Full designation, shown above the piece while it is hovered or selected. */
  readonly label: string;
  readonly location: GeographicLocation;
  readonly faction: Faction;
  readonly symbol: UnitSymbol;
  /** The number written on the piece. */
  readonly number: string;
  /**
   * How the location was obtained: `stated` by a source, `estimated` from a source that gives
   * only a rough area, or `interpolated` between two stated positions.
   */
  readonly basis: 'stated' | 'estimated' | 'interpolated';
  readonly selected: boolean;
  /**
   * Identifies a stretch of continuous movement. A piece slides to a new location only while
   * this stays the same; when it changes, the piece fades out and a new one fades in.
   */
  readonly run: number;
}

/** Where a unit has been: one line per stretch of continuous movement. */
export interface UnitTrail {
  readonly unitId: string;
  readonly faction: Faction;
  readonly lines: readonly (readonly GeographicLocation[])[];
}

/** How pieces get from where they are to where an update puts them. */
export interface UnitTransition {
  readonly seconds: number;
  /**
   * `linear` for playback, where one slide follows another without a pause; `eased` for a single
   * jump to another date.
   */
  readonly easing: 'linear' | 'eased';
}

/** What the layer needs to know about the camera to keep pieces readable. */
export interface UnitLayerView {
  readonly cameraDistance: number;
  readonly azimuthRadians: number;
}

/** Radius of a piece as a fraction of the camera distance, so it keeps its size on screen. */
const RADIUS_PER_CAMERA_DISTANCE = 0.019;
const FADE_SECONDS = 0.35;
const TRAIL_COLORS: Readonly<Record<Faction, string>> = { german: '#2f6fc4', soviet: '#d8432f' };
const TRAIL_WIDTH_PIXELS = 3.5;
const TRAIL_LIFT = 0.4;
/** A trail follows the relief by being sampled at least this often along each leg. */
const TRAIL_STEP_KM = 12;
const TRAIL_RENDER_ORDER = 3;
/** How far above the piece, in label heights, the name sits. */
const LABEL_ANCHOR: readonly [number, number] = [0.5, 2.4];
/** Pieces closer than this many diameters are moved apart on screen. */
const PIECE_SPACING = 1.1;
/**
 * A piece moved further than this many radii, so that the unit's real location is no longer under
 * it, gets a line back to that location.
 */
const LEADER_MIN_RADII = 1;
const LEADER_COLOR = '#2a2622';
const LEADER_WIDTH_PIXELS = 1.5;

interface Piece {
  readonly unitId: string;
  readonly token: UnitToken;
  readonly label: CSS2DObject;
  faceKey: string;
  from: GeographicLocation;
  to: GeographicLocation;
  /** 0 at `from`, 1 at `to`. */
  progress: number;
  slideSeconds: number;
  easing: UnitTransition['easing'];
  opacity: number;
  leaving: boolean;
  selected: boolean;
}

/**
 * Draws units as pieces standing on the map, with a trail behind each. Between two updates a
 * piece slides to its new location; that glide is only a screen transition and says nothing
 * about the route the unit took.
 */
export class UnitLayer {
  readonly object = new Group();

  private readonly pieces = new Map<string, Piece>();
  private readonly faces = new Map<string, CanvasTexture>();
  private readonly trailLines = new Map<string, LineSegments2>();
  private readonly trailMaterials: Record<Faction, LineMaterial>;
  private trails: readonly UnitTrail[] = [];
  /** Lines from pieces moved apart back to the units' real locations. */
  private readonly leaders = new LineSegments2(
    new LineSegmentsGeometry(),
    new LineMaterial({
      color: LEADER_COLOR,
      linewidth: LEADER_WIDTH_PIXELS,
      transparent: true,
      opacity: 0.85,
      depthTest: false,
      depthWrite: false,
    }),
  );
  private view: UnitLayerView = { cameraDistance: 1000, azimuthRadians: 0 };
  private hoveredUnitId: string | undefined;

  constructor(private readonly surface: TerrainSurface) {
    this.trailMaterials = {
      german: trailMaterial('german'),
      soviet: trailMaterial('soviet'),
    };
    this.leaders.renderOrder = TRAIL_RENDER_ORDER;
    this.leaders.visible = false;
    this.object.add(this.leaders);
  }

  /**
   * Shows exactly these units and trails. A unit already shown slides to its new location,
   * unless its run changed.
   */
  update(
    markers: readonly UnitMarker[],
    trails: readonly UnitTrail[],
    transition: UnitTransition,
  ): void {
    const shownKeys = new Set<string>();
    for (const marker of markers) {
      const key = `${marker.id}:${marker.run}`;
      shownKeys.add(key);
      const piece = this.pieces.get(key) ?? this.addPiece(key, marker);
      this.retarget(piece, marker, transition);
    }
    for (const [key, piece] of this.pieces) {
      if (!shownKeys.has(key)) piece.leaving = true;
    }
    this.trails = trails;
    this.rebuildTrails();
    this.refreshHighlights();
  }

  setView(view: UnitLayerView): void {
    this.view = view;
    this.placeAll();
  }

  /** Advances slides and fades. Returns true while something still has to change on screen. */
  animate(deltaSeconds: number): boolean {
    let animating = false;
    let slid = false;
    for (const [key, piece] of this.pieces) {
      if (piece.progress < 1) {
        piece.progress = Math.min(1, piece.progress + deltaSeconds / piece.slideSeconds);
        slid = true;
        animating = true;
      }
      const targetOpacity = piece.leaving ? 0 : 1;
      if (piece.opacity !== targetOpacity) {
        const step = deltaSeconds / FADE_SECONDS;
        piece.opacity = MathUtils.clamp(piece.opacity + (piece.leaving ? -step : step), 0, 1);
        piece.token.setOpacity(piece.opacity);
        animating = true;
      }
      if (piece.leaving && piece.opacity === 0) this.removePiece(key, piece);
    }
    this.placeAll();
    if (slid) this.rebuildTrails();
    return animating;
  }

  /** The unit whose piece the ray hits first, if any. */
  unitAt(raycaster: Raycaster): string | undefined {
    const discs = [...this.pieces.values()].filter((p) => !p.leaving).map((p) => p.token.disc);
    const hit = raycaster.intersectObjects(discs, false)[0];
    return hit ? (hit.object.userData['unitId'] as string) : undefined;
  }

  /** Returns true when the hovered unit changed, so that the caller can redraw. */
  setHovered(unitId: string | undefined): boolean {
    if (unitId === this.hoveredUnitId) return false;
    this.hoveredUnitId = unitId;
    this.refreshHighlights();
    return true;
  }

  dispose(): void {
    for (const [key, piece] of this.pieces) this.removePiece(key, piece);
    for (const texture of this.faces.values()) texture.dispose();
    for (const line of this.trailLines.values()) line.geometry.dispose();
    this.leaders.geometry.dispose();
    this.leaders.material.dispose();
    this.trailMaterials.german.dispose();
    this.trailMaterials.soviet.dispose();
  }

  private addPiece(key: string, marker: UnitMarker): Piece {
    const faceKey = faceKeyOf(marker);
    const token = createUnitToken(marker.faction, this.faceFor(marker));
    token.disc.userData['unitId'] = marker.id;
    token.setOpacity(0);

    const label = createLabel('unit-marker', marker.label);
    label.element.dataset['faction'] = marker.faction;
    label.center.set(...LABEL_ANCHOR);
    token.object.add(label);
    this.object.add(token.object);

    const piece: Piece = {
      unitId: marker.id,
      token,
      label,
      faceKey,
      from: marker.location,
      to: marker.location,
      progress: 1,
      slideSeconds: 1,
      easing: 'eased',
      opacity: 0,
      leaving: false,
      selected: marker.selected,
    };
    this.pieces.set(key, piece);
    return piece;
  }

  private retarget(piece: Piece, marker: UnitMarker, transition: UnitTransition): void {
    piece.leaving = false;
    piece.selected = marker.selected;
    setLabelText(piece.label, marker.label);

    const faceKey = faceKeyOf(marker);
    if (faceKey !== piece.faceKey) {
      piece.faceKey = faceKey;
      piece.token.setFace(this.faceFor(marker));
    }

    if (sameLocation(piece.to, marker.location)) return;
    piece.from = this.currentLocation(piece);
    piece.to = marker.location;
    piece.progress = transition.seconds > 0 ? 0 : 1;
    piece.slideSeconds = Math.max(transition.seconds, 0.001);
    piece.easing = transition.easing;
  }

  private removePiece(key: string, piece: Piece): void {
    // A CSS2D label only leaves the DOM once its object is removed from the scene graph.
    piece.token.object.remove(piece.label);
    this.object.remove(piece.token.object);
    piece.token.dispose();
    this.pieces.delete(key);
  }

  /** Faces are shared: every piece with the same look uses one texture. */
  private faceFor(marker: UnitMarker): CanvasTexture {
    const faceKey = faceKeyOf(marker);
    let texture = this.faces.get(faceKey);
    if (!texture) {
      texture = drawTokenFace({
        faction: marker.faction,
        symbol: marker.symbol,
        number: marker.number,
        estimated: marker.basis !== 'stated',
      });
      this.faces.set(faceKey, texture);
    }
    return texture;
  }

  private currentLocation(piece: Piece): GeographicLocation {
    const eased = piece.easing === 'eased' ? easeInOut(piece.progress) : piece.progress;
    return {
      lon: MathUtils.lerp(piece.from.lon, piece.to.lon, eased),
      lat: MathUtils.lerp(piece.from.lat, piece.to.lat, eased),
    };
  }

  /**
   * Puts every piece on the terrain, sized for the camera distance and turned to face the viewer.
   * Pieces that would overlap on screen are moved apart, each with a thin line back to where its
   * unit really is; the data keeps the real location. They are spread in a fixed order so that the
   * same moment always looks the same.
   */
  private placeAll(): void {
    const radius = this.view.cameraDistance * RADIUS_PER_CAMERA_DISTANCE;
    const lift = (TOKEN_THICKNESS / 2) * radius;
    const { projection } = this.surface;
    const pieces = [...this.pieces.entries()]
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([, piece]) => piece);
    const real = pieces.map((piece) => projection.project(this.currentLocation(piece)));
    const shown = spreadApart(real, 2 * radius * PIECE_SPACING);

    const leaders: number[] = [];
    pieces.forEach((piece, i) => {
      const location = projection.unproject(shown[i]);
      const { object } = piece.token;
      object.position.copy(this.surface.positionAt(location, lift));
      object.scale.setScalar(radius);
      // The top face is drawn with its "up" towards +x; a quarter turn points it north, and the
      // camera's azimuth keeps it upright for the viewer.
      object.rotation.y = Math.PI / 2 + this.view.azimuthRadians;

      const moved = Math.hypot(shown[i].x - real[i].x, shown[i].z - real[i].z);
      if (!piece.leaving && moved > LEADER_MIN_RADII * radius) {
        leaders.push(
          ...this.surface.positionAt(projection.unproject(real[i]), TRAIL_LIFT).toArray(),
          ...this.surface.positionAt(location, TRAIL_LIFT).toArray(),
        );
      }
    });
    this.leaders.visible = leaders.length > 0;
    if (leaders.length > 0) {
      this.leaders.geometry.dispose();
      this.leaders.geometry = new LineSegmentsGeometry().setPositions(leaders);
    }
  }

  private refreshHighlights(): void {
    for (const piece of this.pieces.values()) {
      const highlighted = piece.selected || piece.unitId === this.hoveredUnitId;
      piece.token.setHighlighted(highlighted);
      piece.label.visible = highlighted && !piece.leaving;
      piece.label.element.dataset['selected'] = String(piece.selected);
    }
  }

  /**
   * Redraws every trail. While a unit's piece is still sliding, its last line ends at the piece
   * instead of at the position it is heading for, so the line never runs ahead of the piece.
   */
  private rebuildTrails(): void {
    const shown = new Set<string>();
    for (const trail of this.trails) {
      shown.add(trail.unitId);
      const sliding = [...this.pieces.values()].find(
        (piece) => piece.unitId === trail.unitId && !piece.leaving && piece.progress < 1,
      );
      const lines = trail.lines.map((line, index) =>
        sliding && index === trail.lines.length - 1
          ? [...line.slice(0, -1), this.currentLocation(sliding)]
          : line,
      );
      const positions = this.trailPositions(lines);
      let object = this.trailLines.get(trail.unitId);
      if (!object) {
        object = new LineSegments2(new LineSegmentsGeometry(), this.trailMaterials[trail.faction]);
        object.renderOrder = TRAIL_RENDER_ORDER;
        this.trailLines.set(trail.unitId, object);
        this.object.add(object);
      }
      object.visible = positions.length > 0;
      if (positions.length === 0) continue;
      // The number of segments changes from day to day, and a line geometry cannot be resized.
      object.geometry.dispose();
      object.geometry = new LineSegmentsGeometry().setPositions(positions);
    }
    for (const [unitId, object] of this.trailLines) {
      if (shown.has(unitId)) continue;
      object.geometry.dispose();
      this.object.remove(object);
      this.trailLines.delete(unitId);
    }
  }

  /** Flat [x, y, z, x, y, z, ...] list with one start/end pair per line segment. */
  private trailPositions(lines: readonly (readonly GeographicLocation[])[]): number[] {
    const positions: number[] = [];
    for (const line of lines) {
      for (let index = 1; index < line.length; index++) {
        const points = this.alongRelief(line[index - 1], line[index]);
        for (let point = 1; point < points.length; point++) {
          positions.push(...points[point - 1].toArray(), ...points[point].toArray());
        }
      }
    }
    return positions;
  }

  private alongRelief(from: GeographicLocation, to: GeographicLocation): Vector3[] {
    const start = this.surface.positionAt(from, TRAIL_LIFT);
    const end = this.surface.positionAt(to, TRAIL_LIFT);
    const steps = Math.max(1, Math.ceil(start.distanceTo(end) / TRAIL_STEP_KM));
    return Array.from({ length: steps + 1 }, (_, step) => {
      const fraction = step / steps;
      return this.surface.positionAt(
        {
          lon: MathUtils.lerp(from.lon, to.lon, fraction),
          lat: MathUtils.lerp(from.lat, to.lat, fraction),
        },
        TRAIL_LIFT,
      );
    });
  }
}

function trailMaterial(faction: Faction): LineMaterial {
  return new LineMaterial({
    color: TRAIL_COLORS[faction],
    linewidth: TRAIL_WIDTH_PIXELS,
    transparent: true,
    opacity: 0.9,
    depthTest: false,
    depthWrite: false,
  });
}

function faceKeyOf(marker: UnitMarker): string {
  const symbol = marker.symbol.kind === 'character' ? marker.symbol.character : 'star';
  return [marker.faction, symbol, marker.number, marker.basis !== 'stated'].join('|');
}

function sameLocation(a: GeographicLocation, b: GeographicLocation): boolean {
  return a.lon === b.lon && a.lat === b.lat;
}

function easeInOut(progress: number): number {
  return progress * progress * (3 - 2 * progress);
}
