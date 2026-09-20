export type SubjectPriority = 'low' | 'medium' | 'high';

export interface Subject {
  id: string;
  name: string;
  color: string;
  progress: number; // 0-100, manually tracked
  priority: SubjectPriority;
}

export const PRIORITY_META: Record<SubjectPriority, { label: string; className: string }> = {
  high: { label: 'High priority', className: 'bg-red-500/10 text-red-500' },
  medium: { label: 'Medium priority', className: 'bg-amber-500/10 text-amber-500' },
  low: { label: 'Low priority', className: 'bg-navy-100 text-navy-500 dark:bg-white/10 dark:text-ink-400' },
};

export interface StudySession {
  id: string;
  subjectId: string;
  day: string; // 'Mon'..'Sun'
  startTime: string;
  endTime: string;
}

export interface ExamPlan {
  id: string;
  subjectId: string;
  date: string;
  notes?: string;
}

export interface StudyGoal {
  id: string;
  text: string;
  done: boolean;
}

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const SUBJECT_COLORS = ['#3b6dfb', '#8b3ffb', '#17cf8f', '#fb923c', '#f43f5e', '#06b6d4'];
