/**
 * Service layer over browser localStorage. `useLocalStorage` (in `src/hooks`) wraps
 * this for React state; import this module directly for one-off reads/writes outside
 * of component render (e.g. in the Settings data-export/import flows).
 */

const APP_PREFIX = 'ar-';

export const localStorageService = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  },

  set<T>(key: string, value: T): boolean {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },

  remove(key: string) {
    window.localStorage.removeItem(key);
  },

  allAppKeys(): string[] {
    return Object.keys(window.localStorage).filter((k) => k.startsWith(APP_PREFIX));
  },

  clearAll() {
    this.allAppKeys().forEach((k) => window.localStorage.removeItem(k));
  },
};
