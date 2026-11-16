import { GeographicLocation } from '../geo/geo-types';
import { LocalizedText } from '../i18n/localized-text';
import { CalendarDate } from '../timeline/calendar';
import { TimeRange } from '../timeline/timeline-state';

/**
 * "On this calendar day the unit was at this place." Sources rarely say more than the day, so a
 * position holds for the whole of `day` (an integer campaign day) and says nothing about hours.
 */
export interface UnitPosition {
  readonly day: number;
  readonly location: GeographicLocation;
}

export interface MilitaryUnit {
  readonly id: string;
  readonly name: LocalizedText;
  /** Known positions in ascending order of `day`, at most one per day. */
  readonly positions: readonly UnitPosition[];
}

/**
 * Everything the timeline plays: a time span and the units moving through it. The history and a
 * future alternative history are both just scenarios, so swapping one for another needs no change
 * to the timeline or the map.
 */
export interface Scenario {
  /**
   * `history` is researched data; `demonstration` is made-up data for exercising the system and
   * must always be labelled as such on screen.
   */
  readonly kind: 'history' | 'demonstration';
  /** The calendar date of campaign day 0. */
  readonly epoch: CalendarDate;
  readonly timeRange: TimeRange;
  readonly units: readonly MilitaryUnit[];
}
