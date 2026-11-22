# 圖集讀圖工具與原始讀數

這個資料夾保存「每晚的德軍前緣、前緣後方的蘇軍與德軍箭頭」是怎麼從 1942 年德軍參謀本部圖集讀出來的：
讀圖說明、兩組讀圖者各自的讀數、我的裁決，以及把它們變成資料檔的程式。
方法與結果的說明在 [docs/research/minsk-front-situation.md](../../docs/research/minsk-front-situation.md) 與 [docs/research/minsk-arrows.md](../../docs/research/minsk-arrows.md)，這裡只講檔案與指令。

圖集的掃描檔（每張約 8 MB）與過程中產生的圖片不放進版本庫，要重跑看圖的步驟時再下載。

## 檔案

| 檔案 | 內容 |
| --- | --- |
| `READING-TASK.md` | 發給每位讀圖者的說明 |
| `read/A1.json` … `read/B3.json` | 六位讀圖者的讀數。A、B 是互相獨立的兩組；1、2、3 是三段日期（6/22–27、6/28–7/3、7/4–9） |
| `overrides.json` | 我的裁決：剔除哪些符號與紅圈，各附理由 |
| `final-raw.json` | 合併後每晚線上的符號（含誰讀到的）、採用與未採用的紅圈 |
| `final.json` | 寫進資料檔的內容：每晚的前緣線與紅圈（由 `make_final.py` 產生） |
| `cp_half.json` | 把圖集對到經緯度用的 19 個城市控制點（參考圖的像素座標） |
| `reg/N.json` | 第 N 張掃描對齊到參考圖（第 11 張）的轉換 |
| `ARROW-TASK.md` | 讀藍色箭頭時發給讀圖者的說明 |
| `arrows/A1.json` … `arrows/B3.json` | 六位讀圖者讀的箭頭，分組與日期段同上 |
| `arrows-overrides.json` | 箭頭的裁決：`attack` 是被誤判為運輸、照畫的箭頭，`drop` 是要剔除的（以箭頭尖位置指定） |
| `arrows-final.json` | 合併後每晚的箭頭，另列剔除的運輸箭頭與只有一人讀到的（由 `arrows_merge.py` 產生） |

| 程式 | 做什麼 | 需要掃描檔 |
| --- | --- | --- |
| `fetch_half.sh N` | 從維基共享資源下載第 N 張圖（寬 3,840 像素的版本）到 `half/` | — |
| `register.py N…` | 用底圖的特徵點把第 N 張對齊到參考圖，寫 `reg/N.json` | 是 |
| `georef.py` | 由控制點求「經緯度 ↔ 像素」的二次多項式 | 否 |
| `tiles.py N…` | 裁出四格讀圖用的圖並疊上經緯線網，寫到 `tiles/` | 是 |
| `zoom.py` | 讀圖者用的局部放大 | 是 |
| `compare.py MMDD…` | 並排比較兩組讀數，並把兩條線畫回原圖 | 是 |
| `arbitrate.py` | 合併兩組讀數的規則（被其他程式引用） | 否 |
| `finalize.py` | 套用規則與 `overrides.json`，寫 `final-raw.json`；有掃描檔時另外把結果畫回原圖 | 否 |
| `review.py MMDD…` | 列出只有一位讀圖者讀到、而且會移動前緣線的符號，並裁出放大圖 | 是 |
| `arrows_merge.py [MMDD…]` | 配對兩組箭頭讀數、剔除運輸箭頭，寫 `arrows-final.json`；有掃描檔時另外把結果畫回原圖（`arrows/MMDD.jpg`） | 否 |
| `make_final.py` | 由 `final-raw.json` 與 `arrows-final.json` 整理出 `final.json` | 否 |
| `gen_situations.py` | 由 `final.json` 產生 `src/app/data/scenarios/minsk-1941/situations.ts` | 否 |
| `stats.py` | 印出研究文件裡「每晚的統計」那張表 | 否 |

圖集的張數與日期：第 5 張是 6 月 22 日晚，之後每天一張，第 22 張是 7 月 9 日晚。

## 重跑

需要 Python 3 與 `numpy`、`opencv-python-headless`。以下指令都在這個資料夾裡執行。

只重算結果（不需要掃描檔）：

```bash
python3 finalize.py
```

```bash
python3 arrows_merge.py
```

```bash
python3 make_final.py
```

```bash
python3 gen_situations.py
```

依序是：套用規則與裁決寫出 `final-raw.json`、合併箭頭寫出 `arrows-final.json`、整理成 `final.json`、產生資料檔。之後在專案根目錄跑一次 `pnpm format`。

要重看圖時，先下載並對齊：

```bash
for N in $(seq 5 22); do ./fetch_half.sh $N; done
```

```bash
python3 register.py $(seq 5 22)
```

```bash
python3 tiles.py $(seq 5 22)
```
