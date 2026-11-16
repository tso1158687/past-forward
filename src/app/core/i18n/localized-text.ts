export type Locale = 'zh-TW' | 'en';

export const DEFAULT_LOCALE = 'zh-TW' satisfies Locale;

/**
 * One value per locale. Only the default locale is mandatory; the others are filled in as
 * translations become available and fall back to the default until then.
 */
export type PerLocale<T> = Readonly<Record<typeof DEFAULT_LOCALE, T>> &
  Readonly<Partial<Record<Locale, T>>>;

/** Text that belongs to data: place names, later unit names and event narration. */
export type LocalizedText = PerLocale<string>;

export function resolveText(text: LocalizedText, locale: Locale): string {
  return text[locale] ?? text[DEFAULT_LOCALE];
}
