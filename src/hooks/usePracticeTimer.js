import { useState, useEffect, useRef, useCallback } from 'react';

export function usePracticeTimer(isPlaying, timerMinutes, onComplete) {
  const [remaining, setRemaining] = useState(null);
  const endAtRef = useRef(null);
  const rafRef = useRef(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const clearTimer = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    endAtRef.current = null;
  }, []);

  useEffect(() => {
    if (!isPlaying || timerMinutes <= 0) {
      clearTimer();
      return () => setRemaining(null);
    }

    endAtRef.current = Date.now() + timerMinutes * 60 * 1000;

    const tick = () => {
      if (!endAtRef.current) return;
      const left = Math.max(0, endAtRef.current - Date.now());
      setRemaining(left);
      if (left <= 0) {
        clearTimer();
        onCompleteRef.current();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      clearTimer();
      setRemaining(null);
    };
  }, [isPlaying, timerMinutes, clearTimer]);

  const formatRemaining = () => {
    if (remaining == null) return '';
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    return `剩 ${mins}:${String(secs).padStart(2, '0')}`;
  };

  return {
    hasTimer: isPlaying && timerMinutes > 0 && remaining != null,
    display: formatRemaining(),
  };
}
