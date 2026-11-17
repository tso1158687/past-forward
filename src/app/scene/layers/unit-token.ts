import {
  CanvasTexture,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  RingGeometry,
  SRGBColorSpace,
} from 'three';
import { Faction } from '../../core/history/scenario';

/** What is drawn in the middle of a piece: one character, like a xiangqi piece, or a star. */
export type UnitSymbol =
  { readonly kind: 'character'; readonly character: string } | { readonly kind: 'star' };

/** Everything that decides how the top face of a piece looks. */
export interface TokenFace {
  readonly faction: Faction;
  readonly symbol: UnitSymbol;
  /** The number of the unit's designation, written small under the symbol. */
  readonly number: string;
  /** Draws the rim dashed, for a location that is only an estimate. */
  readonly estimated: boolean;
}

interface FactionColors {
  readonly face: string;
  readonly side: string;
  readonly rim: string;
  readonly symbol: string;
}

const COLORS: Readonly<Record<Faction, FactionColors>> = {
  german: { face: '#27496f', side: '#162c45', rim: '#e9e4d2', symbol: '#f4f1e4' },
  soviet: { face: '#8f2c23', side: '#571a14', rim: '#f0d9a0', symbol: '#ffd95a' },
};

const HIGHLIGHT_COLOR = '#ffd95a';
const FACE_PIXELS = 256;
const FONT_FAMILY = "'PingFang TC', 'Noto Sans TC', 'Microsoft JhengHei', sans-serif";

/** Height of a piece as a fraction of its radius. */
export const TOKEN_THICKNESS = 0.34;
/** Pieces are a map overlay like rivers: drawn over the relief, after the trails. */
const RENDER_ORDER = 6;

// One unit-radius disc shared by every piece; each piece scales its own group.
const DISC = new CylinderGeometry(1, 1, TOKEN_THICKNESS, 48);
const HIGHLIGHT_RING = new RingGeometry(1.12, 1.34, 48).rotateX(-Math.PI / 2);

/** A piece on the map: a thick disc with the unit's symbol on top, in the colours of its side. */
export interface UnitToken {
  readonly object: Group;
  readonly disc: Mesh;
  setFace(texture: CanvasTexture): void;
  setOpacity(opacity: number): void;
  setHighlighted(highlighted: boolean): void;
  dispose(): void;
}

export function createUnitToken(faction: Faction, face: CanvasTexture): UnitToken {
  // The piece ignores depth so that hills never cut into it; `transparent` makes the renderer
  // draw pieces back to front, and within one disc the side is drawn before the top.
  const overlay = { transparent: true, depthTest: false, depthWrite: false } as const;
  const side = new MeshBasicMaterial({ color: COLORS[faction].side, ...overlay });
  const top = new MeshBasicMaterial({ map: face, ...overlay });
  const disc = new Mesh(DISC, [side, top, side]);
  disc.renderOrder = RENDER_ORDER;

  const ring = new Mesh(
    HIGHLIGHT_RING,
    new MeshBasicMaterial({ color: HIGHLIGHT_COLOR, ...overlay }),
  );
  ring.position.y = -TOKEN_THICKNESS / 2;
  ring.renderOrder = RENDER_ORDER - 1;
  ring.visible = false;

  const object = new Group();
  object.add(ring, disc);
  const materials = [side, top, ring.material];

  return {
    object,
    disc,
    setFace(texture) {
      top.map = texture;
      top.needsUpdate = true;
    },
    setOpacity(opacity) {
      for (const material of materials) material.opacity = opacity;
    },
    setHighlighted(highlighted) {
      ring.visible = highlighted;
    },
    dispose() {
      for (const material of materials) material.dispose();
    },
  };
}

/** Paints the top face of a piece. The caller owns the texture and must dispose of it. */
export function drawTokenFace(face: TokenFace): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = FACE_PIXELS;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('2D canvas is not available');
  const colors = COLORS[face.faction];
  const centre = FACE_PIXELS / 2;

  context.fillStyle = colors.face;
  context.beginPath();
  context.arc(centre, centre, centre, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = colors.rim;
  context.lineWidth = 12;
  if (face.estimated) context.setLineDash([26, 18]);
  context.beginPath();
  context.arc(centre, centre, centre - 12, 0, Math.PI * 2);
  context.stroke();
  context.setLineDash([]);

  context.fillStyle = colors.symbol;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  if (face.symbol.kind === 'character') {
    context.font = `700 118px ${FONT_FAMILY}`;
    context.fillText(face.symbol.character, centre, 104);
  } else {
    fillStar(context, centre, 100, 58);
  }
  context.fillStyle = colors.rim;
  context.font = `700 64px ${FONT_FAMILY}`;
  context.fillText(face.number, centre, 194);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function fillStar(context: CanvasRenderingContext2D, x: number, y: number, radius: number): void {
  const innerRadius = radius * 0.4;
  context.beginPath();
  for (let point = 0; point < 10; point++) {
    const angle = -Math.PI / 2 + (point * Math.PI) / 5;
    const distance = point % 2 === 0 ? radius : innerRadius;
    context.lineTo(x + distance * Math.cos(angle), y + distance * Math.sin(angle));
  }
  context.closePath();
  context.fill();
}
