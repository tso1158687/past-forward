import { HistoricalRailway } from '../../../core/history/scenario';

/**
 * Main railways open in June 1941. Which lines these are, when each opened and on what evidence,
 * and how today's course was traced, is recorded in docs/research/minsk-railways.md. The `id` is
 * the id of the line in public/map/railways.json.
 */
export const MINSK_RAILWAYS: readonly HistoricalRailway[] = [
  {
    id: 'st-petersburg-warsaw',
    name: { 'zh-TW': '聖彼得堡—華沙鐵路', en: 'Saint Petersburg–Warsaw railway' },
    openedBy: 1862,
    sourceIds: ['wiki-st-petersburg-warsaw'],
  },
  {
    id: 'lentvaris-kybartai',
    name: { 'zh-TW': '蘭德瓦魯瓦—考納斯—屈巴泰鐵路', en: 'Lentvaris–Kaunas–Kybartai railway' },
    openedBy: 1861,
    sourceIds: ['wiki-kaunas-kybartai'],
  },
  {
    id: 'warsaw-brest-smolensk',
    name: { 'zh-TW': '華沙—布列斯特—斯摩稜斯克鐵路', en: 'Warsaw–Brest–Smolensk railway' },
    openedBy: 1871,
    sourceIds: ['nes-moscow-brest', 'wiki-warsaw-terespol'],
  },
  {
    id: 'libau-romny',
    name: { 'zh-TW': '利巴瓦—羅姆內鐵路', en: 'Libau–Romny railway' },
    openedBy: 1873,
    sourceIds: ['wiki-libau-romny'],
  },
  {
    id: 'riga-oryol',
    name: {
      'zh-TW': '道加瓦皮爾斯—維捷布斯克—斯摩稜斯克鐵路',
      en: 'Daugavpils–Vitebsk–Smolensk railway',
    },
    openedBy: 1868,
    sourceIds: ['wiki-riga-oryol'],
  },
  {
    id: 'vitebsk-zhlobin',
    name: { 'zh-TW': '維捷布斯克—莫吉廖夫—日洛賓鐵路', en: 'Vitebsk–Mogilev–Zhlobin railway' },
    openedBy: 1903,
    sourceIds: ['wiki-riga-oryol'],
  },
  {
    id: 'brest-gomel',
    name: { 'zh-TW': '布列斯特—平斯克—戈梅利鐵路', en: 'Brest–Pinsk–Gomel railway' },
    openedBy: 1886,
    // Brest–Zhabinka is part of the Moscow–Brest line.
    sourceIds: ['wiki-polesie', 'nes-moscow-brest'],
  },
  {
    id: 'vilnius-rivne',
    name: { 'zh-TW': '維爾紐斯—巴拉諾維奇—羅夫諾鐵路', en: 'Vilnius–Baranovichi–Rivne railway' },
    openedBy: 1885,
    sourceIds: ['wiki-polesie'],
  },
  {
    id: 'bialystok-baranovichi',
    name: { 'zh-TW': '比亞維斯托克—巴拉諾維奇鐵路', en: 'Białystok–Baranovichi railway' },
    openedBy: 1886,
    sourceIds: ['wiki-polesie', 'wiki-pl-line-37'],
  },
  {
    id: 'grodno-mosty',
    name: { 'zh-TW': '格羅德諾—莫斯蒂鐵路', en: 'Grodno–Mosty railway' },
    openedBy: 1907,
    sourceIds: ['wiki-polesie'],
  },
];
