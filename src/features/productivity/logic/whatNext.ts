import { useMemo } from 'react';
import { usePlanMyDay, type PlanItem } from './planMyDay';
import { useDailyRoutine } from './useDailyRoutine';
import { dayAbbrevFor, routineItemsForDay, splitRoutineByTime, type RoutineItem } from './routineTypes';

/**
 * PHASE 6 — "What Next?" engine (brief section 19).
 *
 * Deliberately deterministic, not AI-driven (see brief section 37: "a deterministic daily
 * workflow is better than an unreliable AI recommendation engine"). Reuses the two existing
 * read-only aggregators — usePlanMyDay (workload) and useDailyRoutine (structure) — rather
 * than reading any raw tool storage itself, so this can never drift from what those pages
 * already show, and stays read-only itself: nothing here ever writes to a tool's data.
 *
 * Priority order (first non-empty bucket wins), matching the brief as closely as the data
 * actually available to a read-only aggregator allows:
 *  1. First overdue item (any source) — the single most urgent thing regardless of type.
 *  2. A Daily Planner block currently in its time window ("currently scheduled").
 *  3. The next study session today that hasn't started yet.
 *  4. Any other item due today (tasks, assignments, exams, goals, remaining planner blocks).
 *  5. A routine item currently in its time window.
 *  6. The next routine item later today.
 *  7. A habit not yet checked off today.
 *  8. Fallback: nothing urgent — point at planning, not at a specific item.
 */

export type NextActionKind = 'overdue' | 'scheduled' | 'study' | 'due-today' | 'routine-current' | 'routine-next' | 'habit' | 'plan';

export interface NextAction {
  kind: NextActionKind;
  title: string;
  subtitle: string;
  /** Where tapping the action itself should go (the owning tool). */
  path: string;
  /** Present only when a focus session makes sense for this action (skipped for the
   *  "nothing urgent, go plan" fallback — starting a blank focus session isn't the same
   *  action as "plan your day"). */
  focusPath?: string;
}

function toFocusPath(title: string): string {
  return `/productivity/focus-mode?task=${encodeURIComponent(title)}`;
}

function fromPlanItem(item: PlanItem, kind: NextActionKind, subtitle: string): NextAction {
  return { kind, title: item.title, subtitle, path: item.path, focusPath: toFocusPath(item.title) };
}

function fromRoutineItem(item: RoutineItem, kind: 'routine-current' | 'routine-next'): NextAction {
  const subtitle = kind === 'routine-current' ? `In progress · started ${item.time}` : `Next up at ${item.time}`;
  return { kind, title: item.title, subtitle, path: '/productivity/daily-routine', focusPath: toFocusPath(item.title) };
}

export function useWhatNext(): NextAction {
  const plan = usePlanMyDay();
  const { items: routineItems } = useDailyRoutine();

  return useMemo(() => {
    if (plan.overdue.length > 0) return fromPlanItem(plan.overdue[0], 'overdue', 'Overdue — take care of this first');

    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    // "Currently scheduled": a due-today item carrying a time that has already started, taken
    // from whichever of today's items has the latest time not after now — plan items don't
    // carry a duration, so this is "started, not necessarily still running", which is still a
    // meaningfully different signal from "scheduled later today".
    const timedDueToday = plan.dueToday.filter((i) => i.time).sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''));
    const currentTimeLabel = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const currentlyScheduled = [...timedDueToday].reverse().find((i) => (i.time ?? '') <= currentTimeLabel);
    if (currentlyScheduled) return fromPlanItem(currentlyScheduled, 'scheduled', `Scheduled for ${currentlyScheduled.time}`);

    const nextStudy = plan.studyToday.find((i) => (i.time ?? '') >= currentTimeLabel) ?? plan.studyToday[0];
    if (nextStudy) return fromPlanItem(nextStudy, 'study', nextStudy.time ? `Study session at ${nextStudy.time}` : 'Study session today');

    if (plan.dueToday.length > 0) return fromPlanItem(plan.dueToday[0], 'due-today', 'Due today');

    const day = dayAbbrevFor(now);
    const todayRoutine = routineItemsForDay(routineItems, day);
    const { current, next } = splitRoutineByTime(todayRoutine, nowMinutes);
    if (current.length > 0) return fromRoutineItem(current[0], 'routine-current');
    if (next) return fromRoutineItem(next, 'routine-next');

    if (plan.habitsToday.length > 0) return fromPlanItem(plan.habitsToday[0], 'habit', 'Habit not yet checked off today');

    return {
      kind: 'plan',
      title: "You're clear for now",
      subtitle: 'Nothing urgent — plan today or build your routine.',
      path: '/productivity/plan-my-day',
    };
  }, [plan, routineItems]);
}
