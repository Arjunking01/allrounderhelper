import { useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { FocusSession } from '@/features/productivity/logic/focusModeTypes';
import type { Habit } from '@/features/productivity/logic/habitTypes';
import { dateKey } from '@/features/productivity/logic/habitTypes';

export interface DayActivity {
  date: string;
  focusMinutes: number;
  pomodoroSessions: number;
  habitsCompleted: number;
  score: number; // 0-100, this day's contribution
}

function last35Dates(): string[] {
  return Array.from({ length: 35 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (34 - i));
    return dateKey(d);
  });
}

/**
 * Derives cross-tool productivity insights (streak, heatmap, score) purely by reading
 * existing localStorage sources — focus sessions, Pomodoro stats, and habit completions.
 * Read-only: never writes, so it can't corrupt any tool's own data.
 */
export function useProductivityInsights() {
  const [focusSessions] = useLocalStorage<FocusSession[]>('ar-focus-sessions', []);
  const [pomodoroStats] = useLocalStorage<Record<string, number>>('ar-pomodoro-stats', {});
  const [habits] = useLocalStorage<Habit[]>('ar-habits', []);

  return useMemo(() => {
    const dates = last35Dates();

    const activity: DayActivity[] = dates.map((date) => {
      const focusMinutes = focusSessions.filter((s) => s.phase === 'work' && dateKey(new Date(s.completedAt)) === date).reduce((sum, s) => sum + s.minutes, 0);
      const pomodoroSessions = pomodoroStats[date] ?? 0;
      const habitsCompleted = habits.filter((h) => h.completions[date]).length;
      const score = Math.min(100, Math.round(focusMinutes / 60 * 40 + pomodoroSessions * 10 + habitsCompleted * 8));
      return { date, focusMinutes, pomodoroSessions, habitsCompleted, score };
    });

    // Consecutive-day streak counting back from today (a day counts as "active" if it has any recorded activity).
    let streak = 0;
    for (let i = activity.length - 1; i >= 0; i--) {
      const day = activity[i];
      const isToday = day.date === dateKey(new Date());
      const hasActivity = day.focusMinutes > 0 || day.pomodoroSessions > 0 || day.habitsCompleted > 0;
      if (hasActivity) streak++;
      else if (!isToday) break;
      // if today has no activity yet, don't break the streak — the day isn't over
      else continue;
    }

    const todayScore = activity[activity.length - 1]?.score ?? 0;
    const weekActivity = activity.slice(-7);
    const weekScore = Math.round(weekActivity.reduce((sum, d) => sum + d.score, 0) / 7);

    return { activity, streak, todayScore, weekScore };
  }, [focusSessions, pomodoroStats, habits]);
}
