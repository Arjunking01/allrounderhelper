import { useEffect, useRef, useState } from 'react';
import { Timer as TimerIcon, Play, Pause, RotateCcw, Settings } from 'lucide-react';
import { ProductivityToolLayout } from '@/components/ProductivityToolLayout';
import { Card, SoftCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { getProductivityToolBySlug } from '@/data/productivityRegistry';
import { ALARM_SOUNDS, playAlarmSound, primeAlarmAudio } from '../logic/pomodoroSound';
import type { ToolArticleContent } from '@/components/ToolArticle';

const tool = getProductivityToolBySlug('pomodoro-timer')!;

const article: ToolArticleContent = {
  intro:
    'The Pomodoro Technique breaks work into short, timed sessions separated by regular breaks. This timer runs the classic 25-minute focus / 5-minute break rhythm in your browser, tracks how many sessions you complete each day, and saves everything locally on your device — no account, no server.',
  whyItMatters:
    'Long, unstructured study or work blocks make it easy to lose focus or burn out without noticing. Splitting time into short, bounded sessions gives you a clear finish line, makes starting less intimidating, and forces regular breaks that actually help concentration hold up over a longer day.',
  howItWorks: [
    'Set your work and break lengths (defaults are 25 and 5 minutes, adjustable from 1–180 and 1–60 minutes).',
    'Press Start. The timer counts down while you focus on a single task.',
    'When the work session ends, an alarm plays (if enabled) and the timer automatically switches to a break.',
    'After the break, it switches back to a work session — repeat as many times as you need.',
    'Each completed work session is logged to that day\u2019s count, and the last 7 days are shown as a bar chart.',
  ],
  examples: [
    {
      title: 'Studying for an exam',
      body: 'Run four 25-minute sessions on one subject with 5-minute breaks between them, then take a longer break before switching subjects.',
    },
    {
      title: 'Writing an assignment',
      body: 'Set work sessions to 40–50 minutes for deep writing tasks, with a 10-minute break to reset your focus before editing.',
    },
  ],
  mistakes: [
    'Setting work sessions too long at first — if 25 minutes already feels hard to sit through, start shorter rather than longer.',
    'Skipping breaks to "keep momentum" — the break is what makes the next session effective, not a waste of time.',
    'Multitasking during a work session — the technique only helps if each session is spent on one task.',
  ],
  tips: [
    'Keep work sessions between 20–50 minutes; much longer and the benefit of a bounded session disappears.',
    'Use the daily stats chart to notice patterns — for example, whether you complete more sessions earlier or later in the day.',
    'Turn sound off and rely on the visual progress ring if you\u2019re in a shared space like a library.',
  ],
  faqs: [
    {
      question: 'Is my timer data saved anywhere online?',
      answer: 'No. Settings and session history are stored only in your browser\u2019s local storage on this device.',
    },
    {
      question: 'What happens if I close the tab mid-session?',
      answer: 'The timer stops running since it\u2019s tab-based, but your saved settings and past session counts remain intact for next time.',
    },
    {
      question: 'Can I change the 25/5 ratio?',
      answer: 'Yes — work length (1–180 minutes) and break length (1–60 minutes) are both fully adjustable in Settings.',
    },
  ],
  related: [
    { label: 'Study Planner', href: '/productivity/study-planner' },
    { label: 'Habit Tracker', href: '/productivity/habit-tracker' },
    { label: 'Daily Planner', href: '/productivity/daily-planner' },
  ],
};

type Mode = 'work' | 'break';

interface PomodoroSettings {
  workMinutes: number;
  breakMinutes: number;
  soundEnabled: boolean;
  alarmSound: string;
  volume: number;
}

function localDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todayKey() {
  return localDateKey(new Date());
}

export default function PomodoroTimerPage() {
  const [settings, setSettings] = useLocalStorage<PomodoroSettings>('ar-pomodoro-settings', {
    workMinutes: 25,
    breakMinutes: 5,
    soundEnabled: true,
    alarmSound: 'classic-beep',
    volume: 0.5,
  });
  const alarmSound = settings.alarmSound ?? 'classic-beep';
  const volume = settings.volume ?? 0.5;
  // Local string mirrors for the duration inputs — lets the user clear the field and type a new
  // number naturally without every keystroke snapping back to 1 while the field is momentarily empty.
  const [workInput, setWorkInput] = useState(String(settings.workMinutes));
  const [breakInput, setBreakInput] = useState(String(settings.breakMinutes));
  const [dailyStats, setDailyStats] = useLocalStorage<Record<string, number>>('ar-pomodoro-stats', {});
  const [mode, setMode] = useState<Mode>('work');
  const [secondsLeft, setSecondsLeft] = useState(settings.workMinutes * 60);
  const [running, setRunning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Wall-clock timestamp the current countdown should hit zero at. Recomputing secondsLeft from
  // this on every tick (and on tab-visibility change) keeps the timer accurate even if setInterval
  // ticks are throttled or paused entirely, e.g. a backgrounded mobile tab — a plain per-tick
  // decrement would otherwise silently lose time and never catch back up.
  const targetEndRef = useRef<number | null>(null);
  // Mirrors the latest mode/settings/alarmSound/volume on every render (same pattern already
  // used by FocusModePage's `latestRef`). The ticking effect below only re-subscribes when
  // `running` changes, so `handleSessionComplete`'s own closure over `settings`/`alarmSound`/
  // `volume`/`mode` would otherwise be frozen at whatever they were when the current session
  // started — meaning toggling "Sound notifications" off, changing the alarm sound, or
  // adjusting volume mid-session (none of which go through `applySettings`, so none of them
  // stop/reset the timer) silently had no effect on the alarm that fires when THIS session
  // ends. Reading through this ref instead makes the completion always use the current values.
  const latestRef = useRef({ mode, settings, alarmSound, volume });
  latestRef.current = { mode, settings, alarmSound, volume };
  // Guards against handleSessionComplete() running twice for the same deadline: when a backgrounded tab
  // becomes visible again, the visibilitychange-triggered tick and a (throttled) 1s interval tick can both
  // observe remaining <= 0 before the effect below is torn down by setRunning(false), which would play the
  // alarm twice and double-count the finished session. Same pattern FocusModePage's firedRef already uses.
  const firedRef = useRef(false);

  useEffect(() => {
    if (!running) {
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
        handleSessionComplete();
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
  }, [running]);

  function handleSessionComplete() {
    const { mode: currentMode, settings: currentSettings, alarmSound: currentAlarmSound, volume: currentVolume } = latestRef.current;
    if (currentSettings.soundEnabled) playAlarmSound(currentAlarmSound, currentVolume);
    if (currentMode === 'work') {
      setDailyStats((prev) => ({ ...prev, [todayKey()]: (prev[todayKey()] ?? 0) + 1 }));
      setMode('break');
      setSecondsLeft(currentSettings.breakMinutes * 60);
    } else {
      setMode('work');
      setSecondsLeft(currentSettings.workMinutes * 60);
    }
    setRunning(false);
  }

  function reset() {
    setRunning(false);
    setMode('work');
    setSecondsLeft(settings.workMinutes * 60);
  }

  function commitWorkMinutes(raw: string) {
    const n = Math.max(1, Math.min(180, parseInt(raw, 10) || settings.workMinutes));
    setWorkInput(String(n));
    if (n !== settings.workMinutes) applySettings({ ...settings, workMinutes: n });
  }

  function commitBreakMinutes(raw: string) {
    const n = Math.max(1, Math.min(60, parseInt(raw, 10) || settings.breakMinutes));
    setBreakInput(String(n));
    if (n !== settings.breakMinutes) applySettings({ ...settings, breakMinutes: n });
  }

  function applySettings(next: PomodoroSettings) {
    setSettings(next);
    setRunning(false);
    setMode('work');
    setSecondsLeft(next.workMinutes * 60);
  }

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const seconds = String(secondsLeft % 60).padStart(2, '0');
  const total = (mode === 'work' ? settings.workMinutes : settings.breakMinutes) * 60;
  const progress = total > 0 ? 1 - secondsLeft / total : 0;
  const todaySessions = dailyStats[todayKey()] ?? 0;

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = localDateKey(d);
    return { key, label: d.toLocaleDateString(undefined, { weekday: 'short' }), count: dailyStats[key] ?? 0 };
  });
  const maxCount = Math.max(1, ...last7Days.map((d) => d.count));

  return (
    <ProductivityToolLayout
      toolName={tool.name}
      tagline={tool.tagline}
      description={tool.description}
      path="/productivity/pomodoro-timer"
      icon={TimerIcon}
      breadcrumb={{ label: 'Pomodoro Timer' }}
      article={article}
      headerActions={
        <Button variant="outline" size="sm" icon={<Settings size={14} />} onClick={() => setShowSettings((v) => !v)}>
          Settings
        </Button>
      }
    >
      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <Card className="flex flex-col items-center justify-center py-14">
          <span className="text-xs font-semibold uppercase tracking-wide text-navy-500 dark:text-ink-500 mb-4">
            {mode === 'work' ? 'Focus session' : 'Break time'}
          </span>

          <div className="relative flex items-center justify-center h-56 w-56 sm:h-64 sm:w-64">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" className="text-navy-100 dark:text-white/10" />
              <circle
                cx="50" cy="50" r="45" fill="none" stroke="url(#pomodoroGradient)" strokeWidth="6" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 45}
                strokeDashoffset={2 * Math.PI * 45 * (1 - progress)}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
              <defs>
                <linearGradient id="pomodoroGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#3b6dfb" />
                  <stop offset="100%" stopColor="#8b3ffb" />
                </linearGradient>
              </defs>
            </svg>
            <span className="text-5xl font-display font-semibold tabular-nums">{minutes}:{seconds}</span>
          </div>

          {showSettings ? (
            <SoftCard className="mt-8 w-full max-w-sm">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <label className="text-sm">
                  Work (min)
                  <input
                    type="number" min={1} max={180} value={workInput}
                    onChange={(e) => setWorkInput(e.target.value)}
                    onBlur={(e) => commitWorkMinutes(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                    className="mt-1 w-full rounded-lg border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-3 py-2 outline-none focus:border-electric-500"
                  />
                </label>
                <label className="text-sm">
                  Break (min)
                  <input
                    type="number" min={1} max={60} value={breakInput}
                    onChange={(e) => setBreakInput(e.target.value)}
                    onBlur={(e) => commitBreakMinutes(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                    className="mt-1 w-full rounded-lg border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-3 py-2 outline-none focus:border-electric-500"
                  />
                </label>
              </div>
              <label className="flex items-center gap-2 text-sm mb-3">
                <input type="checkbox" checked={settings.soundEnabled} onChange={(e) => setSettings({ ...settings, soundEnabled: e.target.checked })} className="accent-electric-500" />
                Sound notifications
              </label>

              <label className="block text-sm mb-3">
                Alarm sound
                <div className="mt-1 flex gap-2">
                  <select
                    value={alarmSound}
                    disabled={!settings.soundEnabled}
                    onChange={(e) => setSettings({ ...settings, alarmSound: e.target.value })}
                    className="flex-1 rounded-lg border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-3 py-2 outline-none focus:border-electric-500 disabled:opacity-50"
                  >
                    {ALARM_SOUNDS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!settings.soundEnabled}
                    onClick={() => playAlarmSound(alarmSound, volume)}
                  >
                    Preview
                  </Button>
                </div>
              </label>

              <label className="block text-sm mb-1">
                Volume
                <div className="mt-1 flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={volume}
                    disabled={!settings.soundEnabled}
                    onChange={(e) => setSettings({ ...settings, volume: Number(e.target.value) })}
                    className="flex-1 accent-electric-500 disabled:opacity-50"
                  />
                  <span className="text-xs text-navy-500 dark:text-ink-500 w-9 text-right">{Math.round(volume * 100)}%</span>
                </div>
              </label>

              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full"
                disabled={!settings.soundEnabled}
                onClick={() => playAlarmSound(alarmSound, volume)}
              >
                Test sound
              </Button>
            </SoftCard>
          ) : (
            <div className="flex items-center gap-3 mt-8">
              <Button
                size="lg" icon={running ? <Pause size={18} /> : <Play size={18} />}
                onClick={() => {
                  // Unlock audio from this real click before the alarm is ever fired from a
                  // setInterval callback — see pomodoroSound.ts's primeAlarmAudio doc comment.
                  // Without this, a browser can create the shared AudioContext suspended on
                  // the very first timer-driven completion (not a user gesture) and refuse to
                  // resume it, silently dropping the very first session's alarm. Mirrors the
                  // same fix already applied to Focus Mode's Start/Resume handlers.
                  primeAlarmAudio();
                  setRunning((v) => !v);
                }}
              >
                {running ? 'Pause' : 'Start'}
              </Button>
              <Button size="lg" variant="outline" icon={<RotateCcw size={18} />} onClick={reset}>Reset</Button>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="font-semibold mb-1">Today</h2>
          <p className="text-3xl font-display font-semibold text-gradient-brand mb-6">{todaySessions} session{todaySessions !== 1 ? 's' : ''}</p>

          <h3 className="text-sm font-semibold text-navy-500 dark:text-ink-400 mb-3">Last 7 days</h3>
          <div className="flex items-end gap-2 h-28">
            {last7Days.map((d) => (
              <div key={d.key} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="w-full rounded-t-md gradient-brand" style={{ height: `${Math.max(4, (d.count / maxCount) * 100)}%` }} />
                <span className="text-[10px] text-navy-400 dark:text-ink-500">{d.label}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </ProductivityToolLayout>
  );
}
