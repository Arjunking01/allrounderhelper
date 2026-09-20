import { History, Trash2 } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import type { HistoryEntry } from '@/hooks/useToolHistory';

interface HistoryPanelProps {
  entries: HistoryEntry[];
  onClear?: () => void;
}

export function HistoryPanel({ entries, onClear }: HistoryPanelProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-navy-700 dark:text-ink-300 flex items-center gap-1.5">
          <History size={15} /> Recent files
        </h3>
        {entries.length > 0 && onClear && (
          <button onClick={onClear} className="text-xs text-navy-400 hover:text-red-500 flex items-center gap-1">
            <Trash2 size={12} /> Clear
          </button>
        )}
      </div>
      {entries.length === 0 ? (
        <EmptyState icon={History} title="No files yet" description="Files you process will show up here for quick reference." />
      ) : (
        <ul className="space-y-1.5 max-h-64 overflow-y-auto">
          {entries.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-2 rounded-xl border border-navy-100 dark:border-white/10 px-3 py-2 text-sm">
              <span className="min-w-0 flex-1 truncate font-medium text-navy-700 dark:text-ink-300">{e.fileName}</span>
              <span className="text-xs text-navy-400 dark:text-ink-500 shrink-0">{e.sizeLabel}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
