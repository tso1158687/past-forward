import { isSea, terrainColor } from './terrain-palette';

describe('terrainColor', () => {
  it('treats sea level and below as sea', () => {
    expect(isSea(0)).toBe(true);
    expect(isSea(-30)).toBe(true);
    expect(isSea(0.5)).toBe(false);
  });

  it('returns the exact stop colour at a stop', () => {
    expect(terrainColor(220)).toEqual([200, 204, 138]);
  });

  it('interpolates halfway between two stops', () => {
    // Between 220 m [200, 204, 138] and 290 m [216, 192, 134].
    expect(terrainColor(255)).toEqual([208, 198, 136]);
  });

  it('clamps beyond the outermost stops', () => {
    expect(terrainColor(3000)).toEqual(terrainColor(560));
    expect(terrainColor(-500)).toEqual(terrainColor(-80));
  });
});
