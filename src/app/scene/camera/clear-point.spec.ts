import { clearScreenPoint } from './clear-point';

const SIZE = { width: 800, height: 600 };
/** A panel across the bottom left, like the event and unit panels. */
const PANEL = { left: 0, top: 360, right: 600, bottom: 600 };

describe('clearScreenPoint', () => {
  it('leaves a point alone when nothing covers it', () => {
    expect(clearScreenPoint({ x: 400, y: 200 }, [PANEL], SIZE)).toBeUndefined();
  });

  it('moves a covered point just clear of the panel, the shortest way', () => {
    const point = clearScreenPoint({ x: 300, y: 420 }, [PANEL], SIZE);
    expect(point).toBeDefined();
    expect(point!.y).toBeLessThan(PANEL.top - 48 + 1);
    expect(point!.y).toBeGreaterThan(PANEL.top - 48 - 16);
    expect(Math.abs(point!.x - 300)).toBeLessThan(16);
  });

  it('counts a point closer to a panel than the margin as covered', () => {
    expect(clearScreenPoint({ x: 300, y: 340 }, [PANEL], SIZE)).toBeDefined();
  });

  it('brings a point back from beyond the screen edge', () => {
    const point = clearScreenPoint({ x: 900, y: 100 }, [], SIZE);
    expect(point!.x).toBeLessThanOrEqual(800 - 48);
  });

  it('gives up when the panels leave no room', () => {
    const everything = { left: 0, top: 0, right: 800, bottom: 600 };
    expect(clearScreenPoint({ x: 400, y: 300 }, [everything], SIZE)).toBeUndefined();
  });
});
