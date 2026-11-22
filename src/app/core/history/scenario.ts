import { GeographicLocation } from '../geo/geo-types';
import { LocalizedText } from '../i18n/localized-text';
import { CalendarDate } from '../timeline/calendar';
import { TimeRange } from '../timeline/timeline-state';
import { FrontSituation } from './front-situation';
import { StoryStop } from './story';
import { Certainty, HistoricalEvent, HistoricalSource } from './historical-event';

/**
 * "On this calendar day the unit was at this place." Sources rarely say more than the day, so a
 * position holds for the whole of `day` (an integer campaign day) and says nothing about hours.
 */
export interface UnitPosition {
  readonly day: number;
  readonly location: GeographicLocation;
  /** What the source shows there, in its own terms: which part of the unit, at which place. */
  readonly description: LocalizedText;
  /** How well the reading of the source has been checked. Never `disputed` without a note. */
  readonly certainty: Certainty;
  /**
   * True when the source gives only a rough area or the place could not be pinned down, so the
   * location is an estimate rather than a named place.
   */
  readonly estimated: boolean;
  /** What is uncertain or estimated about this position. */
  readonly note?: LocalizedText;
  /**
   * True when the unit did not move here from its previous position: the marker now stands for
   * a different part of the unit (another division reassigned to the corps, the main body
   * instead of the headquarters). No movement is drawn between the two.
   */
  readonly breaksMovement: boolean;
  readonly sourceIds: readonly string[];
}

export type Faction = 'german' | 'soviet';

/** What kind of formation a unit is; decides the symbol on its piece. */
export type UnitType = 'motorized-corps' | 'army';

export interface MilitaryUnit {
  readonly id: string;
  readonly name: LocalizedText;
  readonly faction: Faction;
  readonly type: UnitType;
  /** The number in the unit's designation: 47 for XXXXVII Motorized Corps, 4 for 4th Army. */
  readonly ordinal: number;
  /**
   * What the marker's location stands for. A corps or an army covers far more ground than one
   * point, so every unit has to say which point of it is being shown.
   */
  readonly placement: LocalizedText;
  /**
   * What happens between two stated positions that are more than a day apart: `true` moves the
   * unit in a straight line and marks it as interpolated; `false` leaves it off the map, for
   * units whose whereabouts on the days in between are simply not known.
   */
  readonly interpolatesGaps: boolean;
  /** Known positions in ascending order of `day`, at most one per day. */
  readonly positions: readonly UnitPosition[];
}

/**
 * `in-force` is a border that held during the scenario; `former` is one that had been abolished
 * by then and is drawn only to help read the map.
 */
export type BorderKind = 'in-force' | 'former';

/**
 * A border drawn on the map. Its course is not stored here: it is a map asset with the same `id`,
 * because it is thousands of points traced from a map rather than a fact stated by a source.
 */
export interface HistoricalBorder {
  readonly id: string;
  readonly name: LocalizedText;
  readonly kind: BorderKind;
}

/**
 * Everything the timeline plays: a time span, the events in it and the units moving through it. The history and a
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
  /** At most one per calendar day, in order of `day`. */
  readonly situations: readonly FrontSituation[];
  /** The guided story, in the order it is told. */
  readonly story: readonly StoryStop[];
  /** Borders that hold for the whole of `timeRange`. */
  readonly borders: readonly HistoricalBorder[];
  /** In chronological order of `startDay`. */
  readonly events: readonly HistoricalEvent[];
  /** Every source referred to by the events, the unit positions, the situations and the story. */
  readonly sources: readonly HistoricalSource[];
}
