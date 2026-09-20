import { useCallback, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import {
  type RoutineItem,
  type RoutineCompletions,
  sanitizeRoutineItems,
  sanitizeRoutineCompletions,
  todayDateKey,
  isRoutineItemDoneOn,
} from './routineTypes';

const ITEMS_KEY = 'ar-daily-routine';
const COMPLETIONS_KEY = 'ar-daily-routine-completions';

export interface NewRoutineItemInput {
  title: string;
  time: string;
  durationMinutes: number;
  days: string[];
  category?: string;
}

/**
 * Owns Daily Routine's persistence and mutations — the one place routine items and today's
 * completion state are read/written, so DailyRoutinePage (and anything else that needs a
 * quick read, e.g. a future Dashboard/What-Next card) never hand-rolls its own localStorage
 * access (see PHASE 6 brief, "Storage" — reuse useLocalStorage, don't scatter setItem calls).
 * `serializeForStorage`-free: routine data is always small text, unlike AI attachments.
 */
export function useDailyRoutine() {
  const [rawItems, setRawItems, itemsPersistError] = useLocalStorage<unknown>(ITEMS_KEY, [] as RoutineItem[]);
  const [rawCompletions, setRawCompletions, completionsPersistError] = useLocalStorage<unknown>(COMPLETIONS_KEY, {} as RoutineCompletions);

  // Sanitized on every read rather than only at first load, so a value written by an older
  // schema (or edited by hand in devtools) never crashes the page later either — see
  // routineTypes.ts's sanitize* doc comments.
  const items = useMemo(() => sanitizeRoutineItems(rawItems), [rawItems]);
  const completions = useMemo(() => sanitizeRoutineCompletions(rawCompletions), [rawCompletions]);

  const setItems = useCallback((updater: (prev: RoutineItem[]) => RoutineItem[]) => {
    setRawItems((prev: unknown) => updater(sanitizeRoutineItems(prev)));
  }, [setRawItems]);

  const addItem = useCallback((input: NewRoutineItemInput) => {
    const title = input.title.trim();
    if (!title) return;
    setItems((prev) => {
      const maxOrder = prev.reduce((max, it) => Math.max(max, it.order), -1);
      const item: RoutineItem = {
        id: crypto.randomUUID(),
        title,
        time: input.time,
        durationMinutes: input.durationMinutes > 0 ? input.durationMinutes : 30,
        days: input.days,
        category: input.category,
        enabled: true,
        order: maxOrder + 1,
      };
      return [...prev, item];
    });
  }, [setItems]);

  const updateItem = useCallback((id: string, patch: Partial<Omit<RoutineItem, 'id'>>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }, [setItems]);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
    // Completion history for a deleted item is harmless clutter, not a correctness issue —
    // left in place rather than swept across every stored date key for a rarely-hit path.
  }, [setItems]);

  const toggleEnabled = useCallback((id: string) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, enabled: !it.enabled } : it)));
  }, [setItems]);

  const reorder = useCallback((id: string, direction: 'up' | 'down') => {
    setItems((prev) => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex((it) => it.id === id);
      const swapWith = direction === 'up' ? idx - 1 : idx + 1;
      if (idx === -1 || swapWith < 0 || swapWith >= sorted.length) return prev;
      const a = sorted[idx];
      const b = sorted[swapWith];
      return prev.map((it) => {
        if (it.id === a.id) return { ...it, order: b.order };
        if (it.id === b.id) return { ...it, order: a.order };
        return it;
      });
    });
  }, [setItems]);

  const toggleCompletedToday = useCallback((id: string) => {
    const today = todayDateKey();
    setRawCompletions((prev: unknown) => {
      const sanitized = sanitizeRoutineCompletions(prev);
      const todayMap = { ...sanitized[today] };
      todayMap[id] = !todayMap[id];
      return { ...sanitized, [today]: todayMap };
    });
  }, [setRawCompletions]);

  const isDoneToday = useCallback((id: string) => isRoutineItemDoneOn(completions, todayDateKey(), id), [completions]);

  return {
    items,
    completions,
    persistError: itemsPersistError || completionsPersistError,
    addItem,
    updateItem,
    removeItem,
    toggleEnabled,
    reorder,
    toggleCompletedToday,
    isDoneToday,
  };
}
