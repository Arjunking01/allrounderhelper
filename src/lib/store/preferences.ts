import { create } from 'zustand';

export type AccentColor = 'electric' | 'violet' | 'emerald' | 'rose';

export const ACCENT_HEX: Record<AccentColor, { from: string; to: string }> = {
  electric: { from: '#3b6dfb', to: '#8b3ffb' },
  violet: { from: '#8b3ffb', to: '#3b6dfb' },
  emerald: { from: '#17cf8f', to: '#3b6dfb' },
  rose: { from: '#f43f5e', to: '#8b3ffb' },
};

interface PreferencesState {
  accent: AccentColor;
  reduceMotion: boolean;
  displayName: string;
  /** Global UI sound-effects toggle — distinct from the Pomodoro alarm and Focus Mode soundscape settings, which remain tool-specific. */
  uiSoundEnabled: boolean;
  /** Global UI sound-effects volume (0–1). */
  uiSoundVolume: number;
  setAccent: (a: AccentColor) => void;
  setReduceMotion: (v: boolean) => void;
  setDisplayName: (v: string) => void;
  setUiSoundEnabled: (v: boolean) => void;
  setUiSoundVolume: (v: number) => void;
}

type PersistedPrefs = {
  accent: AccentColor;
  reduceMotion: boolean;
  displayName: string;
  uiSoundEnabled: boolean;
  uiSoundVolume: number;
};

const DEFAULT_PREFS: PersistedPrefs = {
  accent: 'electric',
  reduceMotion: false,
  displayName: '',
  uiSoundEnabled: true,
  uiSoundVolume: 0.5,
};

function readInitial(): PersistedPrefs {
  if (typeof window === 'undefined') return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem('ar-preferences');
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedPrefs>;
      const accent = parsed && typeof parsed === 'object' && parsed.accent && parsed.accent in ACCENT_HEX ? parsed.accent : DEFAULT_PREFS.accent;
      const reduceMotion = parsed && typeof parsed === 'object' && typeof parsed.reduceMotion === 'boolean' ? parsed.reduceMotion : DEFAULT_PREFS.reduceMotion;
      const displayName = parsed && typeof parsed === 'object' && typeof parsed.displayName === 'string' ? parsed.displayName.slice(0, 40) : DEFAULT_PREFS.displayName;
      // Fields added after the original release — fall back to defaults for prefs persisted before they existed (legacy localStorage).
      const uiSoundEnabled = parsed && typeof parsed === 'object' && typeof parsed.uiSoundEnabled === 'boolean' ? parsed.uiSoundEnabled : DEFAULT_PREFS.uiSoundEnabled;
      const uiSoundVolume = parsed && typeof parsed === 'object' && typeof parsed.uiSoundVolume === 'number' ? Math.max(0, Math.min(1, parsed.uiSoundVolume)) : DEFAULT_PREFS.uiSoundVolume;
      return { accent, reduceMotion, displayName, uiSoundEnabled, uiSoundVolume };
    }
  } catch {
    // ignore
  }
  return DEFAULT_PREFS;
}

function persist(state: PersistedPrefs) {
  try {
    window.localStorage.setItem('ar-preferences', JSON.stringify(state));
  } catch {
    // ignore
  }
  document.documentElement.classList.toggle('reduce-motion', state.reduceMotion);
  document.documentElement.style.setProperty('--accent-from', ACCENT_HEX[state.accent].from);
  document.documentElement.style.setProperty('--accent-to', ACCENT_HEX[state.accent].to);
}

const initial = readInitial();
if (typeof window !== 'undefined') persist(initial);

function toPersisted(s: PreferencesState): PersistedPrefs {
  return {
    accent: s.accent,
    reduceMotion: s.reduceMotion,
    displayName: s.displayName,
    uiSoundEnabled: s.uiSoundEnabled,
    uiSoundVolume: s.uiSoundVolume,
  };
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  accent: initial.accent,
  reduceMotion: initial.reduceMotion,
  displayName: initial.displayName,
  uiSoundEnabled: initial.uiSoundEnabled,
  uiSoundVolume: initial.uiSoundVolume,
  setAccent: (accent) => {
    persist(toPersisted({ ...get(), accent }));
    set({ accent });
  },
  setReduceMotion: (reduceMotion) => {
    persist(toPersisted({ ...get(), reduceMotion }));
    set({ reduceMotion });
  },
  setDisplayName: (rawName) => {
    const displayName = rawName.slice(0, 40);
    persist(toPersisted({ ...get(), displayName }));
    set({ displayName });
  },
  setUiSoundEnabled: (uiSoundEnabled) => {
    persist(toPersisted({ ...get(), uiSoundEnabled }));
    set({ uiSoundEnabled });
  },
  setUiSoundVolume: (rawVolume) => {
    const uiSoundVolume = Math.max(0, Math.min(1, rawVolume));
    persist(toPersisted({ ...get(), uiSoundVolume }));
    set({ uiSoundVolume });
  },
}));
