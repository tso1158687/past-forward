import { GeographicLocation } from '../../core/geo/geo-types';
import { LocalizedText } from '../../core/i18n/localized-text';

export interface City {
  readonly id: string;
  readonly name: LocalizedText;
  readonly location: GeographicLocation;
  /** Map importance, 1 (major) to 3 (minor). An editorial choice for label density. */
  readonly rank: 1 | 2 | 3;
}

/**
 * Reference places for the map prototype.
 *
 * NOT historical data: coordinates are present-day locations (Natural Earth 1:10m populated
 * places; the six rank-3 towns marked "OSM" were checked against OpenStreetMap Nominatim) and
 * names are common present-day forms, except Königsberg. The names in use in 1941 and each
 * place's role in the campaign are to be researched in Milestone 3.
 */
export const CITIES: readonly City[] = [
  {
    id: 'warsaw',
    name: { 'zh-TW': '華沙', en: 'Warsaw' },
    location: { lon: 21.005, lat: 52.231 },
    rank: 1,
  },
  {
    id: 'minsk',
    name: { 'zh-TW': '明斯克', en: 'Minsk' },
    location: { lon: 27.565, lat: 53.902 },
    rank: 1,
  },
  {
    id: 'brest',
    name: { 'zh-TW': '布列斯特', en: 'Brest' },
    location: { lon: 23.7, lat: 52.1 },
    rank: 1,
  },
  {
    id: 'bialystok',
    name: { 'zh-TW': '比亞維斯托克', en: 'Białystok' },
    location: { lon: 23.182, lat: 53.132 },
    rank: 1,
  },
  {
    id: 'vilnius',
    name: { 'zh-TW': '維爾紐斯', en: 'Vilnius' },
    location: { lon: 25.317, lat: 54.683 },
    rank: 1,
  },

  {
    id: 'konigsberg',
    name: { 'zh-TW': '柯尼斯堡', en: 'Königsberg' },
    location: { lon: 20.497, lat: 54.7 },
    rank: 2,
  },
  {
    id: 'kaunas',
    name: { 'zh-TW': '考納斯', en: 'Kaunas' },
    location: { lon: 23.88, lat: 54.95 },
    rank: 2,
  },
  {
    id: 'grodno',
    name: { 'zh-TW': '格羅德諾', en: 'Grodno' },
    location: { lon: 23.834, lat: 53.678 },
    rank: 2,
  },
  {
    id: 'lublin',
    name: { 'zh-TW': '盧布林', en: 'Lublin' },
    location: { lon: 22.573, lat: 51.25 },
    rank: 2,
  },
  {
    id: 'baranovichi',
    name: { 'zh-TW': '巴拉諾維奇', en: 'Baranovichi' },
    location: { lon: 26.013, lat: 53.137 },
    rank: 2,
  },
  {
    id: 'borisov',
    name: { 'zh-TW': '鮑里索夫', en: 'Borisov' },
    location: { lon: 28.492, lat: 54.226 },
    rank: 2,
  },
  {
    id: 'bobruisk',
    name: { 'zh-TW': '博布魯伊斯克', en: 'Bobruisk' },
    location: { lon: 29.193, lat: 53.127 },
    rank: 2,
  },
  {
    id: 'mogilev',
    name: { 'zh-TW': '莫吉廖夫', en: 'Mogilev' },
    location: { lon: 30.325, lat: 53.899 },
    rank: 2,
  },
  {
    id: 'vitebsk',
    name: { 'zh-TW': '維捷布斯克', en: 'Vitebsk' },
    location: { lon: 30.185, lat: 55.189 },
    rank: 2,
  },
  {
    id: 'gomel',
    name: { 'zh-TW': '戈梅利', en: 'Gomel' },
    location: { lon: 31.0, lat: 52.43 },
    rank: 2,
  },

  {
    id: 'orsha',
    name: { 'zh-TW': '奧爾沙', en: 'Orsha' },
    location: { lon: 30.422, lat: 54.515 },
    rank: 3,
  },
  {
    id: 'pinsk',
    name: { 'zh-TW': '平斯克', en: 'Pinsk' },
    location: { lon: 26.094, lat: 52.128 },
    rank: 3,
  },
  {
    id: 'lida',
    name: { 'zh-TW': '利達', en: 'Lida' },
    location: { lon: 25.285, lat: 53.888 },
    rank: 3,
  },
  {
    id: 'molodechno',
    name: { 'zh-TW': '莫洛傑奇諾', en: 'Molodechno' },
    location: { lon: 26.865, lat: 54.319 },
    rank: 3,
  },
  {
    id: 'daugavpils',
    name: { 'zh-TW': '陶格夫匹爾斯', en: 'Daugavpils' },
    location: { lon: 26.51, lat: 55.88 },
    rank: 3,
  },
  // OSM
  {
    id: 'slonim',
    name: { 'zh-TW': '斯洛寧', en: 'Slonim' },
    location: { lon: 25.319, lat: 53.093 },
    rank: 3,
  },
  {
    id: 'volkovysk',
    name: { 'zh-TW': '沃爾科維斯克', en: 'Volkovysk' },
    location: { lon: 24.458, lat: 53.165 },
    rank: 3,
  },
  {
    id: 'novogrudok',
    name: { 'zh-TW': '新格魯多克', en: 'Novogrudok' },
    location: { lon: 25.822, lat: 53.594 },
    rank: 3,
  },
  {
    id: 'suwalki',
    name: { 'zh-TW': '蘇瓦烏基', en: 'Suwałki' },
    location: { lon: 22.928, lat: 54.099 },
    rank: 3,
  },
  {
    id: 'kobrin',
    name: { 'zh-TW': '科布林', en: 'Kobrin' },
    location: { lon: 24.354, lat: 52.209 },
    rank: 3,
  },
  {
    id: 'slutsk',
    name: { 'zh-TW': '斯盧茨克', en: 'Slutsk' },
    location: { lon: 27.552, lat: 53.028 },
    rank: 3,
  },
];
