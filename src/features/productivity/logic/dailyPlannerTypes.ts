export interface DailyPlanItem {
  id: string;
  time: string;
  title: string;
  done: boolean;
}

export type DailyPlanStore = Record<string, DailyPlanItem[]>;

export function todayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
