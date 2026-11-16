import { MilitaryUnit, Scenario } from './scenario';
import { deriveWorldState } from './world-state';

const WEST = { lon: 20, lat: 52 };
const EAST = { lon: 26, lat: 54 };
const FAR_EAST = { lon: 30, lat: 54 };

/** Stated at WEST on day 2, at EAST on day 6 and at FAR_EAST on day 7. */
const MOVER: MilitaryUnit = {
  id: 'mover',
  name: { 'zh-TW': '移動單位' },
  positions: [
    { day: 2, location: WEST },
    { day: 6, location: EAST },
    { day: 7, location: FAR_EAST },
  ],
};

const STATIONARY: MilitaryUnit = {
  id: 'stationary',
  name: { 'zh-TW': '固定單位' },
  positions: [{ day: 0, location: EAST }],
};

const SCENARIO: Scenario = {
  kind: 'demonstration',
  epoch: { year: 1941, month: 6, day: 22 },
  timeRange: { startDay: 0, endDay: 10 },
  units: [MOVER, STATIONARY],
};

const moverAt = (day: number) =>
  deriveWorldState(SCENARIO, day).units.find((unit) => unit.unitId === 'mover');

describe('deriveWorldState', () => {
  it('records the day it was derived for', () => {
    expect(deriveWorldState(SCENARIO, 3.25).day).toBe(3.25);
  });

  it('leaves out a unit before its first stated day', () => {
    expect(moverAt(1.99)).toBeUndefined();
  });

  it('keeps a unit at its stated position for that whole day', () => {
    expect(moverAt(2)).toEqual({ unitId: 'mover', location: WEST, basis: 'anchor' });
    expect(moverAt(2.7)).toEqual({ unitId: 'mover', location: WEST, basis: 'anchor' });
    expect(moverAt(3)).toEqual({ unitId: 'mover', location: WEST, basis: 'anchor' });
  });

  it('interpolates in a straight line between two stated days and marks it as such', () => {
    // Movement runs from the end of day 2 (t = 3) to the start of day 6 (t = 6).
    const midway = moverAt(4.5);
    expect(midway?.basis).toBe('interpolated');
    expect(midway?.location.lon).toBeCloseTo(23);
    expect(midway?.location.lat).toBeCloseTo(53);
  });

  it('arrives exactly at the next stated position when its day starts', () => {
    expect(moverAt(6)).toEqual({ unitId: 'mover', location: EAST, basis: 'anchor' });
  });

  it('switches position at midnight when stated on consecutive days, without interpolating', () => {
    expect(moverAt(6.99)).toEqual({ unitId: 'mover', location: EAST, basis: 'anchor' });
    expect(moverAt(7)).toEqual({ unitId: 'mover', location: FAR_EAST, basis: 'anchor' });
  });

  it('leaves out a unit once its last stated day is over', () => {
    expect(moverAt(8)).toEqual({ unitId: 'mover', location: FAR_EAST, basis: 'anchor' });
    expect(moverAt(8.01)).toBeUndefined();
  });

  it('handles a unit with a single stated position', () => {
    const at = (day: number) =>
      deriveWorldState(SCENARIO, day).units.some((unit) => unit.unitId === 'stationary');
    expect(at(0)).toBe(true);
    expect(at(1)).toBe(true);
    expect(at(1.5)).toBe(false);
  });

  it('gives the same result going forwards or backwards in time', () => {
    const forwards = [3, 4, 5].map((day) => deriveWorldState(SCENARIO, day));
    const backwards = [5, 4, 3].map((day) => deriveWorldState(SCENARIO, day)).reverse();
    expect(backwards).toEqual(forwards);
  });
});
