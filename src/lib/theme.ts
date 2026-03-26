export type Theme = 'dark' | 'light';
const KEY = 'psmv.theme';

export function getTheme(): Theme {
  return (localStorage.getItem(KEY) as Theme) ?? 'dark';
}

export function setTheme(t: Theme) {
  localStorage.setItem(KEY, t);
  document.documentElement.classList.toggle('dark', t === 'dark');
}

export function initTheme() {
  setTheme(getTheme());
}
