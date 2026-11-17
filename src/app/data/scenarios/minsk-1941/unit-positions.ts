import { UnitPosition } from '../../../core/history/scenario';

/** Campaign day of a date in June 1941; day 0 is 22 June. */
export const june = (dayOfMonth: number): number => dayOfMonth - 22;
/** Campaign day of a date in July 1941. */
export const july = (dayOfMonth: number): number => dayOfMonth + 8;

/** The evenings a position applies to. */
export type Days = readonly number[];
export const on = (day: number): Days => [day];
export const through = (first: number, last: number): Days =>
  Array.from({ length: last - first + 1 }, (_, offset) => first + offset);

/**
 * How a position was checked against its source (docs/research/minsk-unit-positions-daily.md and
 * minsk-unit-positions.md):
 * - `SEEN`: the author looked at the map sheet or the source text himself.
 * - `RELAYED`: two independent readers of the map agreed, or a research assistant reported the
 *   passage, but the author has not looked at it himself.
 */
export type Check = 'seen' | 'relayed';
export const SEEN: Check = 'seen';
export const RELAYED: Check = 'relayed';

const ATLAS = 'okh-atlas';

/**
 * A motorized corps on the evenings of `days`, placed at the main body of its leading panzer
 * division as drawn in the 1942 General Staff atlas. Passing `estimateNote` marks the location
 * as an estimate and says why.
 */
export function leading(
  days: Days,
  lon: number,
  lat: number,
  division: string,
  asPrinted: string,
  modernPlace: string,
  check: Check,
  estimateNote?: string,
): UnitPosition[] {
  const description = `當晚最靠前的是${division}。圖上位置：${asPrinted}。今日地名：${modernPlace}。`;
  return positions(days, lon, lat, description, check, [ATLAS], estimateNote);
}

/** An army on the evenings of `days`, placed where the atlas draws its headquarters flag. */
export function headquarters(
  days: Days,
  lon: number,
  lat: number,
  asPrinted: string,
  modernPlace: string,
  check: Check,
  estimateNote?: string,
): UnitPosition[] {
  const description = `司令部旗號的位置。圖上位置：${asPrinted}。今日地名：${modernPlace}。`;
  return positions(days, lon, lat, description, check, [ATLAS], estimateNote);
}

/** Which part of a Soviet army a written source locates. */
export type Subject = 'headquarters' | 'main-body';

const SUBJECT_LABEL: Readonly<Record<Subject, string>> = {
  headquarters: '司令部',
  'main-body': '主力',
};

/** A Soviet army on `days`, as located by a Soviet-side written source. */
export function recorded(
  days: Days,
  lon: number,
  lat: number,
  subject: Subject,
  where: string,
  check: Check,
  sourceId: string,
  estimateNote?: string,
): UnitPosition[] {
  const description = `${SUBJECT_LABEL[subject]}：${where}。`;
  return positions(days, lon, lat, description, check, [sourceId], estimateNote);
}

/**
 * Marks the first of `positions` as not reached by movement from the unit's previous position:
 * the marker now stands for a different part of the unit, so nothing is drawn between the two.
 */
export function replacing(positions: readonly UnitPosition[]): UnitPosition[] {
  return positions.map((position, index) =>
    index === 0 ? { ...position, breaksMovement: true } : position,
  );
}

function positions(
  days: Days,
  lon: number,
  lat: number,
  description: string,
  check: Check,
  sourceIds: readonly string[],
  estimateNote: string | undefined,
): UnitPosition[] {
  return days.map((day) => ({
    day,
    location: { lon, lat },
    description: { 'zh-TW': description },
    certainty: check === SEEN ? 'confirmed' : 'reported',
    estimated: estimateNote !== undefined,
    breaksMovement: false,
    ...(estimateNote === undefined ? {} : { note: { 'zh-TW': estimateNote } }),
    sourceIds,
  }));
}
