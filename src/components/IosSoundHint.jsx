import './IosSoundHint.css';

export default function IosSoundHint({ open, onConfirm }) {
  if (!open) return null;

  return (
    <div className="ios-sound-hint-overlay" role="dialog" aria-modal="true" aria-labelledby="ios-hint-prestart-title">
      <div className="ios-sound-hint-card">
        <h2 id="ios-hint-prestart-title">開始練習前</h2>
        <p className="ios-sound-hint-body">
          請確認側邊<strong>靜音鍵已關閉</strong>（橘色不可見），或接上<strong>耳機／藍牙</strong>。
        </p>
        <button type="button" className="ios-sound-hint-primary" onClick={onConfirm}>
          知道了，開始
        </button>
      </div>
    </div>
  );
}
