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

目前進度：**Milestone 1 — 基礎 3D 地圖**（地形、鏡頭操作、城市與河流標記）。

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

## 地圖上的內容哪些不是史實

Milestone 1 **不含任何歷史資料**，畫面上的東西都是地理底圖：

| 內容 | 來源 | 說明 |
| --- | --- | --- |
| 地形 | AWS Open Data 的 Terrain Tiles（zoom 8） | 真實高程，約 0.4 公里一格；高度誇張 30 倍 |
| 河流 | Natural Earth 1:10m（公有領域） | 現代河道 |
| 城市 | Natural Earth 與 OpenStreetMap | 現代座標與今日常見譯名，並非 1941 年當時的名稱 |

部隊、戰線、控制區與歷史事件從 Milestone 3 開始加入，屆時每筆資料都會附來源與可信度。

## 專案結構

三個領域分開，依賴方向只有一個：`ui → scene → core`，`data` 只依賴 `core`。

```
src/app/
  core/     純 TypeScript，不依賴 Angular 與 three.js（可單獨測試）
    geo/      經緯度型別、地圖投影、高度格網取樣
    i18n/     多語系文字型別
  data/     靜態資料：城市、河流名稱、地圖資產載入
  scene/    three.js 呈現層：地形、河流、標籤、鏡頭。不含歷史邏輯，也不依賴 Angular
  ui/       Angular 元件與介面文字
tools/      離線資料烘焙腳本
public/map/ 烘焙產生的地形與河流資產
docs/       決策紀錄
```

- 所有資料一律以經緯度儲存，只有 `core/geo/map-projection.ts` 知道經緯度如何對應到場景座標。
- `scene/map-scene.ts` 是 3D 層唯一對外的入口，介面只有 `focusOn`、`resetView`、`dispose` 與事件回呼。
- 介面文字集中在 `ui/i18n/messages.zh-TW.ts`；新增語系時補一份同樣形狀的物件即可。

## 已知限制

- 地形解析度約 0.4 公里，拉到最近時會看得出模糊。
- 投影是簡單的等距圓柱投影，區域南北邊緣的東西向比例誤差約 6%。
- 河流線與低解析度地形不完全貼合，因此河流不做深度遮蔽，一律畫在地形之上。
- 尚未畫出 1941 年的國界與分界線（屬於歷史資料，留待 Milestone 3）。

## 後續 Milestone

2. 時間軸：播放、暫停、拖曳日期；世界狀態是日期的純函式。
3. 部隊與事件資料：依參考影片的關鍵日期整理，逐筆查證並標示可信度。
4. 動畫與敘事：部隊移動、控制區色塊、事件聚焦、Story／Explore 模式。
5. 品質驗證：時間軸一致性、效能、不同螢幕尺寸。

決策過程見 [docs/decisions.md](docs/decisions.md)。
