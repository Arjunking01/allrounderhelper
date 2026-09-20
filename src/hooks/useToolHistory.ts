import { useLocalStorage } from './useLocalStorage';

export interface HistoryEntry {
  id: string;
  tool: string;
  toolSlug: string;
  fileName: string;
  sizeLabel: string;
  timestamp: string;
}

const MAX_HISTORY = 30;

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/** Shared local-only history of recently processed files, reusable across every document/image tool. */
export function useToolHistory() {
  const [history, setHistory] = useLocalStorage<HistoryEntry[]>('ar-doc-history', []);
  const [recentTools, setRecentTools] = useLocalStorage<string[]>('ar-doc-recent-tools', []);

  function addEntry(entry: Omit<HistoryEntry, 'id' | 'timestamp'>) {
    setHistory((prev) => [{ ...entry, id: crypto.randomUUID(), timestamp: new Date().toISOString() }, ...prev].slice(0, MAX_HISTORY));
    setRecentTools((prev) => [entry.toolSlug, ...prev.filter((s) => s !== entry.toolSlug)].slice(0, 6));
  }

  function clearHistory() {
    setHistory([]);
  }

  function historyForTool(toolSlug: string) {
    return history.filter((h) => h.toolSlug === toolSlug);
  }

  return { history, recentTools, addEntry, clearHistory, historyForTool };
}
