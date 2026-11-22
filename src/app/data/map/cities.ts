import { GeographicLocation } from '../../core/geo/geo-types';
import { LocalizedText } from '../../core/i18n/localized-text';

/** A name as written in one language. */
export interface NameInLanguage {
  readonly name: string;
  /** BCP 47 code of the language, so that the name is announced and hyphenated correctly. */
  readonly lang: string;
  /** The language's name, for display. */
  readonly language: LocalizedText;
}

/**
 * What a place was called in June 1941. Every entry is backed by
 * docs/research/minsk-place-names.md; change that document first.
 */
export interface PlaceIn1941 {
  /** The state and region that held the place on 22 June 1941. */
  readonly heldBy: LocalizedText;
  /** The place's official names under that administration, in the languages it used. */
  readonly officialNames: readonly NameInLanguage[];
  /**
   * How the 1942 German General Staff atlas prints the name. Absent where the print could not be
   * read with certainty.
   */
  readonly atlasSpelling?: string;
  /** What is uncertain about the above, or what was found instead of an official name. */
  readonly note?: LocalizedText;
}

export interface City {
  readonly id: string;
  /** The name shown on the map: a common present-day form. */
  readonly name: LocalizedText;
  readonly location: GeographicLocation;
  /** Map importance, 1 (major) to 3 (minor). An editorial choice for label density. */
  readonly rank: 1 | 2 | 3;
  readonly in1941: PlaceIn1941;
}

/**
 * Reference places for the map.
 *
 * Coordinates are present-day locations (Natural Earth 1:10m populated places; the six rank-3
 * towns marked "OSM" were checked against OpenStreetMap Nominatim) and `name` is a common
 * present-day form, except Königsberg. `in1941` is researched history: see
 * docs/research/minsk-place-names.md.
 */
const RUSSIAN = { lang: 'ru', language: { 'zh-TW': '俄文', en: 'Russian' } } as const;
const GERMAN = { lang: 'de', language: { 'zh-TW': '德文', en: 'German' } } as const;

const SOVIET_BELARUS: LocalizedText = {
  'zh-TW': '蘇聯，白俄羅斯 SSR',
  en: 'Soviet Union, Byelorussian SSR',
};
const SOVIET_LITHUANIA: LocalizedText = {
  'zh-TW': '蘇聯，立陶宛 SSR',
  en: 'Soviet Union, Lithuanian SSR',
};
const SOVIET_LATVIA: LocalizedText = {
  'zh-TW': '蘇聯，拉脫維亞 SSR',
  en: 'Soviet Union, Latvian SSR',
};
const GENERAL_GOVERNMENT: LocalizedText = {
  'zh-TW': '德國占領下的總督府（Generalgouvernement）',
  en: 'German-occupied General Government',
};
const EAST_PRUSSIA: LocalizedText = {
  'zh-TW': '德國，東普魯士省',
  en: 'Germany, Province of East Prussia',
};
const NOT_CHECKED_GERMAN: LocalizedText = {
  'zh-TW': '行政區與名稱依據維基百科，尚未核對德國當時的法令原文。',
  en: 'Region and name follow Wikipedia; the German enactments of the time have not been checked.',
};

/** A town in the Byelorussian SSR, with its name as written in the Soviet decrees of 1938–1940. */
const belarusian = (
  russianName: string,
  atlasSpelling?: string,
  note?: LocalizedText,
): PlaceIn1941 => ({
  heldBy: SOVIET_BELARUS,
  officialNames: [{ name: russianName, ...RUSSIAN }],
  atlasSpelling,
  note,
});

export const CITIES: readonly City[] = [
  {
    id: 'warsaw',
    name: { 'zh-TW': '華沙', en: 'Warsaw' },
    location: { lon: 21.005, lat: 52.231 },
    rank: 1,
    in1941: {
      heldBy: GENERAL_GOVERNMENT,
      officialNames: [{ name: 'Warschau', ...GERMAN }],
      atlasSpelling: 'Warschau',
      note: NOT_CHECKED_GERMAN,
    },
  },
  {
    id: 'minsk',
    name: { 'zh-TW': '明斯克', en: 'Minsk' },
    location: { lon: 27.565, lat: 53.902 },
    rank: 1,
    in1941: belarusian('Минск', 'Minsk'),
  },
  {
    id: 'brest',
    name: { 'zh-TW': '布列斯特', en: 'Brest' },
    location: { lon: 23.7, lat: 52.1 },
    rank: 1,
    in1941: belarusian('Брест', 'Brześć', {
      'zh-TW': '圖集印的是 1939 年以前的波蘭名。',
      en: 'The atlas prints the pre-1939 Polish name.',
    }),
  },
  {
    id: 'bialystok',
    name: { 'zh-TW': '比亞維斯托克', en: 'Białystok' },
    location: { lon: 23.182, lat: 53.132 },
    rank: 1,
    in1941: belarusian('Белосток', 'Białystok'),
  },
  {
    id: 'vilnius',
    name: { 'zh-TW': '維爾紐斯', en: 'Vilnius' },
    location: { lon: 25.317, lat: 54.683 },
    rank: 1,
    in1941: {
      heldBy: SOVIET_LITHUANIA,
      officialNames: [],
      atlasSpelling: 'Wilna',
      note: {
        'zh-TW':
          '1941 年 6 月的紅軍文件寫作 Вильнюс（俄文）；1939 年 10 月的蘇聯—立陶宛條約寫作 Вильно。',
        en: 'Red Army documents of June 1941 write Вильнюс (Russian); the Soviet–Lithuanian treaty of October 1939 writes Вильно.',
      },
    },
  },

  {
    id: 'konigsberg',
    name: { 'zh-TW': '柯尼斯堡', en: 'Königsberg' },
    location: { lon: 20.497, lat: 54.7 },
    rank: 2,
    in1941: {
      heldBy: EAST_PRUSSIA,
      officialNames: [{ name: 'Königsberg', ...GERMAN }],
      atlasSpelling: 'Königsberg',
      note: NOT_CHECKED_GERMAN,
    },
  },
  {
    id: 'kaunas',
    name: { 'zh-TW': '考納斯', en: 'Kaunas' },
    location: { lon: 23.88, lat: 54.95 },
    rank: 2,
    in1941: {
      heldBy: SOVIET_LITHUANIA,
      officialNames: [],
      atlasSpelling: 'Kowno',
      note: {
        'zh-TW': '1941 年 6 月前後的紅軍文件 Каунас 與 Ковно 兩種寫法都有（俄文）。',
        en: 'Red Army documents of around June 1941 use both Каунас and Ковно (Russian).',
      },
    },
  },
  {
    id: 'grodno',
    name: { 'zh-TW': '格羅德諾', en: 'Grodno' },
    location: { lon: 23.834, lat: 53.678 },
    rank: 2,
    in1941: belarusian('Гродно', 'Grodno'),
  },
  {
    id: 'lublin',
    name: { 'zh-TW': '盧布林', en: 'Lublin' },
    location: { lon: 22.573, lat: 51.25 },
    rank: 2,
    in1941: {
      heldBy: GENERAL_GOVERNMENT,
      officialNames: [{ name: 'Lublin', ...GERMAN }],
      atlasSpelling: 'Lublin',
      note: NOT_CHECKED_GERMAN,
    },
  },
  {
    id: 'baranovichi',
    name: { 'zh-TW': '巴拉諾維奇', en: 'Baranovichi' },
    location: { lon: 26.013, lat: 53.137 },
    rank: 2,
    in1941: belarusian('Барановичи', 'Baranowicze'),
  },
  {
    id: 'borisov',
    name: { 'zh-TW': '鮑里索夫', en: 'Borisov' },
    location: { lon: 28.492, lat: 54.226 },
    rank: 2,
    in1941: belarusian('Борисов', 'Borissow'),
  },
  {
    id: 'bobruisk',
    name: { 'zh-TW': '博布魯伊斯克', en: 'Bobruisk' },
    location: { lon: 29.193, lat: 53.127 },
    rank: 2,
    in1941: belarusian('Бобруйск', 'Bobruisk'),
  },
  {
    id: 'mogilev',
    name: { 'zh-TW': '莫吉廖夫', en: 'Mogilev' },
    location: { lon: 30.325, lat: 53.899 },
    rank: 2,
    in1941: belarusian('Могилев', 'Mogilew'),
  },
  {
    id: 'vitebsk',
    name: { 'zh-TW': '維捷布斯克', en: 'Vitebsk' },
    location: { lon: 30.185, lat: 55.189 },
    rank: 2,
    in1941: belarusian('Витебск', 'Witebsk'),
  },
  {
    id: 'gomel',
    name: { 'zh-TW': '戈梅利', en: 'Gomel' },
    location: { lon: 31.0, lat: 52.43 },
    rank: 2,
    in1941: belarusian('Гомель', 'Gomel'),
  },

  {
    id: 'orsha',
    name: { 'zh-TW': '奧爾沙', en: 'Orsha' },
    location: { lon: 30.422, lat: 54.515 },
    rank: 3,
    in1941: belarusian('Орша', 'Orscha'),
  },
  {
    id: 'pinsk',
    name: { 'zh-TW': '平斯克', en: 'Pinsk' },
    location: { lon: 26.094, lat: 52.128 },
    rank: 3,
    in1941: belarusian('Пинск', 'Pińsk'),
  },
  {
    id: 'lida',
    name: { 'zh-TW': '利達', en: 'Lida' },
    location: { lon: 25.285, lat: 53.888 },
    rank: 3,
    in1941: belarusian('Лида', 'Lida'),
  },
  {
    id: 'molodechno',
    name: { 'zh-TW': '莫洛傑奇諾', en: 'Molodechno' },
    location: { lon: 26.865, lat: 54.319 },
    rank: 3,
    in1941: belarusian('Молодечно', 'Mołodeczno'),
  },
  {
    id: 'daugavpils',
    name: { 'zh-TW': '陶格夫匹爾斯', en: 'Daugavpils' },
    location: { lon: 26.51, lat: 55.88 },
    rank: 3,
    in1941: {
      heldBy: SOVIET_LATVIA,
      officialNames: [],
      atlasSpelling: 'Dünaburg',
      note: {
        'zh-TW': '1941 年 6 月前後的紅軍文件 Двинск 與 Даугавпилс 兩種寫法都有（俄文）。',
        en: 'Red Army documents of around June 1941 use both Двинск and Даугавпилс (Russian).',
      },
    },
  },
  // OSM
  {
    id: 'slonim',
    name: { 'zh-TW': '斯洛寧', en: 'Slonim' },
    location: { lon: 25.319, lat: 53.093 },
    rank: 3,
    in1941: belarusian('Слоним', 'Słonim'),
  },
  {
    id: 'volkovysk',
    name: { 'zh-TW': '沃爾科維斯克', en: 'Volkovysk' },
    location: { lon: 24.458, lat: 53.165 },
    rank: 3,
    in1941: belarusian('Волковыск', undefined, {
      'zh-TW': '圖集上的寫法看不清 l 上有沒有斜線，所以不列。',
      en: 'Whether the atlas prints the l with a stroke cannot be made out, so its spelling is not given.',
    }),
  },
  {
    id: 'novogrudok',
    name: { 'zh-TW': '新格魯多克', en: 'Novogrudok' },
    location: { lon: 25.822, lat: 53.594 },
    rank: 3,
    in1941: belarusian('Новогрудок', 'Nowogródek'),
  },
  {
    id: 'suwalki',
    name: { 'zh-TW': '蘇瓦烏基', en: 'Suwałki' },
    location: { lon: 22.928, lat: 54.099 },
    rank: 3,
    in1941: {
      heldBy: EAST_PRUSSIA,
      officialNames: [{ name: 'Sudauen', ...GERMAN }],
      note: {
        'zh-TW':
          '依據維基百科：1939 年併入後先稱 Suwalken，1941 年 5 月 21 日改為 Sudauen；尚未核對法令原文。1942 年的德軍圖集印的不是 Sudauen 或 Suwalken，而是 Suwa?ki（l 上有沒有斜線看不清，所以分不出是波蘭文 Suwałki 還是 Suwalki）。',
        en: 'According to Wikipedia: called Suwalken after the annexation of 1939 and renamed Sudauen on 21 May 1941; the enactments have not been checked. The 1942 German atlas prints neither Sudauen nor Suwalken but Suwa?ki; whether the l has a stroke, as in Polish Suwałki, cannot be made out.',
      },
    },
  },
  {
    id: 'kobrin',
    name: { 'zh-TW': '科布林', en: 'Kobrin' },
    location: { lon: 24.354, lat: 52.209 },
    rank: 3,
    in1941: belarusian('Кобрин', 'Kobryn'),
  },
  {
    id: 'slutsk',
    name: { 'zh-TW': '斯盧茨克', en: 'Slutsk' },
    location: { lon: 27.552, lat: 53.028 },
    rank: 3,
    in1941: belarusian('Слуцк', 'Sluzk'),
  },
];
