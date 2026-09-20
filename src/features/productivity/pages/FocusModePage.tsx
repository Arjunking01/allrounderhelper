import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Focus, Play, Pause, Square, CheckCircle2, Maximize, Minimize, Settings, Volume2, Bell, BellOff } from 'lucide-react';
import { ProductivityToolLayout } from '@/components/ProductivityToolLayout';
import { PageInfoSection } from '@/components/PageInfoSection';
import { Card, SoftCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { getProductivityToolBySlug } from '@/data/productivityRegistry';
import { playBeep, primeAlarmAudio } from '../logic/pomodoroSound';
import { SOUNDSCAPES, playSoundscape, stopSoundscape, setSoundscapeVolume } from '../logic/focusSoundscape';
import type { ToolArticleContent } from '@/components/ToolArticle';
import {
  DEFAULT_FOCUS_SETTINGS, DEFAULT_FOCUS_RUNTIME, MOTIVATIONAL_MESSAGES, PHASE_LABEL, todayKey, currentWeekKeys,
  reconcileFocusRuntime, makeFocusRuntime,
  type FocusPhase, type FocusSession, type FocusSettings, type FocusRuntimeState,
} from '../logic/focusModeTypes';

const tool = getProductivityToolBySlug('focus-mode')!;

const article: ToolArticleContent = {
  intro:
    'Focus Mode is a configurable work-session timer with fullscreen distraction-blocking, optional background soundscapes, and a running log of your total focus minutes. Like the Pomodoro Timer, it automatically cycles between a work session and a break — the difference is Focus Mode gives you quick duration presets, a task label, fullscreen mode, and a choice of background sound, rather than the Pomodoro Timer\u2019s fixed 25/5 rhythm and daily bar-chart stats.',
  whyItMatters:
    'A named task and a visible countdown make it easier to commit to one thing instead of drifting between tabs. Automatic breaks matter just as much here as in any interval-based technique \u2014 Focus Mode still inserts a short or long break after every work session (it just lets you pick the duration and skip the classic 25-minute default), so you get a bounded, sustainable rhythm rather than one long session you have to remember to stop.',
  howItWorks: [
    'Optionally type what you\u2019re focusing on, then pick a duration \u2014 15, 25, 45, or 60 minutes, or enter a custom value.',
    'Press Start. The timer counts down, and fullscreen mode plus an optional background soundscape (rain or white noise) can help block out distractions.',
    'When the work session ends, it automatically logs the session and moves to a short break \u2014 or a long break every few sessions, based on the "Sessions until long break" setting.',
    'If "Auto-start the next session/break" is on, the next phase begins on its own; otherwise you start it manually from the Settings panel.',
    'Every completed session (work or break) is added to your local history, which powers the daily and weekly focus-minute totals.',
  ],
  examples: [
    { title: 'Single deep-work block', body: 'Set a 45 or 60-minute work duration with auto-start off, so the timer stops after one session instead of cycling into a break automatically \u2014 useful for one uninterrupted stretch on a single assignment.' },
    { title: 'Multi-session study block', body: 'Use the 25-minute preset with auto-start on and a rain soundscape, so the timer keeps cycling work \u2192 short break \u2192 work on its own while you work through several topics back to back.' },
  ],
  mistakes: [
    'Assuming Focus Mode never breaks \u2014 by default it auto-advances into a short or long break after every work session, the same as an interval timer, unless you turn off "Auto-start the next session/break".',
    'Picking a very long custom duration for your first session \u2014 a shorter, completed session builds a more useful log than a long one you abandon partway through.',
    'Leaving the browser tab in the background without fullscreen \u2014 the countdown keeps running either way, but fullscreen mode is what actually removes on-screen distractions.',
  ],
  tips: [
    'Turn off auto-advance if you want a single uninterrupted session rather than the automatic break cycle.',
    'Use the task label field to name what you\u2019re working on \u2014 it shows up in your session history, making the daily/weekly totals more useful to review later.',
    'Reach for the Pomodoro Timer instead if you specifically want the classic fixed 25/5 rhythm with a 7-day bar chart of completed sessions.',
  ],
  faqs: [
    { question: 'What\u2019s the difference between Focus Mode and the Pomodoro Timer?', answer: 'Both automatically cycle work sessions with short/long breaks. Focus Mode adds duration presets, a task label, fullscreen mode, and background soundscapes; the Pomodoro Timer sticks to the classic 25/5 rhythm and shows a 7-day bar chart of completed sessions instead.' },
    { question: 'Does Focus Mode take breaks automatically?', answer: 'Yes, by default \u2014 after each work session it advances to a short break, and to a long break every few sessions (configurable), then back to work if auto-start is enabled. Turn off "Auto-start the next session/break" if you want it to stop after one session instead.' },
    { question: 'Where do my focus sessions get saved?', answer: 'Locally in this browser only \u2014 there\u2019s no account or server involved. Clearing your browser data will clear your session history.' },
    { question: 'Can I pause a session, and does it survive a refresh?', answer: 'Yes \u2014 Pause freezes the countdown without losing it, and Resume picks up from the exact same remaining time. A running or paused session is also restored if you refresh the page, close the tab, or reopen the installed app; the remaining time is always recalculated from when the session should end, not from how many seconds happened to tick by.' },
  ],
  related: [
    { label: 'Pomodoro Timer', href: '/productivity/pomodoro-timer' },
    { label: 'Priority Matrix', href: '/productivity/priority-matrix' },
  ],
};
const DURATIONS = [15, 25, 45, 60];

/**
 * Best-effort "your session finished" alert for when the tab is backgrounded. Prefers the
 * existing PWA's service-worker registration (`registration.showNotification`) over the plain
 * `Notification()` constructor: MDN documents that the bare constructor throws on most mobile
 * browsers, which register a service worker specifically to support notifications through it.
 * `navigator.serviceWorker.ready` never rejects but can hang indefinitely if no SW ever
 * activates, so it's raced against a short timeout rather than awaited unconditionally — this
 * function is fire-and-forget from the caller and must never block or throw into it. No push
 * infrastructure is added here; this only shows a notification for a page that is still open,
 * using the service worker vite-plugin-pwa already registers for asset caching.
 */
async function notifyFocusCompletion(body: string): Promise<void> {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  try {
    if ('serviceWorker' in navigator) {
      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
      ]);
      if (registration && typeof registration.showNotification === 'function') {
        await registration.showNotification('Focus Mode', { body, tag: 'ar-focus-complete' });
        return;
      }
    }
    new Notification('Focus Mode', { body, tag: 'ar-focus-complete' });
  } catch {
    // Best-effort only — notification delivery is an enhancement, never the source of truth
    // for phase completion, so a failure here must never surface to the caller.
  }
}

export default function FocusModePage() {
  const [sessions, setSessions] = useLocalStorage<FocusSession[]>('ar-focus-sessions', []);
  const [settings, setSettings] = useLocalStorage<FocusSettings>('ar-focus-settings', DEFAULT_FOCUS_SETTINGS);
  // PHASE 4 — persisted so a refresh, tab close, or PWA relaunch doesn't silently lose a
  // running or paused session. `runtime` itself is a write target (see the persistence effect
  // below); the *read* used to restore state happens once via reconcileFocusRuntime, below.
  const [runtime, setRuntime] = useLocalStorage<FocusRuntimeState>('ar-focus-runtime', DEFAULT_FOCUS_RUNTIME);

  // Resolved once per page load (lazy — never recomputed on re-render), comparing the
  // persisted snapshot against the current clock. A session whose deadline already passed
  // while the tab was away is logged as completed and the page returns to idle; it does not
  // guess how many further auto-advance cycles to replay after an absence of unknown length.
  const reconciledRef = useRef<ReturnType<typeof reconcileFocusRuntime> | null>(null);
  if (reconciledRef.current === null) {
    reconciledRef.current = reconcileFocusRuntime(runtime, (p) =>
      p === 'work' ? settings.workMinutes : p === 'short-break' ? settings.shortBreakMinutes : settings.longBreakMinutes,
    );
  }
  const resumed = reconciledRef.current.resume;

  // PHASE 3 — Plan My Day links here with `?task=<title>` so picking a specific overdue item,
  // habit, or scheduled session carries its name into Focus Mode as the active task label,
  // instead of opening to a blank session. Read once on mount only (lazy initializer) — this
  // must never fight the user's own typing if they edit the label after arriving. If a
  // running/paused session was just restored, its own label wins over the URL param.
  const [searchParams] = useSearchParams();
  const [label, setLabel] = useState(() => (resumed.status !== 'idle' ? resumed.label : searchParams.get('task') ?? ''));
  const [phase, setPhase] = useState<FocusPhase>(() => resumed.phase);
  const [cyclesCompleted, setCyclesCompleted] = useState(() => resumed.cyclesCompleted);
  // Distinguishes "no session started yet" (idle — shows the setup screen) from "session
  // started but not currently ticking" (paused — shows the timer, frozen). `active` alone
  // used to conflate these: stopping the timer always fell back to the setup screen, so there
  // was no way to resume a session once you left the running countdown — only restart from
  // scratch. hasSession + active together give the four states Focus Mode actually needs:
  // idle (!hasSession), running (hasSession && active), paused (hasSession && !active).
  const [hasSession, setHasSession] = useState(() => resumed.status !== 'idle');
  const [active, setActive] = useState(() => resumed.status === 'running');
  const [secondsLeft, setSecondsLeft] = useState(() => (resumed.status !== 'idle' ? resumed.secondsLeft : settings.workMinutes * 60));
  const [justCompleted, setJustCompleted] = useState(false);
  const [message, setMessage] = useState(MOTIVATIONAL_MESSAGES[0]);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Browser notification permission for an optional "your session finished" alert while this
  // tab is backgrounded. Mirrors the existing pattern in ExamCountdownPage/CalendarPage: read
  // the current permission on mount (never request it — that only happens from the explicit
  // "Enable" button below, on a genuine user gesture). There is no push/service-worker backend
  // here, same as those pages — this only fires while the tab stays open, stated honestly in
  // the FAQ below.
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>('unsupported');
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const targetEndRef = useRef<number | null>(null);
  // Guards against finishPhase() firing twice for the same phase: the 1s interval and the
  // visibilitychange-triggered tick (fired when returning from a backgrounded/locked tab) can
  // both observe "remaining <= 0" for the same deadline before the interval is torn down,
  // which previously could log a duplicate completed session and double-advance the cycle.
  const firedRef = useRef(false);
  // Always holds the latest phase/label/cyclesCompleted/settings, independent of when the
  // ticking effect's closure was created. finishPhase (and start(), via phaseMinutes) read
  // from this instead of their own closure so that editing settings mid-session — e.g.
  // opening Settings without pausing and changing the work/break length — is honored even
  // though the interval effect itself only restarts when `active` toggles, not on every
  // settings change.
  const latestRef = useRef({ phase, label, cyclesCompleted, settings, notifPermission });
  latestRef.current = { phase, label, cyclesCompleted, settings, notifPermission };
  // Holds the pending `setTimeout` id scheduled by finishPhase()'s auto-advance branch (the
  // ~1.2-2.6s gap between a phase ending and the next one auto-starting, during which
  // `hasSession` is still true so Resume/End remain clickable). Previously nothing tracked or
  // cancelled this timeout, so clicking "End session" during that gap looked like it worked
  // (hasSession/active both flip to false) but the pending timeout still fired afterwards and
  // called start(), silently resurrecting the session the user had just ended; clicking
  // "Resume" during the same gap had the delayed start() clobber the countdown the user had
  // just resumed, snapping it back to a fresh full duration. stop()/resume() now cancel this
  // timeout, and it's cleared on unmount too so it can't fire into an unmounted page.
  const autoAdvanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (autoAdvanceTimeoutRef.current) clearTimeout(autoAdvanceTimeoutRef.current);
  }, []);

  // Logs a session that ran to completion entirely while the tab was closed/refreshed. Runs
  // once on mount only; does nothing if reconciliation found no such session.
  useEffect(() => {
    const away = reconciledRef.current?.completedWhileAway;
    if (!away) return;
    setSessions((prev) => [
      { id: crypto.randomUUID(), label: away.phase === 'work' ? away.label || 'Focus session' : PHASE_LABEL[away.phase], minutes: away.minutes, phase: away.phase, completedAt: new Date().toISOString() },
      ...prev,
    ].slice(0, 100));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function phaseMinutes(p: FocusPhase, s: FocusSettings = latestRef.current.settings) {
    return p === 'work' ? s.workMinutes : p === 'short-break' ? s.shortBreakMinutes : s.longBreakMinutes;
  }

  useEffect(() => {
    if (!active) {
      targetEndRef.current = null;
      return;
    }
    targetEndRef.current = Date.now() + secondsLeft * 1000;
    firedRef.current = false;

    function tick() {
      if (firedRef.current || targetEndRef.current === null) return;
      const remaining = Math.max(0, Math.round((targetEndRef.current - Date.now()) / 1000));
      if (remaining <= 0) {
        firedRef.current = true;
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        finishPhase();
      } else {
        setSecondsLeft(remaining);
      }
    }

    function onVisibilityChange() {
      if (document.visibilityState === 'visible') tick();
    }

    intervalRef.current = setInterval(tick, 1000);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Mirrors the in-memory session into localStorage so it survives a refresh/relaunch.
  // Deliberately excludes `secondsLeft` while running (it ticks every second and is fully
  // recoverable from `targetEnd` on reload, so including it here would rewrite storage once a
  // second for no benefit); pause() persists the frozen secondsLeft explicitly instead.
  useEffect(() => {
    if (!hasSession) {
      setRuntime(DEFAULT_FOCUS_RUNTIME);
      return;
    }
    if (active) {
      setRuntime(makeFocusRuntime({ status: 'running', phase, label, cyclesCompleted, secondsLeft: 0, targetEnd: targetEndRef.current }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasSession, active, phase, label, cyclesCompleted]);

  useEffect(() => {
    function onFsChange() { setIsFullscreen(Boolean(document.fullscreenElement)); }
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Falls back for settings persisted before soundscapeVolume/soundEnabled existed (legacy
  // localStorage) — useLocalStorage doesn't deep-merge missing keys onto the default object,
  // it only substitutes the whole value when the parsed JSON fails its shape check, so an
  // older settings object simply lacks these keys rather than getting them defaulted.
  const soundscapeVolume = settings.soundscapeVolume ?? DEFAULT_FOCUS_SETTINGS.soundscapeVolume;
  const soundEnabled = settings.soundEnabled ?? DEFAULT_FOCUS_SETTINGS.soundEnabled;

  useEffect(() => {
    if (typeof Notification !== 'undefined') setNotifPermission(Notification.permission);
  }, []);
  async function requestNotifications() {
    if (typeof Notification === 'undefined') return;
    try {
      const result = await Notification.requestPermission();
      setNotifPermission(result);
    } catch {
      // Some embedded/older-browser contexts can reject here instead of resolving 'denied' —
      // treat it the same as denied rather than leaving an unhandled rejection.
      setNotifPermission('denied');
    }
  }

  useEffect(() => {
    if (active && settings.soundscape !== 'none') {
      playSoundscape(settings.soundscape, soundscapeVolume);
    } else {
      stopSoundscape();
    }
    return () => stopSoundscape();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, settings.soundscape]);

  // Live volume changes while a soundscape is already playing, without restarting it.
  useEffect(() => {
    if (active && settings.soundscape !== 'none') {
      setSoundscapeVolume(soundscapeVolume);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundscapeVolume]);

  function start(p: FocusPhase = phase) {
    if (autoAdvanceTimeoutRef.current) { clearTimeout(autoAdvanceTimeoutRef.current); autoAdvanceTimeoutRef.current = null; }
    primeAlarmAudio(); // unlock audio now, from this real click, before any timer-driven completion tone
    setPhase(p);
    setSecondsLeft(phaseMinutes(p) * 60);
    setHasSession(true);
    setActive(true);
    setJustCompleted(false);
  }

  // Freezes the countdown without discarding it — recomputes the exact remaining time from
  // the deadline (not the last 1s-granularity tick) so pausing right before a tick boundary
  // doesn't shave a second off. Persists immediately so a refresh while paused restores the
  // same remaining time.
  function pause() {
    const remaining = targetEndRef.current !== null ? Math.max(0, Math.round((targetEndRef.current - Date.now()) / 1000)) : secondsLeft;
    setSecondsLeft(remaining);
    setActive(false);
    setRuntime(makeFocusRuntime({ status: 'paused', phase, label, cyclesCompleted, secondsLeft: remaining, targetEnd: null }));
  }

  // Resuming just flips `active` back on; the ticking effect recomputes a fresh deadline from
  // the current (frozen) secondsLeft, and the persistence effect writes the new 'running'
  // snapshot once that deadline exists.
  function resume() {
    if (autoAdvanceTimeoutRef.current) { clearTimeout(autoAdvanceTimeoutRef.current); autoAdvanceTimeoutRef.current = null; }
    primeAlarmAudio(); // this click may be the first real gesture this page load (e.g. right after restoring a paused session on refresh) — unlock audio now rather than waiting for a timer-driven completion tone to try and fail
    setActive(true);
  }

  // Fully ends the session (forfeiting any remaining time) and returns to the setup screen —
  // distinct from pause(), which keeps the session resumable.
  function stop() {
    if (autoAdvanceTimeoutRef.current) { clearTimeout(autoAdvanceTimeoutRef.current); autoAdvanceTimeoutRef.current = null; }
    setActive(false);
    setHasSession(false);
  }

  function finishPhase() {
    const { phase: currentPhase, label: currentLabel, cyclesCompleted: currentCycles, settings: currentSettings, notifPermission: currentNotifPermission } = latestRef.current;
    const soundOn = currentSettings.soundEnabled ?? DEFAULT_FOCUS_SETTINGS.soundEnabled;
    if (soundOn) playBeep();
    setActive(false);

    // A system notification only adds value when the tab is actually backgrounded — if it's
    // visible, the completion overlay/sound already covers it, and firing one anyway would be
    // a redundant, easily-annoying duplicate signal for the common case. `notifyFocusCompletion`
    // is fire-and-forget: it never throws into this function and never blocks session logging,
    // the phase transition, or persistence below it.
    const completedLabel = currentPhase === 'work' ? currentLabel || 'Focus session' : PHASE_LABEL[currentPhase];
    if (document.visibilityState === 'hidden' && currentNotifPermission === 'granted') {
      void notifyFocusCompletion(`${completedLabel} finished.`);
    }

    if (currentPhase === 'work') {
      setSessions((prev) => [{ id: crypto.randomUUID(), label: currentLabel || 'Focus session', minutes: currentSettings.workMinutes, phase: 'work' as const, completedAt: new Date().toISOString() }, ...prev].slice(0, 100));
      setMessage(MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)]);
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 2500);

      const nextCycles = currentCycles + 1;
      setCyclesCompleted(nextCycles);
      const nextPhase: FocusPhase = nextCycles % currentSettings.sessionsUntilLongBreak === 0 ? 'long-break' : 'short-break';
      const nextSeconds = phaseMinutes(nextPhase, currentSettings) * 60;
      setPhase(nextPhase);
      setSecondsLeft(nextSeconds);
      if (currentSettings.autoAdvance) {
        // `active` is already false and the persistence effect only writes while active, so
        // without this the on-disk snapshot would still say the *just-finished* phase is
        // 'running' with a deadline that's already passed — a refresh landing in this ~2.6s
        // auto-advance gap would then see that stale snapshot and log the same completion a
        // second time. Persisting it as 'paused' for the upcoming phase closes that window.
        setRuntime(makeFocusRuntime({ status: 'paused', phase: nextPhase, label: currentLabel, cyclesCompleted: nextCycles, secondsLeft: nextSeconds, targetEnd: null }));
        autoAdvanceTimeoutRef.current = setTimeout(() => start(nextPhase), 2600);
      } else {
        setHasSession(false);
      }
    } else {
      setSessions((prev) => [{ id: crypto.randomUUID(), label: PHASE_LABEL[currentPhase], minutes: phaseMinutes(currentPhase, currentSettings), phase: currentPhase, completedAt: new Date().toISOString() }, ...prev].slice(0, 100));
      const nextSeconds = currentSettings.workMinutes * 60;
      setPhase('work');
      setSecondsLeft(nextSeconds);
      if (currentSettings.autoAdvance) {
        setRuntime(makeFocusRuntime({ status: 'paused', phase: 'work', label: currentLabel, cyclesCompleted: currentCycles, secondsLeft: nextSeconds, targetEnd: null }));
        autoAdvanceTimeoutRef.current = setTimeout(() => start('work'), 1200);
      } else {
        setHasSession(false);
      }
    }
  }

  async function toggleFullscreen() {
    if (!document.fullscreenElement) await containerRef.current?.requestFullscreen();
    else await document.exitFullscreen();
  }

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const seconds = String(secondsLeft % 60).padStart(2, '0');
  const totalSeconds = phaseMinutes(phase) * 60;
  const progress = totalSeconds > 0 ? 1 - secondsLeft / totalSeconds : 0;

  const workSessions = useMemo(() => sessions.filter((s) => s.phase === 'work'), [sessions]);
  const dailyMinutes = useMemo(() => workSessions.filter((s) => todayKey(new Date(s.completedAt)) === todayKey()).reduce((sum, s) => sum + s.minutes, 0), [workSessions]);
  const weeklyMinutes = useMemo(() => {
    const weekKeys = new Set(currentWeekKeys());
    return workSessions.filter((s) => weekKeys.has(todayKey(new Date(s.completedAt)))).reduce((sum, s) => sum + s.minutes, 0);
  }, [workSessions]);
  const totalFocusMinutes = workSessions.reduce((sum, s) => sum + s.minutes, 0);

  // Announced on state *transitions* only (start/pause/resume/complete/idle) — the countdown
  // itself is never in this string, so a screen reader isn't told the remaining time every
  // second. Content only changes on a transition, so aria-live only fires then.
  const statusAnnouncement = justCompleted
    ? 'Focus session complete.'
    : !hasSession
      ? ''
      : `${PHASE_LABEL[phase]} ${active ? 'running' : 'paused'}.`;

  return (
    <ProductivityToolLayout
      toolName={tool.name} tagline={tool.tagline} description={tool.description}
      path="/productivity/focus-mode" icon={Focus} breadcrumb={{ label: 'Focus Mode' }}
article={article}
      headerActions={<Button variant="outline" size="sm" icon={<Settings size={14} />} onClick={() => setShowSettings((v) => !v)}>Settings</Button>}
    >
      <div className="grid lg:grid-cols-[1fr_300px] gap-6">
        <Card ref={containerRef} className={`flex flex-col items-center justify-center py-14 relative overflow-hidden ${isFullscreen ? 'bg-white dark:bg-navy-950' : ''}`}>
          <div className="sr-only" aria-live="polite" aria-atomic="true">{statusAnnouncement}</div>
          <button onClick={toggleFullscreen} aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen focus mode'} className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full border border-navy-200 dark:border-white/10 text-navy-400 hover:text-electric-500 hover:border-electric-500 z-20">
            {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
          </button>

          <AnimatePresence>
            {justCompleted && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 dark:bg-navy-900/95 z-10 px-8 text-center"
              >
                <CheckCircle2 size={48} className="text-emerald-500 mb-3" />
                <p className="font-semibold text-lg">Session complete</p>
                <p className="text-sm text-navy-500 dark:text-ink-400 max-w-xs mt-1">{message}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {showSettings ? (
            <SoftCard className="w-full max-w-sm">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <label className="text-sm">Focus (min)
                  <input type="number" min={1} value={settings.workMinutes} onChange={(e) => setSettings({ ...settings, workMinutes: Number(e.target.value) || 1 })} className="mt-1 w-full rounded-lg border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-3 py-2 outline-none focus:border-electric-500" />
                </label>
                <label className="text-sm">Short break (min)
                  <input type="number" min={1} value={settings.shortBreakMinutes} onChange={(e) => setSettings({ ...settings, shortBreakMinutes: Number(e.target.value) || 1 })} className="mt-1 w-full rounded-lg border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-3 py-2 outline-none focus:border-electric-500" />
                </label>
                <label className="text-sm">Long break (min)
                  <input type="number" min={1} value={settings.longBreakMinutes} onChange={(e) => setSettings({ ...settings, longBreakMinutes: Number(e.target.value) || 1 })} className="mt-1 w-full rounded-lg border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-3 py-2 outline-none focus:border-electric-500" />
                </label>
                <label className="text-sm">Sessions until long break
                  <input type="number" min={2} max={8} value={settings.sessionsUntilLongBreak} onChange={(e) => setSettings({ ...settings, sessionsUntilLongBreak: Number(e.target.value) || 4 })} className="mt-1 w-full rounded-lg border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-3 py-2 outline-none focus:border-electric-500" />
                </label>
              </div>
              <label className="flex items-center gap-2 text-sm mb-3">
                <input type="checkbox" checked={settings.autoAdvance} onChange={(e) => setSettings({ ...settings, autoAdvance: e.target.checked })} className="accent-electric-500" />
                Auto-start the next session/break
              </label>
              <label className="flex items-center gap-2 text-sm mb-3">
                <input type="checkbox" checked={soundEnabled} onChange={(e) => { if (e.target.checked) primeAlarmAudio(); setSettings({ ...settings, soundEnabled: e.target.checked }); }} className="accent-electric-500" />
                Play a sound when a session or break ends
              </label>
              <div>
                <p className="text-sm font-medium text-navy-700 dark:text-ink-300 mb-1.5 flex items-center gap-1.5"><Volume2 size={13} /> Background sound</p>
                <select value={settings.soundscape} onChange={(e) => setSettings({ ...settings, soundscape: e.target.value as FocusSettings['soundscape'] })} className="w-full rounded-lg border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-3 py-2 text-sm outline-none focus:border-electric-500">
                  {SOUNDSCAPES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
                {settings.soundscape !== 'none' && (
                  <label className="flex items-center gap-2 mt-2 text-xs text-navy-500 dark:text-ink-400">
                    <Volume2 size={13} className="shrink-0" />
                    <input
                      type="range" min={0} max={1} step={0.05} value={soundscapeVolume}
                      onChange={(e) => setSettings({ ...settings, soundscapeVolume: Number(e.target.value) })}
                      aria-label="Background sound volume"
                      className="w-full accent-electric-500"
                    />
                  </label>
                )}
                <p className="text-xs text-navy-400 dark:text-ink-500 mt-1">Plays softly in the background while a session is running.</p>
              </div>

              {notifPermission !== 'unsupported' && (
                <div className="mt-3 pt-3 border-t border-navy-100 dark:border-white/10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-navy-500 dark:text-ink-400 min-w-0">
                    {notifPermission === 'granted' ? <Bell size={14} className="text-emerald-500 shrink-0" /> : <BellOff size={14} className="shrink-0" />}
                    {notifPermission === 'granted' && "You'll get a browser notification if a session ends while this tab is in the background."}
                    {notifPermission === 'denied' && "Notifications are blocked for this site — change it in your browser's site settings to turn them back on."}
                    {notifPermission === 'default' && 'Enable notifications for an alert if a session ends while this tab is backgrounded.'}
                  </div>
                  {notifPermission === 'default' && (
                    <Button size="sm" variant="outline" onClick={requestNotifications}>Enable</Button>
                  )}
                </div>
              )}
            </SoftCard>
          ) : !hasSession ? (
            <div className="w-full max-w-sm space-y-5">
              <input
                type="text" placeholder="What are you focusing on?" value={label} onChange={(e) => setLabel(e.target.value)}
                className="w-full rounded-xl border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-4 py-2.5 text-center outline-none focus:border-electric-500 focus:ring-2 focus:ring-electric-500/20"
              />
              <div className="flex justify-center gap-2 flex-wrap">
                {DURATIONS.map((d) => (
                  <button key={d} onClick={() => setSettings({ ...settings, workMinutes: d })} className={`px-3.5 py-1.5 rounded-lg text-sm font-medium border transition-colors ${settings.workMinutes === d ? 'border-electric-500 bg-electric-500/10 text-electric-500' : 'border-navy-200 dark:border-white/10 text-navy-500 dark:text-ink-400'}`}>
                    {d}m
                  </button>
                ))}
                <input
                  type="number" min={1} placeholder="Custom" value={DURATIONS.includes(settings.workMinutes) ? '' : settings.workMinutes}
                  onChange={(e) => e.target.value && setSettings({ ...settings, workMinutes: Number(e.target.value) })}
                  className="w-20 rounded-lg border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-2 py-1.5 text-sm text-center outline-none focus:border-electric-500"
                />
              </div>
              <Button fullWidth size="lg" icon={<Play size={18} />} onClick={() => start('work')}>Start focus session</Button>
              <p className="text-xs text-center text-navy-400 dark:text-ink-500">Use fullscreen and silence notifications for the deepest focus.</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-8">
              <span className="text-xs font-semibold uppercase tracking-wide text-navy-500 dark:text-ink-500">
                {PHASE_LABEL[phase]}{!active && <span className="text-amber-500"> · Paused</span>}
              </span>
              <div className="relative flex items-center justify-center h-56 w-56 sm:h-64 sm:w-64">
                <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" className="text-navy-100 dark:text-white/10" />
                  <circle cx="50" cy="50" r="45" fill="none" stroke="url(#focusGradient)" strokeWidth="6" strokeLinecap="round" strokeDasharray={2 * Math.PI * 45} strokeDashoffset={2 * Math.PI * 45 * (1 - progress)} style={{ transition: 'stroke-dashoffset 1s linear' }} />
                  <defs>
                    <linearGradient id="focusGradient" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="var(--accent-from)" />
                      <stop offset="100%" stopColor="var(--accent-to)" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="text-center">
                  <span className="text-5xl font-display font-semibold tabular-nums">{minutes}:{seconds}</span>
                  {label && phase === 'work' && <p className="text-sm text-navy-500 dark:text-ink-400 mt-1">{label}</p>}
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {/* size="md" here (not the "Start focus session" screen's lg) — two side-by-side
                    buttons at lg width would need ~300px and no longer comfortably fit next to
                    each other at a 320px viewport, forcing an awkward wrap even though the row's
                    flex-wrap keeps that safe rather than an overflow. md fits both comfortably
                    from 320px up while keeping a real ~40px+ tap target. */}
                {active ? (
                  <Button size="md" variant="outline" icon={<Pause size={16} />} onClick={pause}>Pause</Button>
                ) : (
                  <Button size="md" icon={<Play size={16} />} onClick={resume}>Resume</Button>
                )}
                <Button size="md" variant="outline" icon={<Square size={16} />} onClick={stop}>End {phase === 'work' ? 'session' : 'break'}</Button>
              </div>
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card>
            <h2 className="font-semibold mb-1">Focus time</h2>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div>
                <p className="text-[11px] text-navy-500 dark:text-ink-500">Today</p>
                <p className="text-xl font-display font-semibold">{Math.floor(dailyMinutes / 60)}h {dailyMinutes % 60}m</p>
              </div>
              <div>
                <p className="text-[11px] text-navy-500 dark:text-ink-500">This week</p>
                <p className="text-xl font-display font-semibold">{Math.floor(weeklyMinutes / 60)}h {weeklyMinutes % 60}m</p>
              </div>
              <div>
                <p className="text-[11px] text-navy-500 dark:text-ink-500">All time</p>
                <p className="text-xl font-display font-semibold text-gradient-brand">{Math.floor(totalFocusMinutes / 60)}h</p>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-navy-500 dark:text-ink-400 mb-3">Recent sessions</h3>
            {sessions.length === 0 ? (
              <p className="text-sm text-navy-400 dark:text-ink-500">No sessions yet.</p>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto">
                {sessions.slice(0, 10).map((s) => (
                  <li key={s.id} className="flex items-center justify-between rounded-lg border border-navy-100 dark:border-white/10 px-3 py-2 text-sm">
                    <span className="truncate min-w-0">{s.phase === 'work' ? s.label : PHASE_LABEL[s.phase]}</span>
                    <span className="text-xs text-navy-400 shrink-0">{s.minutes}m</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <PageInfoSection
        about="Focus Mode runs work/break cycles like a Pomodoro timer, but is built around a single named task instead of a running total — you set what you're working on, choose a work and break length, and optionally play a background soundscape while the timer runs. Completed sessions are logged below so you can see how a study block actually went."
        tips={[
          'Name the task before starting a session — it keeps the block anchored to one thing instead of drifting between tasks mid-session.',
          'Shorter work phases (20\u201325 min) with full breaks tend to hold focus better than long uninterrupted stretches for most people.',
          'White noise or rain in the background can help mask a noisy room without being distracting the way music with lyrics can be.',
          'Check the session log after a study block to see how many focus cycles you actually completed versus planned.',
        ]}
        faqs={[
          { question: 'How is this different from the Pomodoro Timer?', answer: 'Pomodoro Timer tracks a running count of 25-minute work sessions with a customizable alarm. Focus Mode is task-oriented, with a named task, ambient sound, and a log of completed sessions.' },
          { question: 'Does the background sound keep playing if I switch tabs?', answer: 'Yes, as long as this tab stays open — it\u2019s generated locally in your browser and pauses if the session ends or you leave the page.' },
          { question: 'Will I get notified if a session ends while I\u2019m in another tab?', answer: 'Only if you turn on notifications in Settings, and only while this tab is still open — like the reminders in Calendar and Exam Countdown, there\u2019s no server sending a push notification, so it won\u2019t reach you after the tab or browser is closed.' },
        ]}
        related={[
          { label: 'Pomodoro Timer', href: '/productivity/pomodoro-timer' },
          { label: 'Study Planner', href: '/productivity/study-planner' },
        ]}
      />
    </ProductivityToolLayout>
  );
}
