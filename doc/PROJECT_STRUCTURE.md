# 檔案結構

```
Codex/Metronome/
├── README.md                 # 專案說明（GitHub 首頁）
├── doc/
│   ├── PROJECT_STRUCTURE.md  # 本文件
│   └── WORK_LOG.md           # 工作日誌
├── package.json
├── vite.config.js
├── index.html
├── public/
│   ├── manifest.webmanifest  # PWA 清單
│   ├── sw.js                 # Service Worker
│   └── icons/
├── src/
│   ├── main.jsx              # React 進入點
│   ├── App.jsx
│   ├── index.css             # 全域變數、主題色
│   ├── components/
│   │   ├── Metronome.jsx     # 主畫面
│   │   ├── Metronome.css
│   │   ├── BeatArc.jsx       # BPM 上方半圓節拍圖
│   │   ├── BeatArc.css
│   │   ├── MoreSettings.jsx  # 更多設定折疊區
│   │   ├── MoreSettings.css
│   │   ├── TutorialOverlay.jsx
│   │   └── TutorialOverlay.css
│   └── hooks/
│       ├── useMetronome.js   # 音訊排程、音色合成
│       ├── useSettings.js    # localStorage 設定
│       ├── usePracticeTimer.js
│       ├── useTheme.js
│       └── useWakeLock.js
├── legacy/                   # 舊版 vanilla 與上游參考（封存）
└── .github/workflows/
    └── deploy-pages.yml      # GitHub Pages CI
```

## 模組職責

| 模組 | 職責 |
|------|------|
| `Metronome.jsx` | 組合主 UI：BPM、拍號、計時、開始鈕、更多設定 |
| `BeatArc.jsx` | BPM 數字上方的半圓弧線與拍點指示 |
| `useMetronome.js` | Web Audio 排程、六種音色、masterGain 音量 |
| `useSettings.js` | 讀寫 `elder-metronome-settings` |
| `MoreSettings.jsx` | 重拍、閃爍、音量、音色、主題、教學 |

## 單檔行數檢查（400 行上限）

檢查日期：2026-08-16

| 檔案 | 行數 | 狀態 |
|------|------|------|
| `Metronome.css` | ~338 | OK |
| `useMetronome.js` | ~313 | OK |
| `Metronome.jsx` | ~287 | OK |
| `MoreSettings.css` | ~165 | OK |
| 其餘 | < 140 | OK |

**結論**：目前無任何原始碼檔案超過 400 行，暫不需拆分。若 `useMetronome.js` 再擴充音色，可將 `play*` 合成函式抽至 `src/audio/sounds.js`。

## 設定儲存

- Key：`elder-metronome-settings`（BPM、拍號、音色、音量、計時等）
- Key：`elder-metronome-theme`（外觀：system / light / dark）

## 資料流（簡圖）

```
useSettings (localStorage)
       ↓
Metronome.jsx ──→ useMetronome (Web Audio)
       ↓
BeatArc / beat-dots / edge-glow (視覺回饋)
```
