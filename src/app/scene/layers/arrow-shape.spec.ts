import { describe, expect, it } from 'vitest';
import { arrowShape } from './arrow-shape';

const HEAD = 16;
const HALF_WIDTH = 9;

describe('arrowShape', () => {
  it('stops the shaft where the head begins and centres the head on the tip', () => {
    const shape = arrowShape(
      [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ],
      HEAD,
      HALF_WIDTH,
    );
    expect(shape?.shaft).toEqual([
      { x: 0, y: 0 },
      { x: 84, y: 0 },
    ]);
    expect(shape?.tip).toEqual({ x: 100, y: 0 });
    expect(shape?.headCorners).toEqual([
      { x: 84, y: 9 },
      { x: 84, y: -9 },
    ]);
  });

  it('measures the head back along the line when the last segment is shorter than the head', () => {
    const shape = arrowShape(
      [
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 50, y: 6 },
      ],
      HEAD,
      HALF_WIDTH,
    );
    // 6 pixels of the head lie on the last segment, the other 10 on the one before.
    expect(shape?.shaft).toEqual([
      { x: 0, y: 0 },
      { x: 40, y: 0 },
    ]);
    expect(shape?.tip).toEqual({ x: 50, y: 6 });
  });

  it('shrinks the head to half of an arrow shorter than two heads, keeping its proportions', () => {
    const shape = arrowShape(
      [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
      ],
      HEAD,
      HALF_WIDTH,
    );
    expect(shape?.shaft).toEqual([
      { x: 0, y: 0 },
      { x: 5, y: 0 },
    ]);
    if (!shape) throw new Error('expected a shape');
    const [left, right] = shape.headCorners;
    expect(left.y - right.y).toBeCloseTo((2 * HALF_WIDTH * 5) / HEAD);
  });

  it('ignores repeated points and has no shape for an arrow with no length', () => {
    expect(
      arrowShape(
        [
          { x: 3, y: 4 },
          { x: 3, y: 4 },
        ],
        HEAD,
        HALF_WIDTH,
      ),
    ).toBeUndefined();
    const shape = arrowShape(
      [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 0 },
      ],
      HEAD,
      HALF_WIDTH,
    );
    expect(shape?.shaft).toEqual([
      { x: 0, y: 0 },
      { x: 84, y: 0 },
    ]);
  });
});
