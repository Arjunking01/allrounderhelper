export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  notes?: string;
  category: string;
  priority: TaskPriority;
  dueDate?: string; // ISO date
  completed: boolean;
  createdAt: string;
}

export const DEFAULT_CATEGORIES = ['General', 'Assignments', 'Exams', 'Personal'];
