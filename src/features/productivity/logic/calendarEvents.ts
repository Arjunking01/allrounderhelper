import { useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { Task } from './todoTypes';
import type { Assignment } from './assignmentTypes';
import type { Goal } from './goalTypes';
import type { CountdownExam } from './examCountdownTypes';
import type { DailyPlanStore } from './dailyPlannerTypes';

export type CalendarEventType = 'exam' | 'assignment' | 'task' | 'goal' | 'plan';

export interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  type: CalendarEventType;
  path: string;
  time?: string;
}

const TYPE_META: Record<CalendarEventType, { label: string; color: string; dot: string }> = {
  exam: { label: 'Exam', color: 'bg-red-500/10 text-red-500 border-red-500/20', dot: 'bg-red-500' },
  assignment: { label: 'Assignment', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', dot: 'bg-amber-500' },
  task: { label: 'Task', color: 'bg-electric-500/10 text-electric-500 border-electric-500/20', dot: 'bg-electric-500' },
  goal: { label: 'Goal', color: 'bg-violet-500/10 text-violet-500 border-violet-500/20', dot: 'bg-violet-500' },
  plan: { label: 'Planned', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', dot: 'bg-emerald-500' },
};

export function calendarEventMeta(type: CalendarEventType) {
  return TYPE_META[type];
}

function toDateKey(iso: string): string {
  return iso.slice(0, 10);
}

/**
 * Aggregates calendar-relevant items from every existing productivity data source
 * (exams, assignments, tasks, goals, daily plans) into one normalized event list.
 * Reads only — never writes — so it can't corrupt any tool's own storage.
 */
export function useCalendarEvents(): CalendarEvent[] {
  const [exams] = useLocalStorage<CountdownExam[]>('ar-exam-countdowns', []);
  const [assignments] = useLocalStorage<Assignment[]>('ar-assignments', []);
  const [tasks] = useLocalStorage<Task[]>('ar-todo-tasks', []);
  const [goals] = useLocalStorage<Goal[]>('ar-goals', []);
  const [dailyPlans] = useLocalStorage<DailyPlanStore>('ar-daily-planner', {});

  return useMemo(() => {
    const events: CalendarEvent[] = [];

    for (const e of exams) {
      if (!e.date) continue;
      events.push({ id: `exam-${e.id}`, date: toDateKey(e.date), title: e.name, type: 'exam', path: '/productivity/exam-countdown', time: e.date.length > 10 ? e.date.slice(11, 16) : undefined });
    }
    for (const a of assignments) {
      if (!a.dueDate || a.status === 'submitted') continue;
      events.push({ id: `assignment-${a.id}`, date: toDateKey(a.dueDate), title: a.title, type: 'assignment', path: '/productivity/assignment-tracker' });
    }
    for (const t of tasks) {
      if (!t.dueDate || t.completed) continue;
      events.push({ id: `task-${t.id}`, date: toDateKey(t.dueDate), title: t.title, type: 'task', path: '/productivity/todo-list' });
    }
    for (const g of goals) {
      if (!g.deadline || g.completed) continue;
      events.push({ id: `goal-${g.id}`, date: toDateKey(g.deadline), title: g.title, type: 'goal', path: '/productivity/goal-tracker' });
    }
    for (const [date, items] of Object.entries(dailyPlans)) {
      for (const item of items) {
        if (item.done) continue;
        events.push({ id: `plan-${item.id}`, date, title: item.title, type: 'plan', path: '/productivity/daily-planner', time: item.time });
      }
    }

    return events.sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? ''));
  }, [exams, assignments, tasks, goals, dailyPlans]);
}
