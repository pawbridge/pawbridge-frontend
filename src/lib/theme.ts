import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

// 사용자가 고른 화면 모드. 고른 적이 없으면 기기 설정(시스템 다크 모드)을 따른다.
export type ThemePreference = 'light' | 'dark' | 'system';

// public/theme-init.js와 같은 키를 쓴다. 그 파일이 첫 화면 전에 같은 규칙으로 dark 클래스를 붙인다.
export const themeStorageKey = 'pawbridge-theme';
const systemDarkQuery = '(prefers-color-scheme: dark)';

export function parseThemePreference(saved: string | null): ThemePreference {
  return saved === 'light' || saved === 'dark' ? saved : 'system';
}

export function resolveDark(preference: ThemePreference, systemDark: boolean): boolean {
  return preference === 'dark' || (preference === 'system' && systemDark);
}

function readPreference(): ThemePreference {
  try {
    return parseThemePreference(localStorage.getItem(themeStorageKey));
  } catch {
    // 저장소를 막은 브라우저에서는 기기 설정만 따른다.
    return 'system';
  }
}

function savePreference(preference: ThemePreference) {
  try {
    localStorage.setItem(themeStorageKey, preference);
  } catch {
    // 저장하지 못해도 지금 화면에는 적용된다.
  }
}

function systemDark(): boolean {
  return typeof matchMedia === 'function' && matchMedia(systemDarkQuery).matches;
}

function applyDark(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark);
}

export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>(readPreference);
  const [systemIsDark, setSystemIsDark] = useState(systemDark);
  const isDark = resolveDark(preference, systemIsDark);

  useEffect(() => {
    applyDark(isDark);
  }, [isDark]);

  // 기기 설정을 따르는 동안에는 운영체제에서 모드를 바꾸면 바로 반영한다.
  useEffect(() => {
    if (typeof matchMedia !== 'function') return;
    const query = matchMedia(systemDarkQuery);
    const onChange = (event: MediaQueryListEvent) => setSystemIsDark(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const toggle = useCallback(() => {
    const next: ThemePreference = isDark ? 'light' : 'dark';
    savePreference(next);
    setPreference(next);
  }, [isDark]);

  return { isDark, toggle };
}

// 지금 화면이 다크인지. 헤더 밖 컴포넌트(지도 안내 문구 등)가 html의 dark 클래스를 지켜본다.
function subscribeDarkClass(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => observer.disconnect();
}

function readDarkClass() {
  return document.documentElement.classList.contains('dark');
}

export function useIsDark() {
  return useSyncExternalStore(subscribeDarkClass, readDarkClass, () => false);
}
