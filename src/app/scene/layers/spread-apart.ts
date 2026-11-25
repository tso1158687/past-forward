import { MapPoint } from '../../core/geo/map-projection';

const MAX_ROUNDS = 32;
/** Turns between the directions given to pieces that sit exactly on top of each other. */
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

/**
 * Moves points that lie closer together than `minDistance` apart until none overlaps, each pair
 * giving way equally. Points already far enough from every other stay put. The result depends only
 * on the points and their order, never on earlier calls, so the same situation always looks the
 * same however the reader got to it.
 */
export function spreadApart(points: readonly MapPoint[], minDistance: number): MapPoint[] {
  const spread = points.map(({ x, z }) => ({ x, z }));
  for (let round = 0; round < MAX_ROUNDS; round++) {
    let moved = false;
    for (let i = 0; i < spread.length; i++) {
      for (let j = i + 1; j < spread.length; j++) {
        const a = spread[i];
        const b = spread[j];
        let dx = b.x - a.x;
        let dz = b.z - a.z;
        let distance = Math.hypot(dx, dz);
        if (distance >= minDistance) continue;
        if (distance < 1e-9) {
          // Exactly on top of each other: part them along a direction fixed by their order.
          const angle = (i + j) * GOLDEN_ANGLE;
          dx = Math.cos(angle);
          dz = Math.sin(angle);
          distance = 0;
        } else {
          dx /= distance;
          dz /= distance;
        }
        const push = (minDistance - distance) / 2;
        a.x -= dx * push;
        a.z -= dz * push;
        b.x += dx * push;
        b.z += dz * push;
        moved = true;
      }
    }
    if (!moved) break;
  }
  return spread;
}
