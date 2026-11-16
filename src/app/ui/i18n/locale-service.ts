import { computed, Injectable, signal } from '@angular/core';
import { DEFAULT_LOCALE, Locale, LocalizedText, resolveText } from '../../core/i18n/localized-text';
import { MESSAGES } from './messages';

/** The active interface language. Only zh-TW is filled in for now; the rest falls back to it. */
@Injectable({ providedIn: 'root' })
export class LocaleService {
  readonly locale = signal<Locale>(DEFAULT_LOCALE);
  readonly messages = computed(() => MESSAGES[this.locale()] ?? MESSAGES[DEFAULT_LOCALE]);

  /** Resolves data text (place names etc.) for the active locale. */
  text(value: LocalizedText): string {
    return resolveText(value, this.locale());
  }
}
