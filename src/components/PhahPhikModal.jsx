import { useCallback, useRef } from 'react';
import { requestPlaybackAudioSession } from '../utils/audioSession';
import './PhahPhikModal.css';

const SUTIAN_ENTRY_URL = 'https://sutian.moe.edu.tw/zh-hant/su/4034/';

function getPhahPhikAudioUrl() {
  return `${import.meta.env.BASE_URL}sounds/phah-phik-sutian.mp3`;
}

export default function PhahPhikModal({ open, onClose }) {
  const audioRef = useRef(null);

  const handlePlay = useCallback(() => {
    requestPlaybackAudioSession();
    if (!audioRef.current) {
      audioRef.current = new Audio(getPhahPhikAudioUrl());
    }
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  }, []);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!open) return null;

  return (
    <div
      className="phah-phik-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="phah-phik-title"
      onClick={handleBackdropClick}
    >
      <div className="phah-phik-card">
        <h2 id="phah-phik-title">拍魄仔</h2>
        <p className="phah-phik-line">台語：拍拍 (phah-phik)</p>
        <p className="phah-phik-line">華語：打節拍</p>
        <button type="button" className="phah-phik-play" onClick={handlePlay}>
          點擊發音
        </button>
        <p className="phah-phik-source">
          音檔：
          <a href={SUTIAN_ENTRY_URL} target="_blank" rel="noopener noreferrer">
            教育部臺灣台語常用詞辭典
          </a>
        </p>
        <button type="button" className="phah-phik-dismiss" onClick={onClose}>
          關閉
        </button>
      </div>
    </div>
  );
}
