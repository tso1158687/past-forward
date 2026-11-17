import { MilitaryUnit, UnitPosition } from '../../../core/history/scenario';
import { july, june, on, recorded, RELAYED, replacing, SEEN, through } from './unit-positions';

/**
 * The four armies of the Soviet Western Front, shown only on days for which a Soviet-side source
 * locates the army or its headquarters (user decisions U9 and U13). Every row comes from the
 * section「放上地圖的蘇軍位置」of docs/research/minsk-unit-positions.md: change that document first.
 */

const PLACEMENT = {
  'zh-TW':
    '有司令部位置的日子，標記放在司令部；只知道主力在某一帶的日子，放在那一帶並標為約略位置。沒有蘇方記載的日子不顯示，所以這個標記會時有時無。',
};

function army(
  id: string,
  ordinal: number,
  name: string,
  englishName: string,
  positions: readonly UnitPosition[][],
): MilitaryUnit {
  return {
    id,
    name: { 'zh-TW': name, en: englishName },
    faction: 'soviet',
    type: 'army',
    ordinal,
    placement: PLACEMENT,
    interpolatesGaps: false,
    positions: positions.flat(),
  };
}

export const SOVIET_ARMIES: readonly MilitaryUnit[] = [
  army('soviet-3rd-army', 3, '第 3 集團軍', '3rd Army', [
    recorded(
      on(june(22)),
      23.834,
      53.683,
      'headquarters',
      '格羅德諾，遭轟炸。來源的句子本身沒寫日期，依章節是開戰當天',
      RELAYED,
      'boldin',
    ),
    recorded(
      on(june(27)),
      24.261,
      53.454,
      'main-body',
      '倫納一帶。德軍第 28 步兵師這天到達倫納，第 3 集團軍的部隊炸毀了那裡的橋',
      SEEN,
      'anfilov',
      '來源只說部隊在倫納一帶，標記放在倫納。',
    ),
  ]),
  army('soviet-10th-army', 10, '第 10 集團軍', '10th Army', [
    recorded(
      on(june(22)),
      23.02,
      53.05,
      'headquarters',
      '比亞維斯托克西南約 12 公里的樹林邊',
      RELAYED,
      'boldin',
      '日期是依回憶錄的章節順序推的；座標由比亞維斯托克往西南 12 公里換算。',
    ),
    recorded(
      through(june(26), june(28)),
      24.64,
      53.16,
      'main-body',
      '沃爾科維斯克與澤利瓦一帶，激戰中',
      SEEN,
      'anfilov',
      '來源只說「這幾天」，依上下文是 6 月 27 日前後，日期是約略的；座標取兩地的中點。',
    ),
    recorded(
      on(july(2)),
      25.822,
      53.594,
      'main-body',
      '新格魯多克一帶。蘇軍到這天為止經莫斯特—傑列欽的走廊退到這裡',
      SEEN,
      'anfilov',
      '來源的主詞是「我軍」，依上下文是第 10 集團軍的部隊，也可能包含第 3 集團軍；標記放在新格魯多克。',
    ),
  ]),
  army('soviet-4th-army', 4, '第 4 集團軍', '4th Army', [
    recorded(
      on(june(22)),
      24.573,
      52.33,
      'headquarters',
      '扎普魯迪。當天先在科布林東北的布霍維奇，再移到這裡',
      RELAYED,
      'sandalov',
    ),
    recorded(on(june(23)), 24.984, 52.535, 'headquarters', '別廖扎一帶', SEEN, 'sandalov'),
    recorded(
      on(june(24)),
      25.848,
      52.896,
      'headquarters',
      '米洛維迪，凌晨 4 時展開',
      SEEN,
      'sandalov',
    ),
    // The marker switches from the headquarters to the main body: not a movement.
    replacing(
      recorded(
        on(june(25)),
        27.552,
        53.028,
        'main-body',
        '斯盧茨克。第 28 步兵軍司令部與兩個師的殘部日終時在這裡',
        SEEN,
        'sandalov',
        '這天沒有集團軍司令部的記載，用的是它轄下一個軍的位置。',
      ),
    ),
    // The marker switches back from the main body to the headquarters: not a movement.
    replacing(
      recorded(
        on(june(26)),
        27.076,
        52.976,
        'headquarters',
        '古列維奇，凌晨 2 時展開',
        SEEN,
        'sandalov',
        '同名的村落不只一個，座標取的是斯盧茨克以西的那一個，沒有把握。',
      ),
    ),
    recorded(
      on(june(27)),
      29.193,
      53.127,
      'headquarters',
      '博布魯伊斯克，下午展開',
      SEEN,
      'sandalov',
    ),
    recorded(
      on(july(3)),
      29.09,
      53.48,
      'main-body',
      '別列津諾到博布魯伊斯克之間的別列津納河一線。三個步兵師從這天起陸續到達',
      RELAYED,
      'sandalov',
      '來源給的是一段河岸線，不是一個地點；座標取這一段的中點。',
    ),
  ]),
  army('soviet-13th-army', 13, '第 13 集團軍', '13th Army', [
    recorded(
      on(june(28)),
      27.87,
      53.9,
      'main-body',
      '明斯克以東。日終時大部正往這一帶後撤',
      SEEN,
      'anfilov',
      '來源沒有給地名，座標取明斯克以東約 20 公里。',
    ),
    recorded(
      on(june(30)),
      28.29,
      54.13,
      'main-body',
      '鮑里索夫—斯莫列維奇—普季奇河一線，這天在這條線上展開',
      SEEN,
      'anfilov',
      '來源給的是一條防線，座標取鮑里索夫與斯莫列維奇的中點。',
    ),
  ]),
];
