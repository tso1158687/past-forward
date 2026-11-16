import type { Messages } from './messages';

export const MESSAGES_ZH_TW: Messages = {
  brandName: '歷史進行式',
  chapterTitle: '巴巴羅薩行動',
  chapterScope: '1941 年 6–7 月 · 中央集團軍群 · 明斯克方向',
  prototypeBadge: '地圖原型',
  dataNoticeTitle: '這張地圖目前的內容',
  dataNotice: [
    '地形：真實高程資料（低解析度），高度經大幅誇張以便閱讀。',
    '河流：Natural Earth 公開資料。',
    '城市：現代地理座標與今日常見譯名，並非 1941 年當時的名稱。',
    '尚未包含任何部隊、戰線或歷史事件。',
  ],
  controlsHint: '拖曳：平移　右鍵拖曳：旋轉與傾斜　滾輪：縮放　點選城市：聚焦',
  resetView: '回到全圖',
  mapLoading: '地圖載入中…',
  mapLoadFailed: '地圖無法載入。請確認瀏覽器支援 WebGL，並重新整理頁面。',
  cityPanel: {
    coordinates: '座標',
    coordinatesNote: '現代地理位置',
    close: '關閉',
  },
};
