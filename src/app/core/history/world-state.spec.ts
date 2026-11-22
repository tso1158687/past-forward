import { HistoricalEvent } from './historical-event';
import { MilitaryUnit, Scenario, UnitPosition } from './scenario';
import { deriveWorldState } from './world-state';

const WEST = { lon: 20, lat: 52 };
const EAST = { lon: 26, lat: 54 };
const FAR_EAST = { lon: 30, lat: 54 };

const stated = (day: number, location: { lon: number; lat: number }): UnitPosition => ({
  day,
  location,
  description: { 'zh-TW': '測試位置' },
  certainty: 'confirmed',
  estimated: false,
  breaksMovement: false,
  sourceIds: ['source'],
});

const AT_WEST = stated(2, WEST);
const AT_EAST = stated(6, EAST);
const AT_FAR_EAST = stated(7, FAR_EAST);

/** Stated at WEST on day 2, at EAST on day 6 and at FAR_EAST on day 7. */
const MOVER: MilitaryUnit = {
  id: 'mover',
  name: { 'zh-TW': '移動單位' },
  faction: 'german',
  type: 'motorized-corps',
  ordinal: 1,
  placement: { 'zh-TW': '測試' },
  interpolatesGaps: true,
  positions: [AT_WEST, AT_EAST, AT_FAR_EAST],
};

/** The same positions, but nothing is known about the days in between. */
const SIGHTED: MilitaryUnit = { ...MOVER, id: 'sighted', interpolatesGaps: false };

const STATIONARY: MilitaryUnit = {
  id: 'stationary',
  name: { 'zh-TW': '固定單位' },
  faction: 'soviet',
  type: 'army',
  ordinal: 2,
  placement: { 'zh-TW': '測試' },
  interpolatesGaps: true,
  positions: [stated(0, EAST)],
};

/** Lasts for calendar days 8 and 9, the last two days of the scenario. */
const CLOSING_EVENT: HistoricalEvent = {
  id: 'closing',
  startDay: 8,
  endDay: 9,
  title: { 'zh-TW': '結尾事件' },
  summary: { 'zh-TW': '結尾事件' },
  certainty: 'confirmed',
  places: [],
  sourceIds: ['source'],
};

const SCENARIO: Scenario = {
  kind: 'demonstration',
  epoch: { year: 1941, month: 6, day: 22 },
  timeRange: { startDay: 0, endDay: 10 },
  units: [MOVER, STATIONARY, SIGHTED],
  situations: [],
  story: [],
  borders: [],
  events: [CLOSING_EVENT],
  sources: [{ id: 'source', citation: 'Test source', kind: 'primary' }],
};

const unitAt = (unitId: string, day: number) =>
  deriveWorldState(SCENARIO, day).units.find((unit) => unit.unitId === unitId);
const moverAt = (day: number) => unitAt('mover', day);
const anchoredAt = (position: UnitPosition) => ({
  unitId: 'mover',
  location: position.location,
  basis: 'anchor',
  stated: position,
  run: 0,
});

describe('deriveWorldState', () => {
  it('records the day it was derived for', () => {
    expect(deriveWorldState(SCENARIO, 3.25).day).toBe(3.25);
  });

  it('leaves out a unit before its first stated day', () => {
    expect(moverAt(1.99)).toBeUndefined();
  });

  it('keeps a unit at its stated position for that whole day', () => {
    expect(moverAt(2)).toEqual(anchoredAt(AT_WEST));
    expect(moverAt(2.7)).toEqual(anchoredAt(AT_WEST));
    expect(moverAt(3)).toEqual(anchoredAt(AT_WEST));
  });

  it('interpolates in a straight line between two stated days and marks it as such', () => {
    // Movement runs from the end of day 2 (t = 3) to the start of day 6 (t = 6).
    const midway = moverAt(4.5);
    expect(midway?.basis).toBe('interpolated');
    expect(midway?.location.lon).toBeCloseTo(23);
    expect(midway?.location.lat).toBeCloseTo(53);
    expect(midway?.stated).toBeUndefined();
  });

  it('leaves a unit that does not interpolate off the map between two stated days', () => {
    expect(unitAt('sighted', 1.99)).toBeUndefined();
    expect(unitAt('sighted', 2)?.stated).toBe(AT_WEST);
    expect(unitAt('sighted', 2.99)?.stated).toBe(AT_WEST);
    expect(unitAt('sighted', 3)).toBeUndefined();
    expect(unitAt('sighted', 5.99)).toBeUndefined();
    expect(unitAt('sighted', 6)?.stated).toBe(AT_EAST);
    expect(unitAt('sighted', 7)?.stated).toBe(AT_FAR_EAST);
    expect(unitAt('sighted', 8)).toBeUndefined();
  });

  it('tells which run of continuous movement a unit that does not interpolate is in', () => {
    expect(unitAt('sighted', 2)?.run).toBe(0);
    expect(unitAt('sighted', 6)?.run).toBe(1);
    expect(unitAt('sighted', 7)?.run).toBe(1);
  });

  it('still shows a position stated for the last day at the very end of the time range', () => {
    const lastDay: MilitaryUnit = { ...SIGHTED, id: 'last-day', positions: [stated(9, EAST)] };
    const atEnd = deriveWorldState({ ...SCENARIO, units: [lastDay] }, 10);
    expect(atEnd.units.map((unit) => unit.unitId)).toEqual(['last-day']);
  });

  it('arrives exactly at the next stated position when its day starts', () => {
    expect(moverAt(6)).toEqual(anchoredAt(AT_EAST));
  });

  it('switches position at midnight when stated on consecutive days, without interpolating', () => {
    expect(moverAt(6.99)).toEqual(anchoredAt(AT_EAST));
    expect(moverAt(7)).toEqual(anchoredAt(AT_FAR_EAST));
  });

  it('leaves out a unit once its last stated day is over', () => {
    expect(moverAt(8)).toEqual(anchoredAt(AT_FAR_EAST));
    expect(moverAt(8.01)).toBeUndefined();
  });

  it('handles a unit with a single stated position', () => {
    const at = (day: number) =>
      deriveWorldState(SCENARIO, day).units.some((unit) => unit.unitId === 'stationary');
    expect(at(0)).toBe(true);
    expect(at(1)).toBe(true);
    expect(at(1.5)).toBe(false);
  });

  it('lists the events of the calendar day that contains the current time', () => {
    const eventIdsAt = (day: number) => deriveWorldState(SCENARIO, day).events.map((e) => e.id);
    expect(eventIdsAt(7.99)).toEqual([]);
    expect(eventIdsAt(8)).toEqual(['closing']);
    expect(eventIdsAt(9.5)).toEqual(['closing']);
  });

  it('still shows the events of the last day at the very end of the time range', () => {
    expect(deriveWorldState(SCENARIO, 10).events.map((e) => e.id)).toEqual(['closing']);
  });

  it('shows the front situation of the calendar day, and none on a day without one', () => {
    const evening = {
      day: 9,
      germanFront: [
        { lon: 27, lat: 56 },
        { lon: 28, lat: 50 },
      ],
      pockets: [],
      arrows: [],
      sourceIds: ['source'],
    };
    const scenario: Scenario = { ...SCENARIO, situations: [evening] };
    expect(deriveWorldState(scenario, 8.9).situation).toBeUndefined();
    expect(deriveWorldState(scenario, 9.4).situation).toBe(evening);
    // The very end of the range still belongs to the last calendar day.
    expect(deriveWorldState(scenario, 10).situation).toBe(evening);
  });

  it('gives the same result going forwards or backwards in time', () => {
    const forwards = [3, 4, 5].map((day) => deriveWorldState(SCENARIO, day));
    const backwards = [5, 4, 3].map((day) => deriveWorldState(SCENARIO, day)).reverse();
    expect(backwards).toEqual(forwards);
  });
});
