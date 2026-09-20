export type FocusPhase = 'work' | 'short-break' | 'long-break';

export interface FocusSession {
  id: string;
  label: string;
  minutes: number;
  phase: FocusPhase;
  completedAt: string;
}

export interface FocusSettings {
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  sessionsUntilLongBreak: number;
  autoAdvance: boolean;
  soundscape: 'none' | 'rain' | 'white-noise';
  /** 0–1. Applied both when the soundscape starts and live while it's already playing. */
  soundscapeVolume: number;
  /** Whether the short alarm tone plays when a work session or break finishes. Independent of
   * `soundscape` (that's the ambient background sound while a session runs, not the
   * completion signal) and of the app-wide "Sound effects" toggle in Settings, which is
   * explicitly scoped out of Focus Mode/Pomodoro's own alarm sounds (see SettingsPage.tsx). */
  soundEnabled: boolean;
}

export const DEFAULT_FOCUS_SETTINGS: FocusSettings = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  sessionsUntilLongBreak: 4,
  autoAdvance: true,
  soundscape: 'none',
  soundscapeVolume: 0.6,
  soundEnabled: true,
};

export const PHASE_LABEL: Record<FocusPhase, string> = {
  work: 'Focus session',
  'short-break': 'Short break',
  'long-break': 'Long break',
};

export const MOTIVATIONAL_MESSAGES = [
  'Small steps, done consistently, beat big plans done never.',
  'Future you is going to thank you for this session.',
  'Progress, not perfection.',
  'One focused hour beats three distracted ones.',
  'You don\'t have to feel motivated to get started — starting creates motivation.',
  'Deep work is a superpower in a distracted world.',
  'This session is already better than not trying.',
];

export function todayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export type FocusStatus = 'idle' | 'running' | 'paused';

/** Bump if the shape of FocusRuntimeState ever changes incompatibly. A snapshot written by a
 * different version is treated as unrecognized (falls back to idle) rather than guessed at —
 * silently reinterpreting a future/older schema's fields under new assumptions is how you get
 * a session that "restores" into a state nobody actually had. */
const RUNTIME_SCHEMA_VERSION = 1;

/** Persisted snapshot of an in-progress Focus Mode session, written to localStorage so a
 * refresh, tab close, or PWA relaunch doesn't silently lose an active or paused timer. */
export interface FocusRuntimeState {
  version: number;
  status: FocusStatus;
  phase: FocusPhase;
  label: string;
  cyclesCompleted: number;
  /** Frozen remaining seconds. Only meaningful when status === 'paused'. */
  secondsLeft: number;
  /** Absolute ms epoch the phase reaches zero at. Only meaningful when status === 'running'. */
  targetEnd: number | null;
}

export const DEFAULT_FOCUS_RUNTIME: FocusRuntimeState = {
  version: RUNTIME_SCHEMA_VERSION,
  status: 'idle',
  phase: 'work',
  label: '',
  cyclesCompleted: 0,
  secondsLeft: 0,
  targetEnd: null,
};

/** Stamps the current schema version onto a runtime snapshot so call sites never have to
 * repeat (or accidentally drift from) the version number by hand. */
export function makeFocusRuntime(state: Omit<FocusRuntimeState, 'version'>): FocusRuntimeState {
  return { version: RUNTIME_SCHEMA_VERSION, ...state };
}

export interface FocusReconciliation {
  resume: { status: FocusStatus; phase: FocusPhase; label: string; cyclesCompleted: number; secondsLeft: number };
  /** A work/break phase that ran its full duration while the tab was gone. Logged once on
   * load, then the page returns to idle — Focus Mode never guesses how many further
   * auto-advance cycles to replay after an absence of unknown length. */
  completedWhileAway: { phase: FocusPhase; minutes: number; label: string } | null;
}

/** A finite, non-negative number — rejects NaN, ±Infinity, and negatives up front so nothing
 * downstream has to re-guard against them (typeof NaN === 'number', so a plain typeof check
 * would let it through). */
function isFiniteNonNegative(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0;
}

function isValidRuntime(rt: unknown): rt is FocusRuntimeState {
  if (!rt || typeof rt !== 'object') return false;
  const r = rt as Record<string, unknown>;
  return (
    r.version === RUNTIME_SCHEMA_VERSION &&
    (r.status === 'idle' || r.status === 'running' || r.status === 'paused') &&
    (r.phase === 'work' || r.phase === 'short-break' || r.phase === 'long-break') &&
    typeof r.label === 'string' &&
    isFiniteNonNegative(r.cyclesCompleted) &&
    isFiniteNonNegative(r.secondsLeft) &&
    (r.targetEnd === null || (typeof r.targetEnd === 'number' && Number.isFinite(r.targetEnd)))
  );
}

const IDLE_RESUME = { status: 'idle' as const, phase: 'work' as const, label: '', cyclesCompleted: 0, secondsLeft: 0 };

/**
 * Reconciles a persisted runtime snapshot against the current wall clock. Handles: malformed,
 * NaN/negative/impossible, or a different-schema-version localStorage (falls back to idle), a
 * paused session (restored as-is, clamped to the phase's valid range), a still-running session
 * (remaining time recomputed from the absolute deadline and clamped to the phase's max — an
 * absurdly distant `targetEnd`, e.g. from corrupted data, can never leave more time remaining
 * than the phase's own configured duration), and a running session whose deadline already
 * passed while the tab was gone (logged as one completed session, then idle).
 */
export function reconcileFocusRuntime(
  raw: unknown,
  phaseMinutesFor: (p: FocusPhase) => number,
  now: number = Date.now(),
): FocusReconciliation {
  if (!isValidRuntime(raw) || raw.status === 'idle') {
    return { resume: IDLE_RESUME, completedWhileAway: null };
  }

  if (raw.status === 'paused') {
    const max = Math.max(1, phaseMinutesFor(raw.phase) * 60);
    const secondsLeft = Math.min(Math.round(raw.secondsLeft), max);
    return {
      resume: { status: 'paused', phase: raw.phase, label: raw.label, cyclesCompleted: Math.round(raw.cyclesCompleted), secondsLeft },
      completedWhileAway: null,
    };
  }

  // status === 'running'
  if (raw.targetEnd == null) {
    return { resume: IDLE_RESUME, completedWhileAway: null };
  }
  const remainingMs = raw.targetEnd - now;
  if (remainingMs > 0) {
    const max = Math.max(1, phaseMinutesFor(raw.phase) * 60);
    return {
      resume: {
        status: 'running',
        phase: raw.phase,
        label: raw.label,
        cyclesCompleted: Math.round(raw.cyclesCompleted),
        secondsLeft: Math.min(Math.max(1, Math.round(remainingMs / 1000)), max),
      },
      completedWhileAway: null,
    };
  }
  return {
    resume: {
      ...IDLE_RESUME,
      cyclesCompleted: raw.phase === 'work' ? Math.max(0, raw.cyclesCompleted) + 1 : Math.max(0, raw.cyclesCompleted),
    },
    completedWhileAway: { phase: raw.phase, minutes: phaseMinutesFor(raw.phase), label: raw.label },
  };
}

/** Returns YYYY-MM-DD keys for the current week (Mon-Sun) up to and including today. */
export function currentWeekKeys(): string[] {
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return todayKey(d);
  });
}
