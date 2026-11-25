import {
  BufferGeometry,
  CanvasTexture,
  Group,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  SRGBColorSpace,
} from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { GeographicLocation } from '../../core/geo/geo-types';
import { advanceArea } from '../../core/history/front-situation';
import { TerrainSurface } from '../terrain/terrain-surface';
import { arrowShape } from './arrow-shape';
import { createLabel } from './label';

/** What to shade on the map for one evening. Everything in it is an estimate. */
export interface SituationView {
  /** A line through the foremost German units that evening, drawn dashed. */
  readonly front: readonly GeographicLocation[];
  /** Everything the foremost units had reached by that evening lies west of this; it is shaded. */
  readonly reach: readonly GeographicLocation[];
  /** The German arrows of the evening, as drawn on the source: tail to tip. */
  readonly arrows: readonly SituationArrowView[];
  readonly frontLabel: string;
  readonly pockets: readonly SituationPocket[];
}

export interface SituationArrowView {
  readonly points: readonly GeographicLocation[];
  readonly style: 'solid' | 'dashed';
}

export interface SituationPocket {
  readonly outline: readonly GeographicLocation[];
  readonly label: string;
  /** Shown when the pointer rests on the label: what the source writes about these forces. */
  readonly description: string;
}

/** The painting is this many pixels wide; the height follows the map's proportions. */
const CANVAS_WIDTH = 1536;
const ADVANCE_FILL = 'rgba(47, 111, 196, 0.26)';
const FRONT_STROKE = 'rgba(28, 74, 150, 0.85)';
const POCKET_FILL = 'rgba(216, 67, 47, 0.3)';
const POCKET_STROKE = 'rgba(160, 32, 20, 0.9)';
const HATCH_STROKE = 'rgba(160, 32, 20, 0.55)';
const HATCH_SPACING_PIXELS = 7;
/** Estimates are drawn with dashed edges, like estimated unit positions. */
const DASH_PIXELS = [9, 6];
const ARROW_STROKE = 'rgba(22, 58, 140, 0.95)';
const ARROW_CASING = 'rgba(230, 240, 255, 0.75)';
const ARROW_WIDTH_PIXELS = 4;
const ARROW_DASH_PIXELS = [8, 5];
/** Length of the arrowhead along the shaft, and its half-width, in painting pixels. */
const ARROWHEAD_LENGTH_PIXELS = 16;
const ARROWHEAD_HALF_WIDTH_PIXELS = 9;
/** Above the relief, below rivers' labels, borders, trails and pieces. */
const RENDER_ORDER = 0.5;
const LABEL_LIFT = 0.4;
/** How far along the front line, from its northern end, its name sits. */
const FRONT_LABEL_FRACTION = 0.3;

interface Sheet {
  readonly mesh: Mesh<BufferGeometry, MeshBasicMaterial>;
  readonly canvas: HTMLCanvasElement;
  readonly texture: CanvasTexture;
  /** Opacity it is fading towards: 1 for the sheet in use, 0 for the one being replaced. */
  target: number;
}

/**
 * Shades the estimated German advance and the encircled Soviet forces onto the relief. The
 * shading is painted on a texture laid over the terrain, so it follows hills and is hidden behind
 * them like the ground itself. A new evening fades in over the previous one; no in-between shape
 * is ever drawn.
 */
export class SituationLayer {
  readonly object = new Group();

  private readonly sheets: [Sheet, Sheet];
  private readonly labels = new Group();
  private current = 0;
  private fadeSeconds = 0;

  constructor(
    private readonly surface: TerrainSurface,
    surfaceGeometry: BufferGeometry,
  ) {
    this.sheets = [this.createSheet(surfaceGeometry), this.createSheet(surfaceGeometry)];
    this.object.add(this.sheets[0].mesh, this.sheets[1].mesh, this.labels);
  }

  /** Shows exactly this situation, or nothing, fading from whatever was shown before. */
  update(view: SituationView | undefined, fadeSeconds: number): void {
    const previous = this.sheets[this.current];
    this.current = 1 - this.current;
    const next = this.sheets[this.current];
    previous.target = 0;
    next.target = view ? 1 : 0;
    this.fadeSeconds = fadeSeconds;
    this.paint(next, view);
    this.replaceLabels(view);
    if (fadeSeconds <= 0) this.animate(0);
  }

  /** Advances the fade. Returns whether anything is still changing. */
  animate(deltaSeconds: number): boolean {
    let changing = false;
    for (const sheet of this.sheets) {
      const material = sheet.mesh.material;
      if (material.opacity === sheet.target) continue;
      const step = this.fadeSeconds > 0 ? deltaSeconds / this.fadeSeconds : 1;
      material.opacity =
        sheet.target > material.opacity
          ? Math.min(sheet.target, material.opacity + step)
          : Math.max(sheet.target, material.opacity - step);
      sheet.mesh.visible = material.opacity > 0;
      changing ||= material.opacity !== sheet.target;
    }
    return changing;
  }

  dispose(): void {
    for (const sheet of this.sheets) {
      sheet.texture.dispose();
      sheet.mesh.material.dispose();
    }
    this.clearLabels();
  }

  private createSheet(surfaceGeometry: BufferGeometry): Sheet {
    const { width, height } = this.surface.grid;
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = Math.round((CANVAS_WIDTH * height) / width);
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.minFilter = LinearFilter;
    texture.generateMipmaps = false;
    // Like the relief texture: the first row of pixels is the northern edge.
    texture.flipY = false;
    const mesh = new Mesh(
      surfaceGeometry,
      new MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        // The sheet lies exactly on the relief; the offset keeps it from flickering against it.
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      }),
    );
    mesh.renderOrder = RENDER_ORDER;
    mesh.visible = false;
    return { mesh, canvas, texture, target: 0 };
  }

  private paint(sheet: Sheet, view: SituationView | undefined): void {
    const { canvas } = sheet;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (view) {
      const trace = (points: readonly GeographicLocation[], close: boolean) => {
        context.beginPath();
        points.forEach((location, i) => {
          const { x, y } = this.canvasPoint(canvas, location);
          if (i === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        });
        if (close) context.closePath();
      };

      trace(advanceArea(view.reach, this.surface.grid.bounds), true);
      context.fillStyle = ADVANCE_FILL;
      context.fill();

      context.lineJoin = 'round';
      context.setLineDash(DASH_PIXELS);
      trace(view.front, false);
      context.strokeStyle = FRONT_STROKE;
      context.lineWidth = 3.5;
      context.stroke();

      const hatch = context.createPattern(hatchTile(), 'repeat');
      for (const pocket of view.pockets) {
        trace(pocket.outline, true);
        context.fillStyle = POCKET_FILL;
        context.fill();
        if (hatch) {
          context.fillStyle = hatch;
          context.fill();
        }
        context.strokeStyle = POCKET_STROKE;
        context.lineWidth = 2.5;
        context.stroke();
      }
      context.setLineDash([]);
      for (const arrow of view.arrows) this.paintArrow(context, canvas, arrow);
    }
    sheet.texture.needsUpdate = true;
  }

  /** A shaft along the arrow's points with a solid head at its tip, on a pale casing. */
  private paintArrow(
    context: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    arrow: SituationArrowView,
  ): void {
    const shape = arrowShape(
      arrow.points.map((location) => this.canvasPoint(canvas, location)),
      ARROWHEAD_LENGTH_PIXELS,
      ARROWHEAD_HALF_WIDTH_PIXELS,
    );
    if (!shape) return;
    const { shaft, tip, headCorners } = shape;
    const dashed = arrow.style === 'dashed';

    const traceShaft = () => {
      context.beginPath();
      shaft.forEach(({ x, y }, i) => (i === 0 ? context.moveTo(x, y) : context.lineTo(x, y)));
    };
    const traceHead = () => {
      context.beginPath();
      context.moveTo(tip.x, tip.y);
      for (const { x, y } of headCorners) context.lineTo(x, y);
      context.closePath();
    };

    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.setLineDash([]);
    traceShaft();
    context.strokeStyle = ARROW_CASING;
    context.lineWidth = ARROW_WIDTH_PIXELS + 3;
    context.stroke();
    traceHead();
    context.lineWidth = 3;
    context.stroke();

    // Round ends would fill the gaps between dashes, so dashes are cut square.
    context.lineCap = dashed ? 'butt' : 'round';
    context.setLineDash(dashed ? ARROW_DASH_PIXELS : []);
    traceShaft();
    context.strokeStyle = ARROW_STROKE;
    context.lineWidth = ARROW_WIDTH_PIXELS;
    context.stroke();
    context.setLineDash([]);
    traceHead();
    context.fillStyle = ARROW_STROKE;
    context.fill();
  }

  /** Where a place falls on the painting, matching the relief's texture coordinates. */
  private canvasPoint(canvas: HTMLCanvasElement, { lon, lat }: GeographicLocation) {
    const { bounds, width, height } = this.surface.grid;
    const east = (lon - bounds.west) / (bounds.east - bounds.west);
    const south = (bounds.north - lat) / (bounds.north - bounds.south);
    return {
      x: ((east * (width - 1) + 0.5) / width) * canvas.width,
      y: ((south * (height - 1) + 0.5) / height) * canvas.height,
    };
  }

  private replaceLabels(view: SituationView | undefined): void {
    this.clearLabels();
    if (!view) return;
    if (view.front.length >= 2) {
      const label = createLabel('situation-label situation-label-front', view.frontLabel);
      label.position.copy(
        this.surface.positionAt(pointAlong(view.front, FRONT_LABEL_FRACTION), LABEL_LIFT),
      );
      // The name ends at the line, on the shaded side.
      label.center.set(1, 0.5);
      this.labels.add(label);
    }
    // The areas often lie side by side, so only the largest is named; its tooltip covers them all.
    const largest = [...view.pockets].sort((a, b) => extent(b.outline) - extent(a.outline))[0];
    if (largest) {
      const label = createLabel('situation-label situation-label-pocket', largest.label);
      label.element.title = view.pockets.map((pocket) => pocket.description).join('\n');
      label.position.copy(this.surface.positionAt(centreOf(largest.outline), LABEL_LIFT));
      this.labels.add(label);
    }
  }

  private clearLabels(): void {
    for (const label of [...this.labels.children]) {
      this.labels.remove(label);
      // A CSS2DObject's element stays in the page until it is removed by hand.
      if (label instanceof CSS2DObject) label.element.remove();
    }
  }
}

/** A small tile of diagonal lines; repeated, it hatches an area. */
function hatchTile(): HTMLCanvasElement {
  const size = HATCH_SPACING_PIXELS;
  const tile = document.createElement('canvas');
  tile.width = tile.height = size;
  const context = tile.getContext('2d');
  if (context) {
    context.strokeStyle = HATCH_STROKE;
    context.lineWidth = 1.2;
    // One diagonal through the tile, plus its continuations in the corners so that tiles join.
    for (const offset of [-size, 0, size]) {
      context.beginPath();
      context.moveTo(offset, size);
      context.lineTo(offset + size, 0);
      context.stroke();
    }
  }
  return tile;
}

/** The point `fraction` of the way along a line of places, measured in degrees. */
function pointAlong(line: readonly GeographicLocation[], fraction: number): GeographicLocation {
  const lengths = line.slice(1).map((point, i) => distance(line[i], point));
  let remaining = lengths.reduce((sum, length) => sum + length, 0) * fraction;
  for (let i = 0; i < lengths.length; i++) {
    if (lengths[i] > 0 && lengths[i] >= remaining) {
      const t = remaining / lengths[i];
      return {
        lon: line[i].lon + (line[i + 1].lon - line[i].lon) * t,
        lat: line[i].lat + (line[i + 1].lat - line[i].lat) * t,
      };
    }
    remaining -= lengths[i];
  }
  return line[line.length - 1];
}

function distance(a: GeographicLocation, b: GeographicLocation): number {
  return Math.hypot(a.lon - b.lon, a.lat - b.lat);
}

/** Area of the box around an outline, in square degrees: enough to tell which shape is largest. */
function extent(outline: readonly GeographicLocation[]): number {
  const lons = outline.map((point) => point.lon);
  const lats = outline.map((point) => point.lat);
  return (Math.max(...lons) - Math.min(...lons)) * (Math.max(...lats) - Math.min(...lats));
}

/** The average of an outline's corners: good enough to place a name inside a compact shape. */
function centreOf(outline: readonly GeographicLocation[]): GeographicLocation {
  const sum = outline.reduce(
    (acc, point) => ({ lon: acc.lon + point.lon, lat: acc.lat + point.lat }),
    {
      lon: 0,
      lat: 0,
    },
  );
  return { lon: sum.lon / outline.length, lat: sum.lat / outline.length };
}
