import { DAYS } from './studyPlannerTypes';
import { dateKey as toDateKey } from './calendarDateUtils';

/**
 * PHASE 6 — Daily Routine's data model.
 *
 * Distinct from a Task (a concrete, one-off piece of work — see todoTypes.ts) and from a
 * WeeklyItem (a single-day slot on the Weekly Planner board — see weeklyPlannerTypes.ts):
 * a RoutineItem is the student's *repeatable day structure* — "Morning review", "Study
 * block", "Wind down" — that recurs on chosen weekdays at a chosen time. It intentionally
 * reuses this project's existing conventions rather than inventing new ones:
 *  - `days` uses the same Mon-first 'Mon'..'Sun' abbreviations as StudySession.day /
 *    WeeklyItem.day (see studyPlannerTypes.ts's DAYS / weeklyPlannerTypes.ts's WEEK_DAYS).
 *  - completion is a `{ [dateKey]: { [routineId]: boolean } }` map, the same per-day-key
 *    shape Habit.completions already uses (see habitTypes.ts) — completing today's
 *    occurrence never mutates the routine definition itself, so a recurring item doesn't
 *    become permanently "done".
 *  - date keys reuse calendarDateUtils.dateKey (local-time, not UTC — see that file).
 */

export interface RoutineItem {
  id: string;
  title: string;
  /** 'HH:MM', 24-hour, local time — same convention as DailyPlanItem.time (dailyPlannerTypes.ts). */
  time: string;
  /** Minutes. Used only to compute the current/next/later split and an end-time label. */
  durationMinutes: number;
  /** Subset of DAYS this item recurs on. An item with no days selected never appears in
   *  Today's Routine (see routineItemsForDay) but still exists so it can be re-enabled later. */
  days: string[];
  category?: string;
  enabled: boolean;
  /** Manual sort position within the routine — lower first, ties broken by time. */
  order: number;
}

/** dateKey -> routineId -> completed. Mirrors Habit.completions' shape/intent exactly. */
export type RoutineCompletions = Record<string, Record<string, boolean>>;

export const ROUTINE_CATEGORY_COLORS: Record<string, string> = {
  morning: '#fb923c',
  study: '#3b6dfb',
  break: '#17cf8f',
  afternoon: '#8b3ffb',
  evening: '#06b6d4',
  night: '#64748b',
};

export const ROUTINE_CATEGORIES = ['morning', 'study', 'break', 'afternoon', 'evening', 'night'] as const;

export { DAYS as ROUTINE_DAYS };

export function todayDateKey(): string {
  return toDateKey(new Date());
}

/** Today's weekday as the 'Mon'..'Sun' key RoutineItem.days uses. JS getDay(): 0=Sun..6=Sat;
 *  DAYS is Mon-first, so shift by one and wrap Sunday to index 6 — the same conversion
 *  planMyDay.ts's todayDayAbbrev already uses, kept in sync deliberately rather than reused
 *  directly since that helper isn't exported. */
export function dayAbbrevFor(date: Date): (typeof DAYS)[number] {
  const jsDay = date.getDay();
  return DAYS[(jsDay + 6) % 7];
}

/** Normalizes a routine start time to zero-padded 24h "HH:MM", or undefined when it isn't a real time of day.
 *  Accepts unpadded hours ("8:00" -> "08:00"); rejects empty strings, out-of-range values ("25:99", "24:00")
 *  and anything else. Single source of truth for both the sanitizer and the Daily Routine form. */
export function normalizeRoutineTime(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const m = /^(\d{1,2}):(\d{2})$/.exec(raw.trim());
  if (!m) return undefined;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return undefined;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Defends against malformed/partial persisted data (a corrupted localStorage value, a field
 *  from an older schema, manual tampering via devtools) the same way this project's other
 *  tools sanitize on read — never trust persisted shape blindly, never crash the page over it
 *  (see PHASE 6 brief, "Invalid persisted data"). Silently drops entries that aren't salvageable
 *  rather than throwing; callers get back only genuinely usable items. */
export function sanitizeRoutineItems(raw: unknown): RoutineItem[] {
  if (!Array.isArray(raw)) return [];
  const out: RoutineItem[] = [];
  raw.forEach((entry, i) => {
    if (!isPlainObject(entry)) return;
    const id = typeof entry.id === 'string' && entry.id ? entry.id : undefined;
    const title = typeof entry.title === 'string' ? entry.title.trim() : '';
    const time = normalizeRoutineTime(entry.time);
    if (!id || !title || !time) return; // not salvageable — id/title/time are load-bearing
    const durationMinutes = typeof entry.durationMinutes === 'number' && Number.isFinite(entry.durationMinutes) && entry.durationMinutes > 0
      ? Math.min(entry.durationMinutes, 24 * 60)
      : 30;
    const days = Array.isArray(entry.days) ? entry.days.filter((d): d is string => typeof d === 'string' && (DAYS as readonly string[]).includes(d)) : [];
    const category = typeof entry.category === 'string' && entry.category ? entry.category : undefined;
    const enabled = typeof entry.enabled === 'boolean' ? entry.enabled : true;
    const order = typeof entry.order === 'number' && Number.isFinite(entry.order) ? entry.order : i;
    out.push({ id, title, time, durationMinutes, days, category, enabled, order });
  });
  return out;
}

/** Same defensive intent as sanitizeRoutineItems, for the completions map. */
export function sanitizeRoutineCompletions(raw: unknown): RoutineCompletions {
  if (!isPlainObject(raw)) return {};
  const out: RoutineCompletions = {};
  for (const [dateKey, byId] of Object.entries(raw)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey) || !isPlainObject(byId)) continue;
    const entry: Record<string, boolean> = {};
    for (const [id, done] of Object.entries(byId)) {
      if (typeof done === 'boolean') entry[id] = done;
    }
    out[dateKey] = entry;
  }
  return out;
}

/** Minutes since local midnight — used to compare against RoutineItem.time for current/next/later. */
function minutesOf(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function routineEndMinutes(item: RoutineItem): number {
  return minutesOf(item.time) + item.durationMinutes;
}

/** Every enabled item recurring on `day`, sorted by time then `order`. */
export function routineItemsForDay(items: RoutineItem[], day: (typeof DAYS)[number]): RoutineItem[] {
  return items
    .filter((it) => it.enabled && it.days.includes(day))
    .sort((a, b) => minutesOf(a.time) - minutesOf(b.time) || a.order - b.order);
}

export interface RoutineSplit {
  current: RoutineItem[];
  next: RoutineItem | undefined;
  later: RoutineItem[];
  /** Today's items already past their end time (shown separately so "Later" doesn't include stale entries). */
  past: RoutineItem[];
}

/** Splits today's routine (already filtered to the current weekday) into current/next/later
 *  relative to `nowMinutes` (minutes since local midnight) — this is what lets the page answer
 *  "what should I do next?" without the student doing the time math themselves. An item counts
 *  as "current" while `nowMinutes` falls within [start, start+duration); the very next item
 *  after that (by time) is "next"; everything later today is "later".
 *
 *  KNOWN LIMITATION (documented, not silently ignored — see PHASE 6 brief section 28,
 *  "Midnight"): a block whose end time crosses midnight (e.g. 23:30 + 90 minutes) is compared
 *  entirely within today's 0–1439 minute range, so right after midnight it reads as "starts
 *  later today" instead of "still running from yesterday". Not fixed here — cross-midnight
 *  duration would need real date-aware arithmetic (today's occurrence vs. yesterday's tail),
 *  which is exactly the kind of scheduling-engine complexity the brief says to avoid (section
 *  38) for a feature most students will use for same-day blocks. */
export function splitRoutineByTime(todayItems: RoutineItem[], nowMinutes: number): RoutineSplit {
  const current: RoutineItem[] = [];
  const upcoming: RoutineItem[] = [];
  const past: RoutineItem[] = [];

  for (const item of todayItems) {
    const start = minutesOf(item.time);
    const end = routineEndMinutes(item);
    if (nowMinutes >= start && nowMinutes < end) current.push(item);
    else if (nowMinutes < start) upcoming.push(item);
    else past.push(item);
  }

  const [next, ...later] = upcoming;
  return { current, next, later, past };
}

export function isRoutineItemDoneOn(completions: RoutineCompletions, dateKey: string, itemId: string): boolean {
  return Boolean(completions[dateKey]?.[itemId]);
}
