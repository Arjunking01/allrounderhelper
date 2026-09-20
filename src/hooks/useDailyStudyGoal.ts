import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { FocusSession } from '@/features/productivity/logic/focusModeTypes';

export const DEFAULT_DAILY_GOAL_MINUTES = 60;
const MIN_GOAL_MINUTES = 5;
const MAX_GOAL_MINUTES = 600;
const DEFAULT_POMODORO_WORK_MINUTES = 25;

function todayKey(d: Date = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Daily study goal: a user-set target (in minutes) for "focused study time today",
 * checked against real data already recorded by Focus Mode and the Pomodoro Timer —
 * no new tracking mechanism, no fabricated activity.
 *
 * Focus Mode logs actual minutes per completed work session (`ar-focus-sessions`).
 * The Pomodoro Timer only logs a completed-session *count* per day (`ar-pomodoro-stats`),
 * so those sessions are converted to minutes using the user's own configured work-session
 * length (`ar-pomodoro-settings`), falling back to the classic 25-minute default if the
 * Pomodoro Timer has never been opened.
 */
export function useDailyStudyGoal() {
  const [goalMinutes, setGoalMinutesRaw] = useLocalStorage<number>('ar-daily-goal-minutes', DEFAULT_DAILY_GOAL_MINUTES);
  const [focusSessions] = useLocalStorage<FocusSession[]>('ar-focus-sessions', []);
  const [pomodoroStats] = useLocalStorage<Record<string, number>>('ar-pomodoro-stats', {});
  const [pomodoroSettings] = useLocalStorage<{ workMinutes: number }>('ar-pomodoro-settings', { workMinutes: DEFAULT_POMODORO_WORK_MINUTES });

  const today = todayKey();

  const focusMinutesToday = focusSessions
    .filter((s) => s.phase === 'work' && todayKey(new Date(s.completedAt)) === today)
    .reduce((sum, s) => sum + s.minutes, 0);

  const pomodoroSessionsToday = pomodoroStats[today] ?? 0;
  const pomodoroMinutesToday = pomodoroSessionsToday * (pomodoroSettings.workMinutes || DEFAULT_POMODORO_WORK_MINUTES);

  const todayMinutes = focusMinutesToday + pomodoroMinutesToday;
  const percent = goalMinutes > 0 ? Math.min(100, Math.round((todayMinutes / goalMinutes) * 100)) : 0;
  const achieved = goalMinutes > 0 && todayMinutes >= goalMinutes;
  const remainingMinutes = Math.max(0, goalMinutes - todayMinutes);

  function setGoalMinutes(rawMinutes: number) {
    if (!Number.isFinite(rawMinutes)) return;
    const clamped = Math.max(MIN_GOAL_MINUTES, Math.min(MAX_GOAL_MINUTES, Math.round(rawMinutes)));
    setGoalMinutesRaw(clamped);
  }

  return { goalMinutes, todayMinutes, percent, achieved, remainingMinutes, setGoalMinutes };
}
