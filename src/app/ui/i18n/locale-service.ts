import { computed, Injectable, signal } from '@angular/core';
import { DEFAULT_LOCALE, Locale, LocalizedText, resolveText } from '../../core/i18n/localized-text';
import { CalendarDate } from '../../core/timeline/calendar';
import { MESSAGES } from './messages';

/** The active interface language. Only zh-TW is filled in for now; the rest falls back to it. */
@Injectable({ providedIn: 'root' })
export class LocaleService {
  readonly locale = signal<Locale>(DEFAULT_LOCALE);
  readonly messages = computed(() => MESSAGES[this.locale()] ?? MESSAGES[DEFAULT_LOCALE]);

  /** A calendar date written out in the active locale, e.g. "1941年6月22日". */
  formatDate(date: CalendarDate): string {
    return this.format(date, { dateStyle: 'long' });
  }

  /** A span of days in the same year; the year is written only once. */
  formatDateRange(from: CalendarDate, to: CalendarDate): string {
    const end = this.format(to, { month: 'long', day: 'numeric' });
    return this.messages().dateRange(this.formatDate(from), end);
  }

  private format({ year, month, day }: CalendarDate, options: Intl.DateTimeFormatOptions): string {
    // The date is built and formatted in UTC so the viewer's time zone can never shift it.
    return new Intl.DateTimeFormat(this.locale(), { ...options, timeZone: 'UTC' }).format(
      new Date(Date.UTC(year, month - 1, day)),
    );
  }

  /** Resolves data text (place names etc.) for the active locale. */
  text(value: LocalizedText): string {
    return resolveText(value, this.locale());
  }
}
