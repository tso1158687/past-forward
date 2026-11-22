import { LocalizedText } from '../i18n/localized-text';
import { CameraKeyframe } from './historical-event';

/**
 * One stop of the guided story: a calendar day to show, where to look and what to say. The
 * narration retells only what the research documents establish; see docs/research/minsk-story.md.
 */
export interface StoryStop {
  readonly id: string;
  /** The calendar day (an integer campaign day) whose evening the stop shows. */
  readonly day: number;
  readonly title: LocalizedText;
  /** Paragraphs, in order. */
  readonly narration: readonly LocalizedText[];
  /** Omitted when the stop is best seen on the whole map. */
  readonly camera?: CameraKeyframe;
  /** Events the stop tells about; may be empty. */
  readonly eventIds: readonly string[];
  /** Sources the narration rests on; at least one. */
  readonly sourceIds: readonly string[];
}

/** How the timeline gets to a stop: playing through the days in between, or jumping there. */
export type StoryTravel =
  { readonly kind: 'jump' } | { readonly kind: 'play'; readonly daysPerSecond: number };

/** Days between stops play at this speed, so that the pieces move one evening at a time. */
export const TRAVEL_DAYS_PER_SECOND = 1;
/** However many days lie between two stops, the reader never waits longer than this. */
export const MAX_TRAVEL_SECONDS = 4;

/**
 * Going forwards, the days between play through at about a day a second; going back, or staying
 * on the same day, the timeline jumps.
 */
export function travelTo(fromDay: number, toDay: number): StoryTravel {
  const days = toDay - fromDay;
  if (days <= 0) return { kind: 'jump' };
  return {
    kind: 'play',
    daysPerSecond: Math.max(TRAVEL_DAYS_PER_SECOND, days / MAX_TRAVEL_SECONDS),
  };
}
