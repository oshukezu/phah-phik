import './TutorialOverlay.css';

export default function TutorialOverlay({ open, onDismiss }) {
  if (!open) return null;

  return (
    <div className="tutorial-overlay" role="dialog" aria-modal="true" aria-labelledby="tutorial-title">
      <div className="tutorial-card">
        <h2 id="tutorial-title">加到主畫面，使用更方便</h2>
        <ol className="tutorial-steps">
          <li>點瀏覽器下方的 <strong>分享</strong> 按鈕</li>
          <li>選擇 <strong>加入主畫面</strong></li>
          <li>從主畫面圖示開啟節拍器</li>
        </ol>
        <p className="tutorial-note">練習時請保持螢幕亮著，節拍才會持續運作。</p>
        <button type="button" className="tutorial-dismiss" onClick={onDismiss}>
          我知道了，開始使用
        </button>
      </div>
    </div>
  );
}
