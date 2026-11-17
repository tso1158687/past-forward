# Past Forward（歷史進行式）

3D 互動式歷史故事書，第一個章節是巴巴羅薩行動。Angular 22＋原生 three.js，純前端、無後端。

## 動手前先讀

| 想知道 | 看這份 |
| --- | --- |
| 專案要做什麼、不做什麼 | `docs/project-brief.md` |
| 做到哪裡、下一步是什麼 | `docs/roadmap.md` |
| 為什麼這樣選（技術與設計決策） | `docs/decisions.md` |
| 之前每次做了什麼、留下什麼沒做完 | `docs/devlog.md` |
| 史料研究：影片說了什麼、查證到哪裡 | `docs/research/` |

## 文件要跟著更新

使用者要求專案內要記錄開發過程、技術選擇與目標，才能掌握狀況。每次工作結束前：

- 做了任何實質工作 → 在 `docs/devlog.md` 最上面加一筆（做了什麼／驗證／未完成或待確認／下一步）。
- 完成或調整了項目 → 更新 `docs/roadmap.md` 的勾選與現況表。
- 做了技術或設計選擇 → 在 `docs/decisions.md` 加一筆，寫選了什麼、為什麼、放棄了什麼。使用者做的決定記在「使用者決定」表，編號接續 U；實作時自己做的選擇接續 D。
- 範圍或方向改變 → 更新 `docs/project-brief.md`。

## 指令

```
pnpm start          開發伺服器 http://localhost:4200
pnpm build          正式建置
pnpm test           單元測試（Vitest，跑一次）
pnpm lint           ESLint
pnpm format         Prettier
pnpm bake:map       從開放資料重新產生 public/map/（需要網路）
```

宣告完成前要跑過 `pnpm build`、`pnpm test`、`pnpm lint`、`pnpm format:check`；
畫面上看得到的改動要實際開瀏覽器確認。地圖元件在單元測試裡是替身，
「資料有沒有真的送到 3D 場景」只有在瀏覽器裡才驗得到（Milestone 2 就有一個測試全過、畫面卻不動的錯）。
用自動化工具驗證時注意：瀏覽器面板若是隱藏狀態，畫面不會自己重繪，地圖上的標籤（`.city-label`、`.place-marker` 等）
要等截一次圖之後才會出現在 DOM 裡；讀不到標籤時先截圖再讀，不要直接當成程式錯誤。

## 架構規則

依賴只能往下：`ui` 可以用 `scene`、`data`、`core`；`scene` 與 `data` 只能用 `core`；`core` 不依賴其他層。

- `src/app/core/`：純 TypeScript，不可 import Angular 或 three.js。時間軸（`core/timeline`）與世界狀態（`core/history`）的邏輯放這裡，用純函式並寫單元測試。
- `src/app/data/`：靜態資料與資產載入，只依賴 `core`。
- `src/app/scene/`：three.js 呈現層，不可 import Angular，不可包含歷史邏輯。對外入口只有 `map-scene.ts`。
- `src/app/ui/`：Angular 元件與介面文字。
- 所有位置一律存經緯度，只有 `core/geo/map-projection.ts` 知道如何轉成場景座標。
- 介面文字放 `ui/i18n/messages.zh-TW.ts`，不要寫死在模板裡；資料裡的名稱用 `LocalizedText`。
- 不使用 `any`。

## 史料規則

- 不把未查證的內容當史實放進資料。無法確認的標示為估計，或暫不呈現。
- 每筆事件與部隊位置都要附來源與可信度。
- 插值產生的位置要和史料確認的位置區分。
- 座標、日期、番號等事實要查證，不憑記憶填寫。
- 不複製參考影片的素材或旁白文字。
- 事件與部隊資料（`src/app/data/scenarios/`）裡的每個事實都要對得上 `docs/research/` 的查證文件。要改事實，先改查證文件，再改資料。部隊位置與文件表格的對應規則寫在 `docs/research/minsk-unit-positions-daily.md` 的「寫進資料時的對應」。
- 查證時不下載、不保留受版權保護的書籍檔案；派助手上網查資料時要明講這一點。可以保留來搜尋的只有公有領域或作者公開的文本。
- 助手回報的引文要抽查過才算數；自己沒在原文看到的，最多標為 B 級（分級見 `docs/research/minsk-events-verified.md`）。

## 範圍

目前只做 V1 的 MVP（1941 年 6 月 22 日至 7 月上旬，明斯克方向）。
不做遊戲、AI、後端，也不為 V2、V3 預先建立抽象層。
