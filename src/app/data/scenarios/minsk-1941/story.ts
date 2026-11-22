import { StoryStop } from '../../../core/history/story';
import { MINSK_EVENTS } from './events';

/*
 * The guided story of the Białystok–Minsk chapter. Every sentence is listed, with what it rests
 * on, in docs/research/minsk-story.md; change that document first.
 */

/** The camera of an event, so that a stop about it looks where the event panel does. */
const cameraOf = (eventId: string) => {
  const event = MINSK_EVENTS.find((candidate) => candidate.id === eventId);
  if (!event) throw new Error(`Story refers to unknown event "${eventId}"`);
  return event.camera;
};

export const MINSK_STORY: readonly StoryStop[] = [
  {
    id: 'chapter',
    day: 0,
    title: { 'zh-TW': '這一章' },
    narration: [
      {
        'zh-TW':
          '這一章是 1941 年 6 月 22 日到 7 月 9 日，蘇方官方分期裡的 18 天，德軍中央集團軍群向明斯克的進攻。',
      },
      {
        'zh-TW':
          '深色虛線是開戰時的德蘇邊界；明斯克以西較淡的一條，是 1939 年以前的波蘭與蘇聯邊界。藍色的棋子是德軍，紅星是蘇軍；畫面上的每一天，都是那天晚上的情況。淡藍色是德軍最前面的部隊到過的範圍，紅色斜線是德軍圖集畫在它後方的蘇軍，兩者都是估計。',
      },
    ],
    eventIds: [],
    sourceIds: ['krivosheev', 'okh-atlas'],
  },
  {
    id: 'invasion',
    day: 0,
    title: { 'zh-TW': '全線進攻' },
    narration: [
      {
        'zh-TW':
          '6 月 22 日凌晨 3 時 15 分，德軍沿整條邊境發動進攻。在這個方向，第 2 裝甲集群在南，第 3 裝甲集群在北。德軍的目標，是圍殲邊境到明斯克之間的蘇軍。',
      },
      {
        'zh-TW':
          '依蘇方將領的回憶錄，開戰之初，蘇軍第 3 集團軍的司令部在格羅德諾，第 4 集團軍的司令部在科布林東北，第 10 集團軍的司令部在比亞維斯托克西南。',
      },
    ],
    eventIds: ['invasion'],
    sourceIds: ['stahel', 'hoth', 'dapam', 'boldin', 'sandalov'],
  },
  {
    id: 'neman-bridges',
    day: 0,
    title: { 'zh-TW': '尼曼河上的橋' },
    narration: [
      {
        'zh-TW':
          '開戰當天，北路的第 3 裝甲集群就在立陶宛境內的阿利圖斯與梅爾基內，奪下尼曼河上的橋。依德軍圖集，第一天晚上它的第 7 裝甲師已在阿利圖斯，第 12 裝甲師在梅爾基內一帶。',
      },
    ],
    camera: cameraOf('neman-bridges'),
    eventIds: ['neman-bridges'],
    sourceIds: ['hoth', 'stahel', 'okh-atlas'],
  },
  {
    id: 'grodno-counterattack',
    day: 1,
    title: { 'zh-TW': '格羅德諾的反擊' },
    narration: [
      {
        'zh-TW':
          '6 月 23 日起，蘇軍西方面軍在格羅德諾一帶發動反擊。反擊從 25 日起減弱，沒有擋住德軍。哈爾德在 25 日的日記裡說，這些攻擊到處都失敗了。',
      },
    ],
    camera: cameraOf('grodno-counterattack'),
    eventIds: ['grodno-counterattack'],
    sourceIds: ['anfilov', 'halder', 'isaev'],
  },
  {
    id: 'vilnius-and-slonim',
    day: 2,
    title: { 'zh-TW': '維爾紐斯與斯洛寧' },
    narration: [
      {
        'zh-TW':
          '6 月 24 日清晨，第 3 裝甲集群佔領維爾紐斯。同一天，南路第 2 裝甲集群的第 47 裝甲軍抵達斯洛寧，擋在蘇軍向東的退路上。',
      },
    ],
    camera: { target: { lon: 25.2, lat: 53.9 }, distanceKm: 480 },
    eventIds: ['vilnius', 'slonim-withdrawal'],
    sourceIds: ['hoth', 'halder', 'guderian-fms', 'anfilov'],
  },
  {
    id: 'withdrawal-ordered',
    day: 3,
    title: { 'zh-TW': '下令後撤' },
    narration: [
      {
        'zh-TW':
          '6 月 25 日，西方面軍下令第 3、第 4、第 10、第 13 集團軍當夜開始後撤。依德軍圖集，這天晚上南路的第 3 裝甲師已到斯盧茨克以西，北路的第 12 裝甲師已到沃洛任一帶。',
      },
    ],
    camera: cameraOf('slonim-withdrawal'),
    eventIds: ['slonim-withdrawal'],
    sourceIds: ['guderian-fms', 'halder', 'anfilov', 'okh-atlas'],
  },
  {
    id: 'bialystok-ring',
    day: 5,
    title: { 'zh-TW': '比亞維斯托克一帶被圍' },
    narration: [
      {
        'zh-TW':
          '6 月 27 日晚，德軍圖集把比亞維斯托克到沃爾科維斯克之間的蘇軍畫成一個大的封閉紅圈。圈裡寫著兩個集團軍司令部、兩到三個軍部、十個步兵師（其中一個是摩托化師），還有騎兵與坦克部隊。這是德軍當時的判斷，不是蘇方的記錄。',
      },
    ],
    camera: { target: { lon: 24.1, lat: 53.25 }, distanceKm: 380 },
    eventIds: [],
    sourceIds: ['okh-atlas'],
  },
  {
    id: 'minsk-falls',
    day: 6,
    title: { 'zh-TW': '明斯克陷落' },
    narration: [
      {
        'zh-TW':
          '6 月 28 日，第 3 裝甲集群佔領明斯克；德國陸軍總部在中午收到回報。同一晚，南路的第 3 裝甲師已到博布魯伊斯克，比明斯克還要往東。',
      },
    ],
    camera: cameraOf('minsk-falls'),
    eventIds: ['minsk-falls'],
    sourceIds: ['halder', 'guderian-fms', 'okh-atlas'],
  },
  {
    id: 'inner-ring',
    day: 7,
    title: { 'zh-TW': '內圈合攏' },
    narration: [
      {
        'zh-TW':
          '在後方，第 4 與第 9 集團軍的步兵從南北兩邊收攏內圈。哈爾德 6 月 28 日記下內圈正在比亞維斯托克以東合攏，29 日記下各師忙著封口，被圍的蘇軍向各個方向突圍。',
      },
    ],
    camera: cameraOf('inner-ring'),
    eventIds: ['inner-ring'],
    sourceIds: ['halder'],
  },
  {
    id: 'outer-ring',
    day: 7,
    title: { 'zh-TW': '外圈合攏' },
    narration: [
      {
        'zh-TW':
          '外面還有一圈，由裝甲師構成。哈爾德 6 月 28 日還寫著明斯克與巴拉諾維奇之間沒有封口，29 日記下外圈已經合攏，只是還很薄。也有研究說兩個裝甲集群 27 日就在明斯克以南會合。',
      },
      { 'zh-TW': '德軍圖集要到 7 月 3 日，才把明斯克以西的蘇軍畫成封閉的紅圈。' },
    ],
    camera: cameraOf('outer-ring'),
    eventIds: ['outer-ring'],
    sourceIds: ['halder', 'stolfi', 'dapam', 'okh-atlas'],
  },
  {
    id: 'berezina-crossings',
    day: 9,
    title: { 'zh-TW': '渡過別列津納河' },
    narration: [
      {
        'zh-TW':
          '據研究著作，第 3 裝甲師 6 月 29 日在博布魯伊斯克取得別列津納河的橋頭堡，第 18 裝甲師的一個戰鬥群 7 月 1 日衝過鮑里索夫的公路橋。古德里安戰後的研究則寫鮑里索夫是 6 月 30 日；德軍圖集上，第 18 裝甲師的一部 7 月 1 日晚才畫在鮑里索夫。',
      },
    ],
    camera: cameraOf('berezina-crossings'),
    eventIds: ['berezina-crossings'],
    sourceIds: ['glantz', 'halder', 'guderian-fms', 'okh-atlas'],
  },
  {
    id: 'advance-resumes',
    day: 11,
    title: { 'zh-TW': '恢復東進，明斯克以西的大圈' },
    narration: [
      {
        'zh-TW':
          '7 月 3 日，兩個裝甲集群恢復東進。北路的左翼 4 日強渡西德維納河，渡河地點有德里薩與季斯納兩種說法。',
      },
      {
        'zh-TW':
          '這天晚上，德軍圖集在明斯克以西畫出一個大紅圈，寫著「潰散的殘部，10 到 12 個師」。接下來幾天，這個圈越縮越小。',
      },
    ],
    camera: { target: { lon: 27.5, lat: 54.3 }, distanceKm: 600 },
    eventIds: ['advance-resumes'],
    sourceIds: ['halder', 'glantz', 'okh-atlas'],
  },
  {
    id: 'lepel-counterstroke',
    day: 14,
    title: { 'zh-TW': '先諾的反擊' },
    narration: [
      {
        'zh-TW':
          '7 月 6 日至 9 日，蘇軍第 5、第 7 機械化軍向列佩利方向反擊。據 Glantz 的研究，它們在先諾一帶被德軍的裝甲師擊敗，共損失坦克 832 輛。',
      },
    ],
    camera: cameraOf('lepel-counterstroke'),
    eventIds: ['lepel-counterstroke'],
    sourceIds: ['krivosheev', 'glantz'],
  },
  {
    id: 'battle-ends',
    day: 17,
    title: { 'zh-TW': '戰役結束' },
    narration: [
      {
        'zh-TW':
          '包圍圈內的抵抗，在 7 月 4 日至 5 日已大致平息。7 月 9 日是蘇方官方分期的終點，德軍中央集團軍群也在這天提交最終報告。',
      },
      {
        'zh-TW':
          '依克里沃舍耶夫的統計，西方面軍開戰時有 625,000 人，這 18 天裡損失 417,729 人，其中 341,012 人陣亡、失蹤或被俘。這個數字包含 7 月 6 日至 9 日的反擊，不只是包圍圈內。',
      },
    ],
    eventIds: ['battle-ends'],
    sourceIds: ['krivosheev', 'halder'],
  },
];
