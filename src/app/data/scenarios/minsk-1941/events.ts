import { HistoricalEvent } from '../../../core/history/historical-event';

/**
 * Event nodes of the Białystok–Minsk chapter, in chronological order. Day 0 is 22 June 1941.
 *
 * Every statement here follows docs/research/minsk-events-verified.md, which records what each
 * source says, the quotations that were checked and where the reference video differs. Do not add
 * or change a fact here without updating that document first.
 *
 * Coordinates are present-day town centres (Natural Earth / OpenStreetMap), not exact battle
 * sites. Camera distances are a presentation choice: far enough that every place of the event is
 * in view, roughly three times the distance between the places.
 */
export const MINSK_EVENTS: readonly HistoricalEvent[] = [
  {
    id: 'invasion',
    startDay: 0,
    title: { 'zh-TW': '德軍全線進攻' },
    summary: {
      'zh-TW':
        '6 月 22 日凌晨 3 時 15 分，德軍沿整條邊境發動進攻。在中央集團軍群的正面，第 2 裝甲集群在南翼、第 3 裝甲集群在北翼。依德軍的計畫，兩者要在明斯克一帶會合，圍殲邊境到明斯克之間的蘇軍。',
    },
    certainty: 'confirmed',
    certaintyNote: {
      'zh-TW': '3 時 15 分應是德方使用的時間；換算成莫斯科時間的說法沒有查到來源。',
    },
    places: [],
    sourceIds: ['stahel', 'hoth', 'dapam'],
  },
  {
    id: 'neman-bridges',
    startDay: 0,
    title: { 'zh-TW': '第 3 裝甲集群奪取尼曼河上的橋' },
    summary: {
      'zh-TW':
        '開戰當天中午前後，第 3 裝甲集群的戰車開進阿利圖斯，奪下完好的橋；下午又拿下梅爾基內的橋。北路的裝甲部隊第一天就越過了尼曼河。',
    },
    certainty: 'confirmed',
    certaintyNote: { 'zh-TW': '兩處各由哪個師奪橋，沒有可靠來源。' },
    places: [
      { name: { 'zh-TW': '阿利圖斯', en: 'Alytus' }, location: { lon: 24.046, lat: 54.396 } },
      { name: { 'zh-TW': '梅爾基內', en: 'Merkinė' }, location: { lon: 24.183, lat: 54.161 } },
    ],
    camera: { target: { lon: 24.1, lat: 54.25 }, distanceKm: 260 },
    sourceIds: ['hoth', 'stahel'],
  },
  {
    id: 'grodno-counterattack',
    startDay: 1,
    endDay: 3,
    title: { 'zh-TW': '蘇軍向格羅德諾反擊' },
    summary: {
      'zh-TW':
        '西方面軍以第 6、第 11 機械化軍與第 6 騎兵軍向格羅德諾反擊。反擊從 6 月 23 日開始，24 日是主攻，25 日起減弱。哈爾德在 25 日的日記裡寫道，蘇軍想藉這些攻擊爭取活動空間、擋住德軍向東的攻勢，但到處都失敗了。',
    },
    certainty: 'confirmed',
    certaintyNote: {
      'zh-TW':
        '「23 日開始、25 日減弱、失敗」有親自核對過的來源。主攻在 24 日、參戰的三個軍，以及對手是德軍第 9 集團軍的步兵，出自尚未親自核對的著作。',
    },
    places: [
      { name: { 'zh-TW': '格羅德諾', en: 'Grodno' }, location: { lon: 23.834, lat: 53.678 } },
    ],
    camera: { target: { lon: 23.834, lat: 53.6 }, distanceKm: 240 },
    sourceIds: ['anfilov', 'halder', 'isaev'],
  },
  {
    id: 'vilnius',
    startDay: 2,
    title: { 'zh-TW': '德軍佔領維爾紐斯' },
    summary: {
      'zh-TW': '6 月 24 日清晨，第 3 裝甲集群的第 39 裝甲軍以第 7 裝甲師佔領維爾紐斯。',
    },
    certainty: 'confirmed',
    places: [
      { name: { 'zh-TW': '維爾紐斯', en: 'Vilnius' }, location: { lon: 25.317, lat: 54.683 } },
    ],
    camera: { target: { lon: 25.317, lat: 54.683 }, distanceKm: 260 },
    sourceIds: ['hoth', 'halder'],
  },
  {
    id: 'slonim-withdrawal',
    startDay: 2,
    endDay: 3,
    title: { 'zh-TW': '德軍抵達斯洛寧，西方面軍下令後撤' },
    summary: {
      'zh-TW':
        '6 月 24 日，第 2 裝甲集群的第 47 裝甲軍抵達斯洛寧，擋在蘇軍向東的退路上，隔天仍在當地與試圖突圍的蘇軍激戰。25 日，西方面軍司令下令第 3、第 4、第 10、第 13 集團軍當夜開始後撤。',
    },
    certainty: 'confirmed',
    places: [{ name: { 'zh-TW': '斯洛寧', en: 'Slonim' }, location: { lon: 25.319, lat: 53.093 } }],
    camera: { target: { lon: 25.0, lat: 53.15 }, distanceKm: 280 },
    sourceIds: ['guderian-fms', 'halder', 'anfilov'],
  },
  {
    id: 'minsk-falls',
    startDay: 6,
    title: { 'zh-TW': '明斯克陷落' },
    summary: {
      'zh-TW':
        '6 月 28 日中午，德國陸軍總部收到回報：明斯克已被佔領。進城的是從西北方來的第 3 裝甲集群。',
    },
    certainty: 'confirmed',
    certaintyNote: {
      'zh-TW':
        '另有資料說 26 日就已進入明斯克；先進城的是哪個師，各種說法不一。這裡採用哈爾德當天的日記。',
    },
    places: [{ name: { 'zh-TW': '明斯克', en: 'Minsk' }, location: { lon: 27.565, lat: 53.902 } }],
    camera: { target: { lon: 27.565, lat: 53.902 }, distanceKm: 260 },
    sourceIds: ['halder', 'guderian-fms'],
  },
  {
    id: 'inner-ring',
    startDay: 6,
    endDay: 7,
    title: { 'zh-TW': '內層包圍圈合攏' },
    summary: {
      'zh-TW':
        '第 4 集團軍從南、第 9 集團軍從北，以步兵在比亞維斯托克周圍收攏內圈。6 月 28 日，內圈在比亞維斯托克以東逐漸合攏；29 日，各師忙著封口，被圍的蘇軍向各個方向突圍。',
    },
    certainty: 'confirmed',
    certaintyNote: { 'zh-TW': '合攏是持續兩天的過程；確切的會合日期與地點沒有來源。' },
    places: [
      {
        name: { 'zh-TW': '比亞維斯托克', en: 'Białystok' },
        location: { lon: 23.182, lat: 53.132 },
      },
      {
        name: { 'zh-TW': '沃爾科維斯克', en: 'Volkovysk' },
        location: { lon: 24.458, lat: 53.165 },
      },
    ],
    camera: { target: { lon: 23.85, lat: 53.15 }, distanceKm: 380 },
    sourceIds: ['halder'],
  },
  {
    id: 'outer-ring',
    startDay: 7,
    title: { 'zh-TW': '外層包圍圈合攏' },
    summary: {
      'zh-TW':
        '6 月 29 日，哈爾德記下：由裝甲師構成的外圈已經合攏，只是還很薄。前一天他寫的是，明斯克與巴拉諾維奇之間尚未封口。',
    },
    certainty: 'disputed',
    certaintyNote: {
      'zh-TW':
        '另一說是 6 月 27 日，兩個裝甲集群在明斯克以南會合（Stolfi）。美國陸軍的官方戰史只說兩者照計畫在明斯克附近會合，沒有給日期。這裡採用當時逐日寫下的哈爾德日記。',
    },
    places: [
      { name: { 'zh-TW': '明斯克', en: 'Minsk' }, location: { lon: 27.565, lat: 53.902 } },
      {
        name: { 'zh-TW': '巴拉諾維奇', en: 'Baranovichi' },
        location: { lon: 26.013, lat: 53.137 },
      },
    ],
    camera: { target: { lon: 26.8, lat: 53.5 }, distanceKm: 480 },
    sourceIds: ['halder', 'stolfi', 'dapam'],
  },
  {
    id: 'berezina-crossings',
    startDay: 7,
    endDay: 9,
    title: { 'zh-TW': '德軍渡過別列津納河' },
    summary: {
      'zh-TW':
        '6 月 29 日，第 2 裝甲集群的第 3 裝甲師在博布魯伊斯克取得橋頭堡；7 月 1 日中午，第 18 裝甲師的一個戰鬥群衝過鮑里索夫的公路橋。',
    },
    certainty: 'reported',
    certaintyNote: {
      'zh-TW':
        '各渡口的日期與部隊出自 Glantz 的著作，尚未親自核對原書；同一本書另一處把鮑里索夫寫成 7 月 2 日。哈爾德的日記只記下 7 月 2 日第 2 裝甲集群擊破了別列津納河上的頑強抵抗。',
    },
    places: [
      { name: { 'zh-TW': '博布魯伊斯克', en: 'Bobruisk' }, location: { lon: 29.193, lat: 53.127 } },
      { name: { 'zh-TW': '鮑里索夫', en: 'Borisov' }, location: { lon: 28.492, lat: 54.226 } },
    ],
    camera: { target: { lon: 28.8, lat: 53.7 }, distanceKm: 480 },
    sourceIds: ['glantz', 'halder'],
  },
  {
    id: 'advance-resumes',
    startDay: 11,
    endDay: 12,
    title: { 'zh-TW': '裝甲集群恢復東進' },
    summary: {
      'zh-TW':
        '7 月 3 日，兩個裝甲集群正式恢復東進，其實前一天已有強大兵力開始前移。第 3 裝甲集群的左翼當天中午抵達西德維納河，4 日強行渡河。',
    },
    certainty: 'confirmed',
    certaintyNote: {
      'zh-TW':
        '渡河地點有兩說：哈爾德記為德里薩，Glantz 記為季斯納（尚未核對原書），兩地相距約 30 公里。地圖上兩處都標出。',
    },
    places: [
      { name: { 'zh-TW': '德里薩', en: 'Drissa' }, location: { lon: 27.936, lat: 55.783 } },
      { name: { 'zh-TW': '季斯納', en: 'Disna' }, location: { lon: 28.214, lat: 55.567 } },
    ],
    camera: { target: { lon: 28.1, lat: 55.5 }, distanceKm: 260 },
    sourceIds: ['halder', 'glantz'],
  },
  {
    id: 'lepel-counterstroke',
    startDay: 14,
    endDay: 17,
    title: { 'zh-TW': '蘇軍向列佩利方向反擊' },
    summary: {
      'zh-TW':
        '7 月 6 日至 9 日，蘇軍第 13、第 20 集團軍與第 5、第 7 機械化軍在鮑里索夫與列佩利方向發動反突擊。據 Glantz 的研究，兩個機械化軍在先諾一帶被德軍的裝甲師擊敗，共損失坦克 832 輛。',
    },
    certainty: 'confirmed',
    certaintyNote: {
      'zh-TW':
        '日期與參戰部隊出自蘇方的官方統計，已親自核對。戰場在先諾、對手是哪幾個裝甲師、戰果如何，出自 Glantz 的著作，尚未親自核對原書。',
    },
    places: [
      { name: { 'zh-TW': '先諾', en: 'Senno' }, location: { lon: 29.708, lat: 54.814 } },
      { name: { 'zh-TW': '列佩利', en: 'Lepel' }, location: { lon: 28.694, lat: 54.887 } },
    ],
    camera: { target: { lon: 29.2, lat: 54.8 }, distanceKm: 340 },
    sourceIds: ['krivosheev', 'glantz'],
  },
  {
    id: 'battle-ends',
    startDay: 17,
    title: { 'zh-TW': '戰役結束' },
    summary: {
      'zh-TW':
        '7 月 9 日是蘇方官方分期的終點，德軍中央集團軍群也在這天提交最終報告；包圍圈內的抵抗在 7 月 4 日至 5 日已大致平息。依克里沃舍耶夫的統計，西方面軍開戰時有 625,000 人，損失 417,729 人，其中 341,012 人陣亡、失蹤或被俘；另損失坦克 4,799 輛、火砲與迫擊砲 9,427 門、作戰飛機 1,777 架。德方報告的俘虜是 289,874 人。',
    },
    certainty: 'confirmed',
    certaintyNote: {
      'zh-TW':
        '蘇方數字涵蓋 6 月 22 日至 7 月 9 日的整場戰役，包含 7 月 6 日至 9 日的反擊。德方數字是戰果報告，統計到 7 月 8 日。包圍圈內的戰鬥確切在哪一天結束，沒有來源。',
    },
    places: [],
    sourceIds: ['krivosheev', 'halder'],
  },
];
