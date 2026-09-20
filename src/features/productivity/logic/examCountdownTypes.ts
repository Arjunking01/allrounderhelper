export type ExamPriority = 'low' | 'medium' | 'high';

export interface CountdownExam {
  id: string;
  name: string;
  subject: string;
  date: string; // ISO datetime
  priority: ExamPriority;
}

export function daysRemaining(dateIso: string): number {
  const diff = new Date(dateIso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
