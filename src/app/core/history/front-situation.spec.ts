import { advanceArea, FrontSituation, reachedLine, situationOn } from './front-situation';

const BOUNDS = { west: 20, east: 30, south: 50, north: 56 };

const situation = (day: number): FrontSituation => ({
  day,
  germanFront: [
    { lon: 24, lat: 56.5 },
    { lon: 25, lat: 53 },
    { lon: 24.5, lat: 49.5 },
  ],
  pockets: [],
  arrows: [],
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

describe('reachedLine', () => {
  const evening = (day: number, germanFront: FrontSituation['germanFront']): FrontSituation => ({
    ...situation(day),
    germanFront,
  });
  // Day 1 pushes ahead in the north, day 2 in the south; day 2 falls back in the north.
  const situations = [
    evening(0, [
      { lon: 24, lat: 56 },
      { lon: 24, lat: 50 },
    ]),
    evening(1, [
      { lon: 28, lat: 56 },
      { lon: 24, lat: 50 },
    ]),
    evening(2, [
      { lon: 24, lat: 56 },
      { lon: 28, lat: 50 },
    ]),
  ];

  it('is the evening front itself on the first evening', () => {
    expect(reachedLine(situations, 0)).toEqual(situations[0].germanFront);
  });

  it('keeps the farthest point of every evening so far, meeting where the fronts cross', () => {
    expect(reachedLine(situations, 2)).toEqual([
      { lon: 28, lat: 56 },
      { lon: 26, lat: 53 },
      { lon: 28, lat: 50 },
    ]);
  });

  it('ignores evenings after the day', () => {
    expect(reachedLine(situations, 1)).toEqual(situations[1].germanFront);
  });

  it('has no line before the first evening with a front', () => {
    expect(reachedLine(situations, -1)).toEqual([]);
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
