import { GeoBounds, GeographicLocation } from '../geo/geo-types';
import { LocalizedText } from '../i18n/localized-text';

/** Soviet forces that the source shows cut off behind the German front on one evening. */
export interface Pocket {
  readonly outline: readonly GeographicLocation[];
  /** What the source writes about the forces inside. */
  readonly description: LocalizedText;
}

/** A German arrow as the source draws it on that evening's map, from its tail to its tip. */
export interface SituationArrow {
  readonly points: readonly GeographicLocation[];
  /** Dashed arrows are drawn dashed on the source; what the dashes mean it does not say. */
  readonly style: 'solid' | 'dashed';
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
  /** The German arrows drawn on the source for that evening. */
  readonly arrows: readonly SituationArrow[];
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
 * The line bounding everything the foremost German units had reached by the evening of
 * `calendarDay`: at each latitude, the easternmost of the fronts of that evening and every one
 * before it. Unlike a single evening's front it never moves back west, which it would otherwise
 * do whenever the source happens not to draw a unit at the tip of an earlier advance. Empty when
 * no evening up to that day has a front.
 *
 * Every front must run from north to south without turning back (see `FrontSituation`).
 */
export function reachedLine(
  situations: readonly FrontSituation[],
  calendarDay: number,
): GeographicLocation[] {
  const fronts = situations
    .filter((situation) => situation.day <= calendarDay && situation.germanFront.length >= 2)
    .map((situation) => situation.germanFront);
  if (fronts.length <= 1) return [...(fronts[0] ?? [])];

  const easternmost = (lat: number) => Math.max(...fronts.map((front) => lonAt(front, lat)));
  const latitudes = [...new Set(fronts.flat().map((point) => point.lat))]
    .filter((lat) => Number.isFinite(easternmost(lat)))
    .sort((a, b) => b - a);

  const line: GeographicLocation[] = [];
  latitudes.forEach((lat, i) => {
    line.push({ lon: easternmost(lat), lat });
    const next = latitudes[i + 1];
    if (next === undefined) return;
    // Between two vertex latitudes every front is straight, so the easternmost one can only
    // change where two fronts cross; add those crossings that lie on the envelope.
    for (const crossing of crossingsBetween(fronts, lat, next)) {
      const lon = easternmost(crossing);
      if (fronts.filter((front) => Math.abs(lonAt(front, crossing) - lon) < 1e-9).length >= 2) {
        line.push({ lon, lat: crossing });
      }
    }
  });
  return withoutStraightRuns(line);
}

/** Longitude of a north-to-south line at a latitude; minus infinity outside its extent. */
function lonAt(front: readonly GeographicLocation[], lat: number): number {
  for (let i = 1; i < front.length; i++) {
    const [north, south] = [front[i - 1], front[i]];
    if (lat > north.lat || lat < south.lat) continue;
    if (north.lat === south.lat) return Math.max(north.lon, south.lon);
    return north.lon + ((lat - north.lat) / (south.lat - north.lat)) * (south.lon - north.lon);
  }
  return -Infinity;
}

/** Latitudes strictly between `north` and `south` where two of the fronts meet, north first. */
function crossingsBetween(
  fronts: readonly (readonly GeographicLocation[])[],
  north: number,
  south: number,
): number[] {
  const crossings: number[] = [];
  for (let i = 0; i < fronts.length; i++) {
    for (let j = i + 1; j < fronts.length; j++) {
      const atNorth = lonAt(fronts[i], north) - lonAt(fronts[j], north);
      const atSouth = lonAt(fronts[i], south) - lonAt(fronts[j], south);
      if (!Number.isFinite(atNorth) || !Number.isFinite(atSouth) || atNorth * atSouth >= 0) {
        continue;
      }
      crossings.push(north + ((south - north) * atNorth) / (atNorth - atSouth));
    }
  }
  return crossings.sort((a, b) => b - a);
}

/** Drops points that lie on the straight line between their neighbours. */
function withoutStraightRuns(line: readonly GeographicLocation[]): GeographicLocation[] {
  return line.filter((point, i) => {
    const [before, after] = [line[i - 1], line[i + 1]];
    if (!before || !after) return true;
    const cross =
      (point.lon - before.lon) * (after.lat - before.lat) -
      (point.lat - before.lat) * (after.lon - before.lon);
    return Math.abs(cross) > 1e-9;
  });
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
