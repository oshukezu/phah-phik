import { useState, useEffect, useCallback } from 'react';

const THEME_KEY = 'elder-metronome-theme';

function getSystemTheme() {
  if (window.matchMedia?.('(prefers-color-scheme: light)').matches) return 'light';
  return 'dark';
}

function resolveTheme(mode) {
  return mode === 'system' ? getSystemTheme() : mode;
}

function applyThemeToDom(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  const color = theme === 'dark' ? '#12121a' : '#f5f7fa';
  meta?.setAttribute('content', color);
}

export function useTheme() {
  const [themeMode, setThemeMode] = useState(() => {
    const saved = localStorage.getItem(THEME_KEY);
    return saved || 'system';
  });

  const [actualTheme, setActualTheme] = useState(() => {
    const saved = localStorage.getItem(THEME_KEY) || 'system';
    const resolved = resolveTheme(saved);
    applyThemeToDom(resolved);
    return resolved;
  });

  const setTheme = useCallback((mode) => {
    setThemeMode(mode);
    localStorage.setItem(THEME_KEY, mode);
    const resolved = resolveTheme(mode);
    applyThemeToDom(resolved);
    setActualTheme(resolved);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = () => {
      if (themeMode === 'system') {
        const resolved = getSystemTheme();
        applyThemeToDom(resolved);
        setActualTheme(resolved);
      }
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [themeMode]);

  return { themeMode, actualTheme, setTheme };
}
