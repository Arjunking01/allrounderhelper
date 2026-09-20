export type GoalType = 'short-term' | 'long-term';

export interface Goal {
  id: string;
  title: string;
  category: string;
  type: GoalType;
  progress: number; // 0-100
  deadline?: string;
  completed: boolean;
  createdAt: string;
}

export const GOAL_CATEGORIES = ['Academic', 'Career', 'Health', 'Personal', 'Financial'];
