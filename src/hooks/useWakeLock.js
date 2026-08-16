import { useRef, useCallback, useEffect } from 'react';

export function useWakeLock(isPlaying) {
  const wakeLockRef = useRef(null);

  const request = useCallback(async () => {
    if (!('wakeLock' in navigator)) return false;
    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen');
      wakeLockRef.current.addEventListener('release', () => {
        wakeLockRef.current = null;
      });
      return true;
    } catch {
      return false;
    }
  }, []);

  const release = useCallback(async () => {
    if (wakeLockRef.current) {
      await wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isPlaying) {
      request();
    } else {
      release();
    }
  }, [isPlaying, request, release]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && isPlaying) {
        request();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [isPlaying, request]);

  useEffect(() => () => { release(); }, [release]);

  return {
    hasSupport: 'wakeLock' in navigator,
    request,
    release,
  };
}
