import { GeographicLocation } from '../geo/geo-types';
import { MilitaryUnit, UnitPosition } from './scenario';

/**
 * Whether the unit moved from `previous` to `position`. It did not if a day without a stated
 * position lies between them, or if `position` re-places the marker rather than moving it.
 */
export function movedFrom(previous: UnitPosition, position: UnitPosition): boolean {
  return position.day === previous.day + 1 && !position.breaksMovement;
}

/**
 * The unit's stated positions split into runs of continuous movement, in chronological order.
 * Within a run the unit moved from each position to the next; between runs it did not.
 */
export function movementRuns(unit: MilitaryUnit): UnitPosition[][] {
  const runs: UnitPosition[][] = [];
  let previous: UnitPosition | undefined;
  for (const position of unit.positions) {
    if (previous && movedFrom(previous, position)) runs[runs.length - 1].push(position);
    else runs.push([position]);
    previous = position;
  }
  return runs;
}

/** Index of the run that contains the position stated for `day`; undefined if none is stated. */
export function movementRunOn(unit: MilitaryUnit, day: number): number | undefined {
  const index = movementRuns(unit).findIndex((run) => run.some((p) => p.day === day));
  return index === -1 ? undefined : index;
}

/**
 * Where the unit has been up to and including `calendarDay`: one line of stated locations per
 * run of continuous movement. Every point is a stated position; nothing is interpolated.
 */
export function unitTrail(unit: MilitaryUnit, calendarDay: number): GeographicLocation[][] {
  return movementRuns(unit)
    .map((run) => run.filter((p) => p.day <= calendarDay).map((p) => p.location))
    .filter((line) => line.length > 0);
}
