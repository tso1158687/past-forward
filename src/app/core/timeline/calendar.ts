/** A civil date with no time zone: the precision that historical sources actually give. */
export interface CalendarDate {
  readonly year: number;
  /** 1–12 */
  readonly month: number;
  /** 1–31 */
  readonly day: number;
}

const MILLISECONDS_PER_DAY = 86_400_000;

/**
 * Timeline time is a "campaign day": the number of days since an epoch date, where day 0 starts
 * at 00:00 of the epoch and fractions are parts of a day. It is a plain number rather than a JS
 * Date so that playback, scrubbing and interpolation are simple arithmetic with no time zones.
 */
export function calendarDateOfDay(epoch: CalendarDate, campaignDay: number): CalendarDate {
  const date = new Date(toUtcMilliseconds(epoch) + Math.floor(campaignDay) * MILLISECONDS_PER_DAY);
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

/** The campaign day on which a calendar date starts. */
export function dayOfCalendarDate(epoch: CalendarDate, date: CalendarDate): number {
  return Math.round((toUtcMilliseconds(date) - toUtcMilliseconds(epoch)) / MILLISECONDS_PER_DAY);
}

// UTC is used purely as a calendar calculator here; no local time zone is ever involved.
function toUtcMilliseconds({ year, month, day }: CalendarDate): number {
  return Date.UTC(year, month - 1, day);
}
