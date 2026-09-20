export interface SemesterWeek {
  id: string;
  weekNumber: number;
  focus: string;
  completed: boolean;
}

export interface SemesterPlan {
  startDate: string;
  endDate: string;
  weeks: SemesterWeek[];
}

export function weeksBetween(startIso: string, endIso: string): number {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (isNaN(start) || isNaN(end) || end <= start) return 0;
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24 * 7));
}
