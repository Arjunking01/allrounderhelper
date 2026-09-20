import { useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useCalendarEvents, calendarEventMeta, type CalendarEvent } from './calendarEvents';
import { todayKey } from './dailyPlannerTypes';
import type { Habit } from './habitTypes';
import type { Subject, StudySession } from './studyPlannerTypes';
import { DAYS } from './studyPlannerTypes';
import type { WeeklyItem } from './weeklyPlannerTypes';

/**
 * PHASE 3 — "Plan My Day".
 *
 * Every productivity tool on this site (Todo, Calendar, Study Planner, Daily Planner,
 * Habit Tracker, Goal Tracker) already stores its own data independently in localStorage,
 * and `useCalendarEvents` (features/ai's sibling, written in an earlier phase) already
 * aggregates the deadline-shaped ones (exams, assignments, tasks, goals, daily-plan items)
 * read-only into one normalized list. This hook is the smallest correct extension of that
 * into an actual answer to "what should I do today": it adds the two data sources
 * `useCalendarEvents` deliberately doesn't cover (recurring habits, which have no due date
 * to sort by; today's scheduled study sessions, which live on a weekday grid, not a calendar
 * date; and today's Weekly Planner items, which live on the same kind of weekday grid) and
 * buckets everything by urgency instead of leaving it as one flat list.
 *
 * Deliberately NOT included: Semester Planner. Its data (`SemesterWeek.weekNumber` + a
 * plan-wide start/end date, see semesterPlannerTypes.ts) has no per-day granularity and no
 * reliable "which week is today" calculation already exists anywhere else in this app to
 * reuse — inventing one here risks a subtly wrong "current week" on an edge day (the exact
 * kind of guess this app's own conventions (see generationEngine.ts's honest-degradation
 * comments in the AI feature) avoid. A semester-level overview also isn't a "what do I do
 * today" item the way a due-today task or a today-scheduled session is.
 *
 * Read-only, like `useCalendarEvents` — writes still only ever happen from each tool's own
 * page. This hook must never become a second source of truth for any of this data.
 */

export interface PlanItem {
  id: string;
  title: string;
  path: string;
  time?: string;
  /** Human label for the source tool, shown as a small tag (e.g. "Exam", "Habit"). */
  sourceLabel: string;
  sourceDot: string; // Tailwind bg-* class, reuses calendarEventMeta's dot colors where applicable
}

export interface PlanMyDay {
  overdue: PlanItem[];
  dueToday: PlanItem[];
  habitsToday: PlanItem[];
  studyToday: PlanItem[];
  weeklyToday: PlanItem[];
  totalCount: number;
  allCaughtUp: boolean;
}

function toPlanItem(e: CalendarEvent): PlanItem {
  const meta = calendarEventMeta(e.type);
  return { id: e.id, title: e.title, path: e.path, time: e.time, sourceLabel: meta.label, sourceDot: meta.dot };
}

/** Today's weekday as the 'Mon'..'Sun' key StudySession.day uses (see studyPlannerTypes.ts). */
function todayDayAbbrev(): (typeof DAYS)[number] {
  // JS getDay(): 0=Sun..6=Sat. DAYS is Mon-first, so shift by one and wrap Sunday to index 6.
  const jsDay = new Date().getDay();
  return DAYS[(jsDay + 6) % 7];
}

export function usePlanMyDay(): PlanMyDay {
  const events = useCalendarEvents();
  const [habits] = useLocalStorage<Habit[]>('ar-habits', []);
  const [subjects] = useLocalStorage<Subject[]>('ar-study-subjects', []);
  const [sessions] = useLocalStorage<StudySession[]>('ar-study-sessions', []);
  const [weeklyItems] = useLocalStorage<WeeklyItem[]>('ar-weekly-planner', []);

  return useMemo(() => {
    const today = todayKey();

    const overdue = events.filter((e) => e.date < today).map(toPlanItem);
    const dueToday = events.filter((e) => e.date === today).map(toPlanItem);

    const habitsToday: PlanItem[] = habits
      .filter((h) => !h.completions[today])
      .map((h) => ({ id: `habit-${h.id}`, title: h.name, path: '/productivity/habit-tracker', sourceLabel: 'Habit', sourceDot: 'bg-emerald-500' }));

    const dayAbbrev = todayDayAbbrev();
    const subjectById = new Map(subjects.map((s) => [s.id, s]));
    const studyToday: PlanItem[] = sessions
      .filter((s) => s.day === dayAbbrev)
      .map((s) => ({
        id: `study-${s.id}`,
        title: subjectById.get(s.subjectId)?.name ?? 'Study session',
        path: '/productivity/study-planner',
        time: s.startTime,
        sourceLabel: 'Study session',
        sourceDot: 'bg-violet-500',
      }))
      .sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''));

    // WeeklyItem has no per-item "done" state (see weeklyPlannerTypes.ts) — it's a recurring
    // weekly schedule board (subjects/tasks pinned to a weekday), not a per-day checklist, so
    // unlike habits/study sessions there is nothing to mark complete and nothing to filter out.
    const weeklyToday: PlanItem[] = weeklyItems
      .filter((w) => w.day === dayAbbrev)
      .map((w) => ({
        id: `weekly-${w.id}`,
        title: w.title,
        path: '/productivity/weekly-planner',
        sourceLabel: w.label === 'subject' ? 'Weekly subject' : 'Weekly task',
        sourceDot: 'bg-cyan-500',
      }));

    const totalCount = overdue.length + dueToday.length + habitsToday.length + studyToday.length + weeklyToday.length;

    return { overdue, dueToday, habitsToday, studyToday, weeklyToday, totalCount, allCaughtUp: totalCount === 0 };
  }, [events, habits, subjects, sessions, weeklyItems]);
}
