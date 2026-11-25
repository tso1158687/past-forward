import { GeographicLocation } from '../geo/geo-types';
import { LocalizedText } from '../i18n/localized-text';

/**
 * How well an event is supported. The wording on screen comes from the UI; the meaning is fixed
 * here and matches the A / B / C grades used in docs/research.
 * - `confirmed`: read in the original text of a primary source, official history or scholarly work.
 * - `reported`:  stated by a scholarly work that has not yet been checked first-hand.
 * - `disputed`:  reliable sources disagree; one account is shown and the others are noted.
 */
export type Certainty = 'confirmed' | 'reported' | 'disputed';

export type SourceKind =
  | 'primary'
  | 'official-history'
  | 'scholarly'
  | 'memoir'
  | 'statistical'
  /** An encyclopedia, including Wikipedia; cited only for plain dates such as a railway's opening. */
  | 'reference';

export interface HistoricalSource {
  readonly id: string;
  /** Bibliographic reference in its original language; not translated. */
  readonly citation: string;
  readonly kind: SourceKind;
  readonly url?: string;
}

export interface EventPlace {
  readonly name: LocalizedText;
  readonly location: GeographicLocation;
}

/** Where the camera should look to show something. */
export interface CameraKeyframe {
  readonly target: GeographicLocation;
  /** Distance from the camera to the target, in kilometres on the map. */
  readonly distanceKm: number;
}

/**
 * Something that happened, dated to whole calendar days because that is the precision sources
 * give. An event lasting several days has an `endDay`; both ends are inclusive.
 */
export interface HistoricalEvent {
  readonly id: string;
  readonly startDay: number;
  readonly endDay?: number;
  readonly title: LocalizedText;
  readonly summary: LocalizedText;
  readonly certainty: Certainty;
  /** What exactly is uncertain: which details are unverified, or which other accounts exist. */
  readonly certaintyNote?: LocalizedText;
  /** Places to point out on the map. Empty for events that span the whole front. */
  readonly places: readonly EventPlace[];
  /** Omitted when the event is best seen on the whole map. */
  readonly camera?: CameraKeyframe;
  /** Ids of the sources that support this event; at least one. */
  readonly sourceIds: readonly string[];
}

export function eventLastDay(event: HistoricalEvent): number {
  return event.endDay ?? event.startDay;
}

/** Whether a whole calendar day falls within the event. */
export function isEventOnDay(event: HistoricalEvent, calendarDay: number): boolean {
  return calendarDay >= event.startDay && calendarDay <= eventLastDay(event);
}

export function eventsOnDay(
  events: readonly HistoricalEvent[],
  calendarDay: number,
): HistoricalEvent[] {
  return events.filter((event) => isEventOnDay(event, calendarDay));
}

/**
 * The event to move to when stepping forwards (+1) or backwards (-1) through the list, which is
 * in chronological order. With nothing selected, stepping starts from the given calendar day:
 * forwards goes to the first event starting on that day or later, so that the events of the day
 * are not skipped; backwards goes to the last one starting before it. Returns undefined at either
 * end of the list.
 */
export function neighbouringEvent(
  events: readonly HistoricalEvent[],
  direction: 1 | -1,
  from: { readonly eventId: string } | { readonly calendarDay: number },
): HistoricalEvent | undefined {
  if ('eventId' in from) {
    const index = events.findIndex((event) => event.id === from.eventId);
    return index === -1 ? undefined : events[index + direction];
  }
  return direction === 1
    ? events.find((event) => event.startDay >= from.calendarDay)
    : events.filter((event) => event.startDay < from.calendarDay).at(-1);
}
