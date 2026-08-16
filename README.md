# 拍魄仔（Pop-Pick）

極簡網頁節拍器：大字 BPM、大按鈕、設定收在「更多設定」，支援 PWA 加到主畫面。

拍魄仔 Developed by J.J. Wang

## 功能特色

- **超大 BPM**：點數字即可調整每分鐘拍數（40–208）
- **拍號**：2/4、3/4、4/4 或自訂（1–16 拍）
- **練習計時**：分＋秒，倒數結束自動停止；可按「不限時」一鍵歸零無限播放
- **六種音色**：木質、電子、清脆、鵝叫、彈簧、蛙鳴
- **重拍／節奏閃爍**：第一拍可加強音與邊緣閃爍（重拍為珊瑚紅）
- **半圓節拍圖**：BPM 數字上方顯示弧線與拍點，播放時高亮當前拍
- **音量**：預設 60%，更多設定內可調 0–100%
- **設定記憶**：同一瀏覽器重開後保留上次設定
- **播放中可調**：開始後仍可改 BPM、拍號、音色等

## 本機開發

```bash
npm ci
npm run dev
```

瀏覽器開啟 http://127.0.0.1:5173/

```bash
npm run lint    # ESLint
npm run build   # 產出 dist/
npm run preview # 預覽 build 結果
```

## 部署（GitHub Pages）

正式網址：https://oshukezu.github.io/phah-phik/

推送到 `main` 分支後，[`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) 會自動建置並部署 `dist/`。

首次使用請在 GitHub 倉庫 **Settings → Pages** 將 Source 設為 **GitHub Actions**。

## 技術棧

- React 19 + Vite 7
- Web Audio API（音色合成；鵝叫使用授權樣本 + 合成備援）
- localStorage（設定持久化）
- PWA（`manifest.webmanifest` + Service Worker）

## 音訊素材

「鵝叫」音色裁切自 [Wiktionary zh-é.ogg](https://zh.wiktionary.org/zh-hant/File:zh-%C3%A9.ogg)（CC BY-SA 3.0，Yue Tan / [Shtooka Project](http://packs.shtooka.net/)）。

## 專案文件

- [檔案結構](doc/PROJECT_STRUCTURE.md)
- [工作日誌](doc/WORK_LOG.md)

## 授權

Private project — 僅供個人／授權使用。
