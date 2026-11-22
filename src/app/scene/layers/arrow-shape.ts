/** A point on a painting, in pixels. */
export interface CanvasPoint {
  readonly x: number;
  readonly y: number;
}

/** An arrow ready to paint: a shaft that stops where the head begins, and a triangular head. */
export interface ArrowShape {
  readonly shaft: readonly CanvasPoint[];
  readonly tip: CanvasPoint;
  /** The two back corners of the head. */
  readonly headCorners: readonly [CanvasPoint, CanvasPoint];
}

/**
 * Shapes an arrow drawn from its tail to its tip. The head is measured back along the line, so
 * it follows a bend near the tip; on an arrow shorter than two heads it shrinks to half the arrow,
 * keeping the tail visible. Returns nothing for an arrow with no length.
 */
export function arrowShape(
  points: readonly CanvasPoint[],
  headLength: number,
  headHalfWidth: number,
): ArrowShape | undefined {
  const path = points.filter(
    (point, i) => i === 0 || point.x !== points[i - 1].x || point.y !== points[i - 1].y,
  );
  const segments = path.slice(1).map((point, i) => distance(path[i], point));
  const total = segments.reduce((sum, segment) => sum + segment, 0);
  if (total === 0) return undefined;

  const length = Math.min(headLength, total / 2);
  const halfWidth = (headHalfWidth * length) / headLength;
  const tip = path[path.length - 1];

  // Walk back from the tip until the head's length is used up.
  let remaining = length;
  let end = path.length - 1;
  while (segments[end - 1] < remaining) {
    remaining -= segments[end - 1];
    end -= 1;
  }
  const from = path[end];
  const toward = path[end - 1];
  const share = remaining / segments[end - 1];
  const base = {
    x: from.x + (toward.x - from.x) * share,
    y: from.y + (toward.y - from.y) * share,
  };

  // The head points from its base to the tip; if the line bends back on itself so the two meet,
  // it points along the last segment instead.
  const reach = distance(base, tip);
  const last = path[path.length - 2];
  const [ux, uy] =
    reach > 0
      ? [(tip.x - base.x) / reach, (tip.y - base.y) / reach]
      : [
          (tip.x - last.x) / segments[segments.length - 1],
          (tip.y - last.y) / segments[segments.length - 1],
        ];
  return {
    shaft: [...path.slice(0, end), base],
    tip,
    headCorners: [
      { x: base.x - uy * halfWidth, y: base.y + ux * halfWidth },
      { x: base.x + uy * halfWidth, y: base.y - ux * halfWidth },
    ],
  };
}

function distance(a: CanvasPoint, b: CanvasPoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}
