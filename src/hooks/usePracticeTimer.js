import { useState, useEffect, useRef, useCallback } from 'react';

export function usePracticeTimer(isPlaying, timerMinutes, timerSeconds, onComplete) {
  const [remaining, setRemaining] = useState(null);
  const endAtRef = useRef(null);
  const rafRef = useRef(null);
  const onCompleteRef = useRef(onComplete);

  const totalSeconds = timerMinutes * 60 + timerSeconds;

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
    if (!isPlaying || totalSeconds <= 0) {
      clearTimer();
      return () => setRemaining(null);
    }

    endAtRef.current = Date.now() + totalSeconds * 1000;

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
  }, [isPlaying, totalSeconds, clearTimer]);

  const formatRemaining = () => {
    if (remaining == null) return '';
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    return `剩 ${mins}:${String(secs).padStart(2, '0')}`;
  };

  return {
    hasTimer: isPlaying && totalSeconds > 0 && remaining != null,
    display: formatRemaining(),
  };
}
