import { useLocalStorage } from './useLocalStorage';

export interface CalcHistoryEntry {
  id: string;
  summary: string;
  timestamp: string;
}

type CalcHistoryStore = Record<string, CalcHistoryEntry[]>;

const MAX_PER_TOOL = 10;

export function useCalculatorHistory(toolSlug: string) {
  const [store, setStore] = useLocalStorage<CalcHistoryStore>('ar-calculator-history', {});

  const entries = store[toolSlug] ?? [];

  function addEntry(summary: string) {
    setStore((prev) => ({
      ...prev,
      [toolSlug]: [{ id: crypto.randomUUID(), summary, timestamp: new Date().toISOString() }, ...(prev[toolSlug] ?? [])].slice(0, MAX_PER_TOOL),
    }));
  }

  function clearEntries() {
    setStore((prev) => ({ ...prev, [toolSlug]: [] }));
  }

  return { entries, addEntry, clearEntries };
}
