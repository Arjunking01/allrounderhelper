export interface Habit {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  /** Map of 'YYYY-MM-DD' -> completed */
  completions: Record<string, boolean>;
}

export const HABIT_COLORS = ['#3b6dfb', '#8b3ffb', '#17cf8f', '#fb923c', '#f43f5e'];

export function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function currentStreak(habit: Habit): number {
  let streak = 0;
  const cursor = new Date();
  while (habit.completions[dateKey(cursor)]) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Longest run of consecutive completed days across the habit's full history. */
export function bestStreak(habit: Habit): number {
  const doneDates = Object.keys(habit.completions)
    .filter((k) => habit.completions[k])
    .sort();
  if (doneDates.length === 0) return 0;

  let best = 1;
  let run = 1;
  for (let i = 1; i < doneDates.length; i++) {
    const prev = new Date(doneDates[i - 1] + 'T00:00:00');
    const curr = new Date(doneDates[i] + 'T00:00:00');
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
    run = diffDays === 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }
  return best;
}

/** Percentage of the last N days (including today) that were completed. */
export function completionRate(habit: Habit, days: number): number {
  let done = 0;
  const cursor = new Date();
  for (let i = 0; i < days; i++) {
    if (habit.completions[dateKey(cursor)]) done += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return Math.round((done / days) * 100);
}

/** Whether yesterday was missed while the habit was already active (i.e. streak broken). */
export function missedYesterday(habit: Habit): boolean {
  if (Object.keys(habit.completions).length === 0) return false;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const key = dateKey(yesterday);
  const createdKey = dateKey(new Date(habit.createdAt));
  return key >= createdKey && !habit.completions[key] && !habit.completions[dateKey(new Date())];
}
