import { LocalizedText } from '../../core/i18n/localized-text';

/**
 * Display names for the rivers that get a label, keyed by their Natural Earth name in
 * public/map/rivers.json. Rivers not listed here are drawn without a label.
 */
export const RIVER_NAMES: Readonly<Record<string, LocalizedText>> = {
  Dnieper: { 'zh-TW': '聶伯河', en: 'Dnieper' },
  Vistula: { 'zh-TW': '維斯瓦河', en: 'Vistula' },
  'Zapadnaya Dvina': { 'zh-TW': '西德維納河', en: 'Western Dvina' },
  Pripyat: { 'zh-TW': '普里皮亞季河', en: 'Pripyat' },
  Nemunas: { 'zh-TW': '尼曼河', en: 'Neman' },
  Bug: { 'zh-TW': '布格河', en: 'Bug' },
  Narew: { 'zh-TW': '納雷夫河', en: 'Narew' },
  Berezina: { 'zh-TW': '別列津納河', en: 'Berezina' },
};
