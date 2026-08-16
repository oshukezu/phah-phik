import { isStandalone } from '../hooks/useSettings';
import './TutorialOverlay.css';

export default function TutorialOverlay({ open, onDismiss }) {
  if (!open) return null;

  const standalone = isStandalone();

  return (
    <div className="tutorial-overlay" role="dialog" aria-modal="true" aria-labelledby="tutorial-title">
      <div className="tutorial-card">
        <h2 id="tutorial-title">使用教學</h2>
        <ol className="tutorial-steps">
          <li>點上方的 BPM 數字，調整每分鐘拍數</li>
          <li>選擇拍號，並設定練習時間（分與秒，皆為 0 則不限時）</li>
          <li>按 <strong>開始</strong> 練習，再按 <strong>停止</strong> 結束</li>
          {!standalone && (
            <li>加到主畫面：點瀏覽器 <strong>分享</strong> → <strong>加入主畫面</strong></li>
          )}
        </ol>
        <p className="tutorial-note">練習時請保持螢幕亮著，節拍才會持續運作。</p>
        <button type="button" className="tutorial-dismiss" onClick={onDismiss}>
          我知道了，開始使用
        </button>
      </div>
    </div>
  );
}
