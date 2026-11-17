import { GeographicLocation } from '../geo/geo-types';
import { displayedDay } from '../timeline/timeline-state';
import { eventsOnDay, HistoricalEvent } from './historical-event';
import { MilitaryUnit, Scenario, UnitPosition } from './scenario';

/**
 * How a unit's location at a given time was obtained:
 * - `anchor`: the time falls on a day for which the scenario states the unit's position.
 * - `interpolated`: the time falls between two stated positions and the location is a straight-
 *   line estimate made only so that movement can be shown. It is not a claim about the past.
 */
export type PositionBasis = 'anchor' | 'interpolated';

export interface UnitState {
  readonly unitId: string;
  readonly location: GeographicLocation;
  readonly basis: PositionBasis;
  /** The stated position being shown; absent while the location is interpolated. */
  readonly stated?: UnitPosition;
}

/** The situation on the map at one moment. Derived from a scenario; never stored or mutated. */
export interface WorldState {
  readonly day: number;
  readonly units: readonly UnitState[];
  /** Events taking place on the calendar day that contains `day`, in chronological order. */
  readonly events: readonly HistoricalEvent[];
}

const DAY_LENGTH = 1;

export function deriveWorldState(scenario: Scenario, day: number): WorldState {
  const calendarDay = displayedDay({ range: scenario.timeRange, currentDay: day });
  const units: UnitState[] = [];
  for (const unit of scenario.units) {
    const state = unit.interpolatesGaps
      ? movingStateAt(unit, day)
      : statedStateOn(unit, calendarDay);
    if (state) units.push(state);
  }
  return { day, units, events: eventsOnDay(scenario.events, calendarDay) };
}

/**
 * For a unit whose whereabouts between stated positions are not known: it is in the world state
 * only on a calendar day for which a position is stated.
 */
function statedStateOn(unit: MilitaryUnit, calendarDay: number): UnitState | undefined {
  const stated = unit.positions.find((position) => position.day === calendarDay);
  return stated && { unitId: unit.id, location: stated.location, basis: 'anchor', stated };
}

/**
 * For a unit that interpolates gaps: a stated position holds for its whole day, and between the
 * end of one stated day and the start of the next the unit moves in a straight line. Outside its
 * first and last stated days its whereabouts are unknown, so it is not in the world state.
 */
function movingStateAt(unit: MilitaryUnit, day: number): UnitState | undefined {
  const { positions } = unit;
  if (positions.length === 0) return undefined;
  const first = positions[0];
  const last = positions[positions.length - 1];
  if (day < first.day || day > last.day + DAY_LENGTH) return undefined;

  const previous = lastPositionStartingBy(positions, day);
  const departure = previous.day + DAY_LENGTH;
  const next = positions[positions.indexOf(previous) + 1];
  if (day <= departure || !next) {
    return { unitId: unit.id, location: previous.location, basis: 'anchor', stated: previous };
  }

  const progress = (day - departure) / (next.day - departure);
  return {
    unitId: unit.id,
    location: interpolateLocation(previous.location, next.location, progress),
    basis: 'interpolated',
  };
}

/** The latest position whose day has started by `day`. `day` must not precede the first one. */
function lastPositionStartingBy(positions: readonly UnitPosition[], day: number): UnitPosition {
  let found = positions[0];
  for (const position of positions) {
    if (position.day > day) break;
    found = position;
  }
  return found;
}

/** Linear in longitude and latitude, which is accurate enough over operational distances. */
function interpolateLocation(
  from: GeographicLocation,
  to: GeographicLocation,
  progress: number,
): GeographicLocation {
  return {
    lon: from.lon + (to.lon - from.lon) * progress,
    lat: from.lat + (to.lat - from.lat) * progress,
  };
}
