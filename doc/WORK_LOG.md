# 工作日誌

## 2026-08-16

### 專案定位

- 以 React 重寫長輩版節拍器，取代 `legacy/` 內 vanilla 版本
- 主畫面極簡：大字 BPM、拍號、練習時間、開始鈕；進階功能收在「更多設定」

### 已完成

| 項目 | 說明 |
|------|------|
| 主畫面布局 | BPM 置中、開始鈕優先、更多設定在下、版權署名 |
| 練習計時 | 支援分＋秒；結束彈窗「練習結束」+ 點選關閉；「不限時」按鈕一鍵歸零 |
| 六種音色 | 木質、電子、清脆、雷射、蛙鳴、鵝叫（Web Audio 合成） |
| 音量 | 預設 60%，更多設定滑桿 0–100% |
| 播放中可調 | 移除播放時 UI 鎖定；設定寫入 localStorage |
| 配色 | 主色青綠、停止/重拍強調珊瑚紅 |
| 節奏閃爍 | 弱拍青綠+淡珊瑚；重拍四邊珊瑚紅 |
| 拍點圓點 | 放大尺寸，重拍第一顆較大 |
| 文件 | README、本結構說明、工作日誌 |
| BeatArc | BPM 上方半圓弧節拍圖（試作） |
| BeatArc 修正 | 加寬弧線、修正 viewBox 裁切；單一圓點連續滑動；淡色單色階（指示點比弧線略深） |
| 音色 | 底鼓改為鵝叫（`goose`）；`kick` 設定自動遷移；鵝叫改為 F0 陽平 + F1/F2 母音合成 |
| 圖示 | 主畫面／PWA：`metronome.png`；瀏覽器分頁 favicon：`duck-face.png` |
| iOS 靜音 UX | 教學與播放中提示靜音鍵／耳機；`mediaSession`；背景切回時 `AudioContext.resume` |
| iOS 靜音提醒 v2 | 無法程式偵測靜音鍵；首次開始前提示、`audioSession.playback` |
| UI 間距調整 | 拍號改左標籤右按鈕；收緊拍點圓點與面板間距；iOS 未播放常駐聲音橫幅 |
| 鵝叫音色 v3 | 混合方案：Wiktionary zh-é.ogg 裁切播放 + 合成備援 |
| 版面放寬 | 主內容三區垂直均分（BPM／面板／開始鈕）；取消播放中 iOS「聽不到聲音」底部提示 |
| 面板固定 | 展開更多設定時主區不壓縮；設定區內捲動 |
| 鵝叫 v4 | Google 翻譯 TTS「鵝」打包（`goose-zh-tw.mp3`），極短裁切 0.12–0.18s |
| 試聽移除 | 更多設定取消「試聽一下」「再看聲音提示」；`IosSoundHint` 僅保留首次開始前 `preStart` |
| 鵝叫 v5 | 拉長裁切（弱拍 0.42s／重拍 0.55s）、放慢 playbackRate，迷因感拖長母音 |
| 音色 UI | 彈簧改小狗（`dog` 合成吠聲）；鵝叫移至最後一格、選中黃色高亮 |
| 小狗 v2 | 小森平 `maltese_dog4.mp3` 本地樣本（`dog-maltese.mp3`）+ 合成備援；`sw.js` v10 |
| 雷射 | 小狗改雷射（`laser2.mp3`）；id `laser`；播放增益 +50%；`sw.js` v11 |

### iOS 靜音鍵（平台限制）

- **無法**由 PWA 程式偵測 iPhone 側邊靜音鍵狀態（無官方 Web API）
- 採主動提醒：首次按開始前提示、未播放常駐橫幅、教學 overlay 說明
- Safari 嘗試 `navigator.audioSession.type = 'playback'`，可能讓 Web Audio 在靜音鍵 ON 時仍出聲（需實機驗證）
- 若仍無聲：引導關閉靜音鍵、接耳機，或開始播放後調媒體音量
- 原生 App（Capacitor + `AVAudioSession`）為另一條路，本次不納入

### 程式碼健康

- 全專案 `src/` 無單檔超過 400 行（最大 `Metronome.css` ~338 行）
- `npm run lint`、`npm run build` 通過

### 待觀察 / 後續可選

- BeatArc 試作後是否取代下方圓點列
- `sw.js` cache 版本 bump（部署後）
- GitHub Pages 遠端倉庫推送（需使用者授權）
