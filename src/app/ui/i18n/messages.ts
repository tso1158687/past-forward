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
  readonly cityPanel: {
    readonly coordinates: string;
    readonly coordinatesNote: string;
    readonly close: string;
  };
}

export const MESSAGES: PerLocale<Messages> = {
  'zh-TW': MESSAGES_ZH_TW,
};
