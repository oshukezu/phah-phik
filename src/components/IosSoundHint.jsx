import './IosSoundHint.css';

const GUIDE_ITEMS = [
  '關閉側邊靜音鍵（橘色不可見）',
  '或接上耳機／藍牙',
  '開始播放後再按音量鍵，確認媒體音量',
];

export default function IosSoundHint({ open, variant, onConfirm, onDismiss, onNoSound }) {
  if (!open || !variant) return null;

  if (variant === 'preStart') {
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

  if (variant === 'previewAsk') {
    return (
      <div className="ios-sound-hint-overlay" role="dialog" aria-modal="true" aria-labelledby="ios-hint-preview-title">
        <div className="ios-sound-hint-card">
          <h2 id="ios-hint-preview-title">有聽到聲音嗎？</h2>
          <div className="ios-sound-hint-actions">
            <button type="button" className="ios-sound-hint-primary" onClick={onConfirm}>
              有
            </button>
            <button type="button" className="ios-sound-hint-secondary" onClick={onNoSound}>
              沒有
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'previewGuide') {
    return (
      <div className="ios-sound-hint-overlay" role="dialog" aria-modal="true" aria-labelledby="ios-hint-guide-title">
        <div className="ios-sound-hint-card">
          <h2 id="ios-hint-guide-title">若聽不到，請檢查</h2>
          <ul className="ios-sound-hint-list">
            {GUIDE_ITEMS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <button type="button" className="ios-sound-hint-primary" onClick={onDismiss}>
            我知道了
          </button>
        </div>
      </div>
    );
  }

  return null;
}
