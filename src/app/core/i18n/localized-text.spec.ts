import { LocalizedText, resolveText } from './localized-text';

describe('resolveText', () => {
  const minsk: LocalizedText = { 'zh-TW': '明斯克', en: 'Minsk' };
  const untranslated: LocalizedText = { 'zh-TW': '布格河' };

  it('returns the text for the requested locale', () => {
    expect(resolveText(minsk, 'en')).toBe('Minsk');
    expect(resolveText(minsk, 'zh-TW')).toBe('明斯克');
  });

  it('falls back to the default locale when a translation is missing', () => {
    expect(resolveText(untranslated, 'en')).toBe('布格河');
  });
});
