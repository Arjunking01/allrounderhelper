import { Flame, CheckSquare, Target, Timer, StickyNote, Trophy, type LucideIcon } from 'lucide-react';

export interface Achievement {
  id: string;
  label: string;
  icon: LucideIcon;
  earned: boolean;
  progressLabel: string;
}

export interface AchievementInputs {
  completedTasks: number;
  bestHabitStreak: number;
  totalFocusMinutes: number;
  notesCount: number;
  completedGoals: number;
}

/** Pure function: same inputs always produce the same badges. No fabricated/random state. */
export function computeAchievements(inputs: AchievementInputs): Achievement[] {
  return [
    {
      id: 'first-steps',
      label: 'First Steps',
      icon: CheckSquare,
      earned: inputs.completedTasks >= 1,
      progressLabel: inputs.completedTasks >= 1 ? 'Completed your first task' : 'Complete a task to unlock',
    },
    {
      id: 'task-master',
      label: 'Task Master',
      icon: Trophy,
      earned: inputs.completedTasks >= 25,
      progressLabel: `${Math.min(inputs.completedTasks, 25)}/25 tasks completed`,
    },
    {
      id: 'on-fire',
      label: 'On Fire',
      icon: Flame,
      earned: inputs.bestHabitStreak >= 7,
      progressLabel: `${Math.min(inputs.bestHabitStreak, 7)}/7 day habit streak`,
    },
    {
      id: 'deep-focus',
      label: 'Deep Focus',
      icon: Timer,
      earned: inputs.totalFocusMinutes >= 300,
      progressLabel: `${Math.min(inputs.totalFocusMinutes, 300)}/300 focus minutes`,
    },
    {
      id: 'note-taker',
      label: 'Note Taker',
      icon: StickyNote,
      earned: inputs.notesCount >= 10,
      progressLabel: `${Math.min(inputs.notesCount, 10)}/10 notes saved`,
    },
    {
      id: 'goal-getter',
      label: 'Goal Getter',
      icon: Target,
      earned: inputs.completedGoals >= 3,
      progressLabel: `${Math.min(inputs.completedGoals, 3)}/3 goals completed`,
    },
  ];
}
