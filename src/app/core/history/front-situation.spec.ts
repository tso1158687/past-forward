import { advanceArea, FrontSituation, situationOn } from './front-situation';

const BOUNDS = { west: 20, east: 30, south: 50, north: 56 };

const situation = (day: number): FrontSituation => ({
  day,
  germanFront: [
    { lon: 24, lat: 56.5 },
    { lon: 25, lat: 53 },
    { lon: 24.5, lat: 49.5 },
  ],
  pockets: [],
  sourceIds: ['source'],
});

describe('situationOn', () => {
  const situations = [situation(0), situation(2)];

  it('returns the situation stated for that calendar day', () => {
    expect(situationOn(situations, 2)).toBe(situations[1]);
  });

  it('carries nothing over to a day without a stated situation', () => {
    expect(situationOn(situations, 1)).toBeUndefined();
    expect(situationOn(situations, 3)).toBeUndefined();
  });
});

describe('advanceArea', () => {
  it('closes the front line along the western edge of the map', () => {
    expect(advanceArea(situation(0).germanFront, BOUNDS)).toEqual([
      { lon: 20, lat: 56.5 },
      { lon: 24, lat: 56.5 },
      { lon: 25, lat: 53 },
      { lon: 24.5, lat: 49.5 },
      { lon: 20, lat: 49.5 },
    ]);
  });

  it('has no area when there is no line to speak of', () => {
    expect(advanceArea([], BOUNDS)).toEqual([]);
    expect(advanceArea([{ lon: 24, lat: 53 }], BOUNDS)).toEqual([]);
  });
});
