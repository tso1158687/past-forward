import { HistoricalBorder } from '../../../core/history/scenario';

/**
 * The borders drawn for the Białystok–Minsk chapter. What each line is, where its course comes
 * from and how it was checked is recorded in docs/research/minsk-borders.md. The `id` is the id
 * of the line in public/map/borders.json.
 */
export const MINSK_BORDERS: readonly HistoricalBorder[] = [
  {
    id: 'german-soviet-1941',
    name: { 'zh-TW': '德蘇邊界（1941 年 6 月）', en: 'German–Soviet border, June 1941' },
    kind: 'in-force',
  },
  {
    id: 'polish-soviet-1939',
    name: { 'zh-TW': '波蘇舊邊界（1921–1939）', en: 'Former Polish–Soviet border, 1921–1939' },
    kind: 'former',
  },
];
