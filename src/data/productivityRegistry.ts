import {
  CheckSquare, StickyNote, CalendarRange, Timer as TimerIcon,
  Target, Flame, Hourglass, CalendarDays,
  FileCheck2, Focus, Grid2x2, Calendar as CalendarIcon,
  Sparkles, Repeat,
  type LucideIcon,
} from 'lucide-react';

export interface ProductivityToolMeta {
  slug: string;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  /** Reserved for the future educational guide (blog integration). Left undefined until content ships. */
  guideSlug?: string;
}

export const productivityTools: ProductivityToolMeta[] = [
  {
    slug: 'plan-my-day',
    name: 'Plan My Day',
    shortName: 'Plan My Day',
    tagline: 'Everything overdue, due today, or scheduled today — in one place.',
    description: 'Pulls together what\u2019s overdue and due today from To-Do, Assignment Tracker, Exam Countdown, Goal Tracker, and Daily Planner, plus today\u2019s unchecked habits and today\u2019s Study Planner or Weekly Planner items, into one answer to "what should I do today?".',
    icon: Sparkles,
  },
  {
    slug: 'daily-routine',
    name: 'Daily Routine',
    shortName: 'Daily Routine',
    tagline: 'Your repeatable day structure \u2014 recurring blocks, not one-off tasks.',
    description: 'Set up recurring daily blocks (morning review, study blocks, wind-down) on the weekdays they happen, and see what\u2019s current, next, and later today at a glance.',
    icon: Repeat,
  },
  {
    slug: 'todo-list',
    name: 'To-Do List',
    shortName: 'To-Do List',
    tagline: 'Track tasks with due dates, priorities, and categories.',
    description: 'A fast to-do list with due dates, priority levels, categories, search, and filters — saved automatically to your device.',
    icon: CheckSquare,
  },
  {
    slug: 'notes',
    name: 'Notes',
    shortName: 'Notes',
    tagline: 'Quick markdown notes that save as you type.',
    description: 'Create, search, and pin markdown notes with categories. Auto-saves locally so nothing is ever lost.',
    icon: StickyNote,
  },
  {
    slug: 'study-planner',
    name: 'Study Planner',
    shortName: 'Study Planner',
    tagline: 'Plan subjects, weekly sessions, and exam prep.',
    description: 'Organize subjects, build a weekly study schedule, plan for exams, and track progress toward study goals.',
    icon: CalendarRange,
  },
  {
    slug: 'pomodoro-timer',
    name: 'Pomodoro Timer',
    shortName: 'Pomodoro Timer',
    tagline: 'Focused work sessions with a 25/5 rhythm.',
    description: 'A customizable Pomodoro timer with session tracking, daily statistics, and sound notifications.',
    icon: TimerIcon,
  },
  {
    slug: 'goal-tracker',
    name: 'Goal Tracker',
    shortName: 'Goal Tracker',
    tagline: 'Track short and long-term goals to completion.',
    description: 'Set short-term and long-term goals with deadlines, categories, and progress tracking.',
    icon: Target,
  },
  {
    slug: 'habit-tracker',
    name: 'Habit Tracker',
    shortName: 'Habit Tracker',
    tagline: 'Build streaks with a daily and monthly view.',
    description: 'Track daily habits with a weekly checklist, monthly streak view, and completion history.',
    icon: Flame,
  },
  {
    slug: 'exam-countdown',
    name: 'Exam Countdown',
    shortName: 'Exam Countdown',
    tagline: 'Live countdowns for every upcoming exam.',
    description: 'Track multiple exams with live countdowns, priority levels, and optional browser notifications.',
    icon: Hourglass,
  },
  {
    slug: 'weekly-planner',
    name: 'Weekly Planner',
    shortName: 'Weekly Planner',
    tagline: 'Plan your Monday-to-Sunday week at a glance.',
    description: 'A Monday-to-Sunday planner for tasks and subjects with color labels, auto-saved locally.',
    icon: CalendarDays,
  },
  {
    slug: 'daily-planner',
    name: 'Daily Planner',
    shortName: 'Daily Planner',
    tagline: 'Time-block a single day, hour by hour.',
    description: 'Plan a single day with time-blocked items, browse forward or back by date, and track daily completion.',
    icon: CalendarDays,
  },
  {
    slug: 'semester-planner',
    name: 'Semester Planner',
    shortName: 'Semester Planner',
    tagline: 'Break a whole semester into a week-by-week plan.',
    description: 'Set your semester start and end dates, auto-generate a week-by-week plan, and track a weekly focus for each one.',
    icon: CalendarRange,
  },
  {
    slug: 'assignment-tracker',
    name: 'Assignment Tracker',
    shortName: 'Assignment Tracker',
    tagline: 'Track every assignment from start to submission.',
    description: 'Track assignments by subject and due date with a not-started/in-progress/submitted status, search, and sorting.',
    icon: FileCheck2,
  },
  {
    slug: 'focus-mode',
    name: 'Focus Mode',
    shortName: 'Focus Mode',
    tagline: 'A distraction-free timer for deep work sessions.',
    description: 'Run a distraction-free focus session with a custom duration, and keep a running log of total focus time.',
    icon: Focus,
  },
  {
    slug: 'priority-matrix',
    name: 'Priority Matrix',
    shortName: 'Priority Matrix',
    tagline: 'Sort tasks by urgency and importance (Eisenhower matrix).',
    description: 'Organize tasks into a four-quadrant urgent/important priority matrix to decide what to do, schedule, delegate, or drop.',
    icon: Grid2x2,
  },
  {
    slug: 'calendar',
    name: 'Calendar',
    shortName: 'Calendar',
    tagline: 'See every exam, assignment, task, and goal in one place.',
    description: 'A month, week, day, and agenda calendar that automatically pulls in your exams, assignments, tasks, goals, and daily plan items.',
    icon: CalendarIcon,
  },
];

export function getProductivityToolBySlug(slug: string): ProductivityToolMeta | undefined {
  return productivityTools.find((t) => t.slug === slug);
}
