import { GeoBounds, GeographicLocation } from '../geo/geo-types';
import { LocalizedText } from '../i18n/localized-text';

/** Soviet forces that the source shows cut off behind the German front on one evening. */
export interface Pocket {
  readonly outline: readonly GeographicLocation[];
  /** What the source writes about the forces inside. */
  readonly description: LocalizedText;
}

/**
 * One evening's picture of the front: how far the foremost German units had come and which
 * Soviet forces were cut off behind them. It is always an estimate. The line joins the foremost
 * units a source places, so the land west of it was reached by spearheads, not held throughout.
 */
export interface FrontSituation {
  /** The calendar day (an integer campaign day) whose evening this is. */
  readonly day: number;
  /**
   * A line through the foremost German units, from north to south. It starts at or beyond the
   * northern edge of the map and ends at or beyond the southern edge.
   */
  readonly germanFront: readonly GeographicLocation[];
  readonly pockets: readonly Pocket[];
  readonly sourceIds: readonly string[];
}

/** The situation stated for a calendar day. A day without one has none: nothing is carried over. */
export function situationOn(
  situations: readonly FrontSituation[],
  calendarDay: number,
): FrontSituation | undefined {
  return situations.find((situation) => situation.day === calendarDay);
}

/**
 * Outline of the land west of a front line, out to the western edge of `bounds`. Where the line
 * runs beyond the northern or southern edge the outline does too; whoever draws it clips it.
 */
export function advanceArea(
  front: readonly GeographicLocation[],
  bounds: GeoBounds,
): GeographicLocation[] {
  if (front.length < 2) return [];
  const first = front[0];
  const last = front[front.length - 1];
  return [{ lon: bounds.west, lat: first.lat }, ...front, { lon: bounds.west, lat: last.lat }];
}
