import { MilitaryUnit, UnitPosition } from './scenario';
import { movedFrom, movementRunOn, movementRuns, unitTrail } from './unit-movement';

const at = (day: number, lon: number, breaksMovement = false): UnitPosition => ({
  day,
  location: { lon, lat: 53 },
  description: { 'zh-TW': '測試位置' },
  certainty: 'confirmed',
  estimated: false,
  breaksMovement,
  sourceIds: ['source'],
});

const unitWith = (positions: UnitPosition[]): MilitaryUnit => ({
  id: 'unit',
  name: { 'zh-TW': '測試部隊' },
  faction: 'german',
  type: 'motorized-corps',
  ordinal: 1,
  placement: { 'zh-TW': '測試' },
  interpolatesGaps: false,
  positions,
});

/** Days 0–2 are one advance; day 3 re-places the marker; day 4 follows it; day 7 is isolated. */
const UNIT = unitWith([at(0, 20), at(1, 21), at(2, 22), at(3, 19, true), at(4, 20), at(7, 25)]);
const lons = (lines: { lon: number }[][]) => lines.map((line) => line.map((p) => p.lon));

describe('movedFrom', () => {
  it('is true for the next day when the position does not break the movement', () => {
    expect(movedFrom(at(0, 20), at(1, 21))).toBe(true);
  });

  it('is false across a day without a stated position', () => {
    expect(movedFrom(at(0, 20), at(2, 21))).toBe(false);
  });

  it('is false when the new position re-places the marker', () => {
    expect(movedFrom(at(0, 20), at(1, 21, true))).toBe(false);
  });
});

describe('movementRuns', () => {
  it('splits the positions where the unit did not move from one to the next', () => {
    expect(movementRuns(UNIT).map((run) => run.map((p) => p.day))).toEqual([
      [0, 1, 2],
      [3, 4],
      [7],
    ]);
  });

  it('has no runs for a unit without positions', () => {
    expect(movementRuns(unitWith([]))).toEqual([]);
  });
});

describe('movementRunOn', () => {
  it('tells which run a day belongs to', () => {
    expect([0, 2, 3, 4, 7].map((day) => movementRunOn(UNIT, day))).toEqual([0, 0, 1, 1, 2]);
  });

  it('is undefined on a day without a stated position', () => {
    expect(movementRunOn(UNIT, 5)).toBeUndefined();
  });
});

describe('unitTrail', () => {
  it('is empty before the first stated day', () => {
    expect(unitTrail(UNIT, -1)).toEqual([]);
  });

  it('grows day by day within a run', () => {
    expect(lons(unitTrail(UNIT, 0))).toEqual([[20]]);
    expect(lons(unitTrail(UNIT, 2))).toEqual([[20, 21, 22]]);
  });

  it('starts a new line where the movement breaks, and keeps the earlier lines', () => {
    expect(lons(unitTrail(UNIT, 3))).toEqual([[20, 21, 22], [19]]);
    expect(lons(unitTrail(UNIT, 4))).toEqual([
      [20, 21, 22],
      [19, 20],
    ]);
  });

  it('keeps the whole trail on days when the unit has no stated position', () => {
    expect(lons(unitTrail(UNIT, 5))).toEqual(lons(unitTrail(UNIT, 4)));
    expect(lons(unitTrail(UNIT, 17))).toEqual([[20, 21, 22], [19, 20], [25]]);
  });
});
