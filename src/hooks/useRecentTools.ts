import { useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';

export interface RecentToolVisit {
  path: string;
  title: string;
  timestamp: string;
}

export interface ToolUsageEntry {
  path: string;
  title: string;
  count: number;
}

const MAX_RECENT = 12;

export function useRecentToolsStore() {
  return useLocalStorage<RecentToolVisit[]>('ar-recent-tools', []);
}

export function useToolUsageStore() {
  return useLocalStorage<Record<string, ToolUsageEntry>>('ar-tool-usage-counts', {});
}

/** Returns tools sorted by how many times they've been opened, most-used first. */
export function useMostUsedTools(limit = 8): ToolUsageEntry[] {
  const [usage] = useToolUsageStore();
  return Object.values(usage)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/** Call once per tool page to record a visit for the Dashboard, Command Palette "recent" list, and Analytics usage stats. */
export function useTrackToolVisit(path: string, title: string) {
  const [, setRecent] = useRecentToolsStore();
  const [, setUsage] = useToolUsageStore();

  useEffect(() => {
    setRecent((prev) => [{ path, title, timestamp: new Date().toISOString() }, ...prev.filter((r) => r.path !== path)].slice(0, MAX_RECENT));
    setUsage((prev) => ({ ...prev, [path]: { path, title, count: (prev[path]?.count ?? 0) + 1 } }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);
}
