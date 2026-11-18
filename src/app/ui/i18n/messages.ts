import { Certainty, SourceKind } from '../../core/history/historical-event';
import { Faction, UnitType } from '../../core/history/scenario';
import { PerLocale } from '../../core/i18n/localized-text';
import { MESSAGES_ZH_TW } from './messages.zh-TW';

/** Every piece of interface text. Adding a locale means providing one more object of this shape. */
export interface Messages {
  /** Product brand, shown above the chapter title. */
  readonly brandName: string;
  /** The historical chapter currently on screen. */
  readonly chapterTitle: string;
  readonly chapterScope: string;
  readonly prototypeBadge: string;
  readonly dataNoticeTitle: string;
  readonly dataNotice: readonly string[];
  readonly controlsHint: string;
  readonly resetView: string;
  readonly mapLoading: string;
  readonly mapLoadFailed: string;
  readonly timeline: {
    readonly play: string;
    readonly pause: string;
    /** Accessible name of the date scrubber. */
    readonly scrubber: string;
    readonly dayCounter: (day: number, totalDays: number) => string;
    readonly speed: string;
    readonly speedOption: (daysPerSecond: number) => string;
    readonly demoBadge: string;
  };
  /** Joins the two ends of a date range, e.g. "1941年6月23日至6月25日". */
  readonly dateRange: (from: string, to: string) => string;
  readonly events: {
    /** Shown above the list of the current day's events. */
    readonly heading: string;
    readonly position: (index: number, total: number) => string;
    readonly previous: string;
    readonly next: string;
    readonly noneToday: string;
    readonly certainty: Readonly<Record<Certainty, string>>;
    readonly sources: (count: number) => string;
    readonly sourceKind: Readonly<Record<SourceKind, string>>;
  };
  /** Names of the shaded estimates on the map; each must say that it is an estimate. */
  readonly situation: {
    readonly front: string;
    readonly pocket: string;
  };
  readonly units: {
    readonly faction: Readonly<Record<Faction, string>>;
    /** The single character drawn on the map piece of a unit of each type. */
    readonly typeCharacter: Readonly<Record<UnitType, string>>;
    /** How the location on screen was obtained. */
    readonly basis: Readonly<Record<'stated' | 'estimated' | 'interpolated', string>>;
    /** How well the reading of the source has been checked. */
    readonly certainty: Readonly<Record<Certainty, string>>;
    /** Shown instead of a position on days when no source places the unit. */
    readonly notPlacedToday: string;
    /** Shown while the unit is between two stated positions. */
    readonly interpolatedNote: string;
    /** Heading of the explanation of what the marker's location stands for. */
    readonly placement: string;
    readonly close: string;
  };
  readonly cityPanel: {
    readonly coordinates: string;
    readonly coordinatesNote: string;
    readonly close: string;
  };
}

export const MESSAGES: PerLocale<Messages> = {
  'zh-TW': MESSAGES_ZH_TW,
};
