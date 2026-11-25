/** A rectangle on the screen, in pixels from the top left of the map. */
export interface ScreenRect {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

export interface ScreenPoint {
  readonly x: number;
  readonly y: number;
}

/** How far from a panel or the screen edge a revealed place must be, so its piece shows whole. */
export const CLEAR_MARGIN_PIXELS = 48;
/** Spacing of the points tried as new screen positions. */
const SEARCH_STEP_PIXELS = 16;

/**
 * Where on the screen a place at `point` should move so that no panel covers it: `undefined` if
 * it is already clear, otherwise the nearest clear point, so the map moves as little as possible.
 * Also `undefined` when panels leave no room at all.
 */
export function clearScreenPoint(
  point: ScreenPoint,
  obstacles: readonly ScreenRect[],
  size: { readonly width: number; readonly height: number },
  margin: number = CLEAR_MARGIN_PIXELS,
): ScreenPoint | undefined {
  const isClear = ({ x, y }: ScreenPoint) =>
    x >= margin &&
    x <= size.width - margin &&
    y >= margin &&
    y <= size.height - margin &&
    obstacles.every(
      (rect) =>
        x < rect.left - margin ||
        x > rect.right + margin ||
        y < rect.top - margin ||
        y > rect.bottom + margin,
    );
  if (isClear(point)) return undefined;

  let best: ScreenPoint | undefined;
  let bestDistance = Infinity;
  for (let y = margin; y <= size.height - margin; y += SEARCH_STEP_PIXELS) {
    for (let x = margin; x <= size.width - margin; x += SEARCH_STEP_PIXELS) {
      const candidate = { x, y };
      const distance = Math.hypot(x - point.x, y - point.y);
      if (distance < bestDistance && isClear(candidate)) {
        best = candidate;
        bestDistance = distance;
      }
    }
  }
  return best;
}
