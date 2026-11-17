# Past Forward 歷史進行式

3D 互動式歷史故事書：把歷史戰役紀錄片裡的立體戰略地圖、部隊移動與戰線變化，
變成可以自己操作時間軸與地圖的網頁。

| 項目 | 名稱 |
| --- | --- |
| 英文品牌 | Past Forward |
| 中文品牌 | 歷史進行式 |
| 第一個歷史章節 | Past Forward: Operation Barbarossa／歷史進行式：巴巴羅薩行動 |
| 長期方向 | 歷史探索、架空歷史、AI 戰略模擬 |

第一個章節的 MVP 範圍是 1941 年 6 月 22 日至 7 月上旬中央集團軍群在明斯克方向的攻勢。

目前進度：**Milestone 3 進行中**。時間軸上已有 12 個對照過史料的事件，各附來源與可信度；部隊位置還沒查證，所以地圖上還沒有部隊。

## 啟動

需要 pnpm 與 Angular CLI 22 支援的 Node.js 版本（22.22.3 以上的 22.x、24.15 以上的 24.x，或 26 以上）。

```bash
pnpm install
pnpm start        # 開發伺服器，http://localhost:4200
```

| 指令 | 用途 |
| --- | --- |
| `pnpm start` | 開發伺服器 |
| `pnpm build` | 正式建置，輸出到 `dist/` |
| `pnpm test` | 單元測試（Vitest，跑一次） |
| `pnpm test:watch` | 單元測試（監看模式） |
| `pnpm lint` | ESLint |
| `pnpm format` / `pnpm format:check` | Prettier |
| `pnpm bake:map` | 從開放資料重新產生 `public/map/` 的地形與河流 |

## 操作

- 拖曳：平移
- 右鍵拖曳（觸控為雙指）：旋轉與傾斜
- 滾輪（觸控為雙指縮放）：縮放
- 點選城市：鏡頭聚焦並顯示資訊
- 「回到全圖」：回到初始視角
- 時間軸：播放／暫停、拖曳滑桿切換日期、調整播放速度
- 事件：點時間軸上的色塊，或用事件面板的左右按鈕逐一瀏覽；選取後鏡頭會移到事件地點

## 畫面上的內容從哪裡來

| 內容 | 來源 | 說明 |
| --- | --- | --- |
| 地形 | AWS Open Data 的 Terrain Tiles（zoom 8） | 真實高程，約 0.4 公里一格；高度誇張 30 倍 |
| 河流 | Natural Earth 1:10m（公有領域） | 現代河道 |
| 城市 | Natural Earth 與 OpenStreetMap | 現代座標與今日常見譯名，並非 1941 年當時的名稱 |
| 事件 | 逐項對照史料，見 [docs/research/minsk-events-verified.md](docs/research/minsk-events-verified.md) | 每個事件附來源；地點標的是今日城鎮中心，不是橋或戰場的確切位置 |

事件的可信度有三種，畫面上用顏色區分：

| 顏色 | 意思 |
| --- | --- |
| 綠 | 主要內容已親自核對來源原文；尚未核對的細節寫在該事件的說明裡 |
| 黃 | 有學術著作記載，但尚未核對原書 |
| 橘 | 可靠來源說法不一；畫面採用其中一說，並註明其他說法 |

還沒有的：部隊、戰線、控制區。這些的位置尚未查證，所以不顯示，也不用假資料代替。
時間軸的起訖是 1941 年 6 月 22 日至 7 月 9 日，共 18 天，依蘇方官方對這場戰役的分期。

## 專案結構

分成四層，依賴只能往下：`ui` 可以用 `scene`、`data`、`core`；`scene` 與 `data` 只能用 `core`；`core` 不依賴其他層。

```
src/app/
  core/     純 TypeScript，不依賴 Angular 與 three.js（可單獨測試）
    geo/      經緯度型別、地圖投影、高度格網取樣
    timeline/ 日曆換算、時間軸狀態（播放、暫停、跳轉、推進）
    history/  劇本、事件、來源與部隊的型別；由日期推導世界狀態
    i18n/     多語系文字型別
  data/     靜態資料：城市、河流名稱、地圖資產載入、劇本（scenarios/minsk-1941：事件與來源）
  scene/    three.js 呈現層：地形、河流、標籤、單位與事件地點標記、鏡頭。不含歷史邏輯，也不依賴 Angular
  ui/       Angular 元件（地圖、時間軸、事件面板）、時間軸狀態管理與介面文字
tools/      離線資料烘焙腳本
public/map/ 烘焙產生的地形與河流資產
docs/       專案概要、路線、決策紀錄、開發日誌、史料研究
```

- 所有資料一律以經緯度儲存，只有 `core/geo/map-projection.ts` 知道經緯度如何對應到場景座標。
- `scene/map-scene.ts` 是 3D 層唯一對外的入口，介面只有 `focusOn`、`resetView`、`setUnits`、`setPlaces`、`dispose` 與事件回呼。
- 時間以「戰役日」表示：距章節起始日的天數，可帶小數。某一刻地圖上有什麼，完全由 `core/history/world-state.ts` 的純函式從劇本與日期算出來。
- 介面文字集中在 `ui/i18n/messages.zh-TW.ts`；新增語系時補一份同樣形狀的物件即可。

## 已知限制

- 地形解析度約 0.4 公里，拉到最近時會看得出模糊。
- 投影是簡單的等距圓柱投影，區域南北邊緣的東西向比例誤差約 6%。
- 河流線與低解析度地形不完全貼合，因此河流不做深度遮蔽，一律畫在地形之上。
- 尚未畫出 1941 年的國界與分界線（屬於歷史資料，留待 Milestone 3）。
- 部隊資料加入後：單位在相鄰兩天都有資料點時，會在午夜直接換位置，沒有過渡動畫。
- 開發伺服器關閉了熱更新，改檔後是整頁重新載入（原因見 decisions D18）。

## 文件

| 想知道 | 看這份 |
| --- | --- |
| 專案要做什麼、不做什麼 | [docs/project-brief.md](docs/project-brief.md) |
| 做到哪裡、下一步是什麼 | [docs/roadmap.md](docs/roadmap.md) |
| 為什麼這樣選（技術與設計決策） | [docs/decisions.md](docs/decisions.md) |
| 每次做了什麼、留下什麼沒做完 | [docs/devlog.md](docs/devlog.md) |
| 史料研究：影片說了什麼、查證到哪裡 | [docs/research/](docs/research/) |

`CLAUDE.md` 是給 AI 協作工具看的專案規則，內容包含「每次工作結束前要更新上面哪些文件」。
