import { MapPoint } from '../../core/geo/map-projection';
import { spreadApart } from './spread-apart';

const smallestGap = (points: readonly MapPoint[]) => {
  let smallest = Infinity;
  points.forEach((a, i) =>
    points.slice(i + 1).forEach((b) => {
      smallest = Math.min(smallest, Math.hypot(a.x - b.x, a.z - b.z));
    }),
  );
  return smallest;
};

describe('spreadApart', () => {
  it('leaves points that do not overlap where they are', () => {
    const points = [
      { x: 0, z: 0 },
      { x: 30, z: 0 },
    ];
    expect(spreadApart(points, 20)).toEqual(points);
  });

  it('pushes two overlapping points apart equally along the line between them', () => {
    const [a, b] = spreadApart(
      [
        { x: 0, z: 0 },
        { x: 10, z: 0 },
      ],
      20,
    );
    expect(a.x).toBeCloseTo(-5);
    expect(b.x).toBeCloseTo(15);
    expect(a.z).toBeCloseTo(0);
  });

  it('separates points on exactly the same spot', () => {
    const spread = spreadApart(
      [
        { x: 5, z: 5 },
        { x: 5, z: 5 },
        { x: 5, z: 5 },
      ],
      20,
    );
    expect(smallestGap(spread)).toBeGreaterThan(19);
  });

  it('untangles a crowded cluster so that no two overlap and none strays far', () => {
    const cluster = Array.from({ length: 6 }, (_, i) => ({ x: i * 3, z: (i % 2) * 4 }));
    const spread = spreadApart(cluster, 20);
    expect(smallestGap(spread)).toBeGreaterThan(19);
    spread.forEach((point, i) =>
      expect(Math.hypot(point.x - cluster[i].x, point.z - cluster[i].z)).toBeLessThan(60),
    );
  });

  it('gives the same answer every time for the same points', () => {
    const points = [
      { x: 1, z: 2 },
      { x: 3, z: 1 },
      { x: 2, z: 2 },
    ];
    expect(spreadApart(points, 20)).toEqual(spreadApart(points, 20));
  });
});
