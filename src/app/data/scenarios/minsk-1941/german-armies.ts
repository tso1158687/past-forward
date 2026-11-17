import { MilitaryUnit, UnitPosition } from '../../../core/history/scenario';
import { headquarters, july, june, on, RELAYED, SEEN, through } from './unit-positions';

/**
 * The two infantry armies of Army Group Centre, placed at their headquarters flag in the 1942
 * General Staff atlas (user decision U12). Every row comes from the headquarters tables of
 * docs/research/minsk-unit-positions-daily.md: change that document first.
 */

const PLACEMENT = {
  'zh-TW':
    '標記是集團軍司令部的位置，不是它轄下各軍、各師所在；那些位置這次沒有從圖集讀出來。位置是當天晚上的態勢。',
};

const ZALCZIN_NOTE =
  'Zalczin 這個地名沒有對到今日的名稱。推測是斯莫爾貢東南約 10 公里的鐵路站扎列西耶（Zalesse），但拼法不同，沒有確認；座標用的是扎列西耶。';

function army(
  id: string,
  name: string,
  englishName: string,
  positions: readonly UnitPosition[][],
): MilitaryUnit {
  return {
    id,
    name: { 'zh-TW': name, en: englishName },
    faction: 'german',
    placement: PLACEMENT,
    interpolatesGaps: false,
    positions: positions.flat(),
  };
}

export const GERMAN_ARMIES: readonly MilitaryUnit[] = [
  army('german-4th-army', '第 4 集團軍', '4th Army', [
    headquarters(through(june(22), june(23)), 22.784, 51.985, 'Międzyrzec', '緬濟熱茨', RELAYED),
    headquarters(on(june(24)), 23.822, 52.402, 'Kam. Litewski', '卡緬涅茨', RELAYED),
    headquarters(
      through(june(25), july(1)),
      24.417,
      52.49,
      'Czachec',
      '查赫茨，普魯扎內西南',
      RELAYED,
    ),
    headquarters(
      on(july(2)),
      27.565,
      53.902,
      'Minsk，旗旁註記「7 月 3 日上午起」',
      '明斯克',
      RELAYED,
      '圖上的旗已經畫在明斯克，但註記說 7 月 3 日上午才生效；這一晚司令部應該還在遷移途中，實際位置不明。',
    ),
    headquarters(through(july(3), july(4)), 27.565, 53.902, 'Minsk', '明斯克', RELAYED),
    headquarters(
      on(july(5)),
      27.565,
      53.902,
      'Minsk；旗畫在城的東北，旗桿底的橫線接到 Minsk',
      '明斯克',
      SEEN,
    ),
    headquarters(through(july(6), july(7)), 27.565, 53.902, 'Minsk', '明斯克', RELAYED),
    headquarters(
      on(july(8)),
      27.565,
      53.902,
      'Minsk；旗畫在城的東北，旗桿底的橫線接到 Minsk',
      '明斯克',
      SEEN,
    ),
    headquarters(on(july(9)), 28.492, 54.226, 'Borissow', '鮑里索夫', RELAYED),
  ]),
  army('german-9th-army', '第 9 集團軍', '9th Army', [
    headquarters(through(june(22), june(30)), 23.352, 54.041, 'Giby', '吉比', RELAYED),
    headquarters(through(july(1), july(5)), 25.0, 54.169, 'Ejszyszki', '埃伊希什凱斯', RELAYED),
    // 6 July: the flag has no legible place name, so the army is not shown that evening.
    headquarters(
      on(july(7)),
      26.54,
      54.42,
      '旗下手寫「Zalczin」，旗畫在 Smorgonie 旁',
      '斯莫爾貢東南',
      SEEN,
      ZALCZIN_NOTE,
    ),
    headquarters(
      on(july(8)),
      26.54,
      54.42,
      '旗下手寫「Zalczin」',
      '斯莫爾貢東南',
      RELAYED,
      ZALCZIN_NOTE,
    ),
    headquarters(
      on(july(9)),
      26.54,
      54.42,
      '旗下手寫「Zalcsin」，旗畫在 Wilejka 旁',
      '斯莫爾貢東南',
      SEEN,
      ZALCZIN_NOTE,
    ),
  ]),
];
