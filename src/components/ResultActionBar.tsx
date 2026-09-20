import { useEffect, useRef, useState } from 'react';
import { Copy, Share2, Printer, History as HistoryIcon, Trash2, FileDown } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';
import { useShare } from '@/hooks/useShare';
import { copyToClipboard } from '@/lib/clipboard';
import { usePrint } from '@/hooks/usePrint';
import { useResultPdfExport } from '@/hooks/useResultPdfExport';
import { useCalculatorHistory } from '@/hooks/useCalculatorHistory';

interface ResultActionBarProps {
  toolName: string;
  toolSlug: string;
  /** A short, human-readable summary of the current result, e.g. "CGPA: 8.42". Pass '' while there's no valid result yet. */
  resultSummary: string;
}

export function ResultActionBar({ toolName, toolSlug, resultSummary }: ResultActionBarProps) {
  const { showToast } = useToast();
  const { share } = useShare();
  const { printResult } = usePrint();
  const { entries, addEntry, clearEntries } = useCalculatorHistory(toolSlug);
  const { exportPdf } = useResultPdfExport();
  const [historyOpen, setHistoryOpen] = useState(false);
  const lastRecorded = useRef<string>('');

  useEffect(() => {
    if (resultSummary && resultSummary !== lastRecorded.current) {
      const timeout = setTimeout(() => {
        addEntry(resultSummary);
        lastRecorded.current = resultSummary;
      }, 800); // small debounce so we don't log every keystroke
      return () => clearTimeout(timeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultSummary]);

  const hasResult = resultSummary.length > 0;

  async function copy() {
    const ok = await copyToClipboard(resultSummary);
    showToast(ok ? 'Result copied to clipboard' : 'Could not copy to clipboard');
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={copy}
          disabled={!hasResult}
          className="flex items-center gap-1.5 rounded-lg border border-navy-200 dark:border-white/10 px-3 py-1.5 text-xs font-medium text-navy-600 dark:text-ink-300 hover:border-electric-500 hover:text-electric-500 disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          <Copy size={13} /> Copy
        </button>
        <button
          onClick={() => share(resultSummary, toolName)}
          disabled={!hasResult}
          className="flex items-center gap-1.5 rounded-lg border border-navy-200 dark:border-white/10 px-3 py-1.5 text-xs font-medium text-navy-600 dark:text-ink-300 hover:border-electric-500 hover:text-electric-500 disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          <Share2 size={13} /> Share
        </button>
        <button
          onClick={() => printResult(toolName, resultSummary)}
          disabled={!hasResult}
          className="flex items-center gap-1.5 rounded-lg border border-navy-200 dark:border-white/10 px-3 py-1.5 text-xs font-medium text-navy-600 dark:text-ink-300 hover:border-electric-500 hover:text-electric-500 disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          <Printer size={13} /> Print
        </button>
        <button
          onClick={() => exportPdf(toolName, resultSummary)}
          disabled={!hasResult}
          className="flex items-center gap-1.5 rounded-lg border border-navy-200 dark:border-white/10 px-3 py-1.5 text-xs font-medium text-navy-600 dark:text-ink-300 hover:border-electric-500 hover:text-electric-500 disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          <FileDown size={13} /> Export PDF
        </button>
        <button
          onClick={() => setHistoryOpen((v) => !v)}
          aria-expanded={historyOpen}
          className="flex items-center gap-1.5 rounded-lg border border-navy-200 dark:border-white/10 px-3 py-1.5 text-xs font-medium text-navy-600 dark:text-ink-300 hover:border-electric-500 hover:text-electric-500 transition-colors"
        >
          <HistoryIcon size={13} /> History {entries.length > 0 && `(${entries.length})`}
        </button>
      </div>

      {historyOpen && (
        <div className="mt-3 rounded-xl border border-navy-100 dark:border-white/10 p-3">
          {entries.length === 0 ? (
            <p className="text-xs text-navy-400 dark:text-ink-500">No past results yet for this calculator.</p>
          ) : (
            <>
              <ul className="space-y-1.5 max-h-48 overflow-y-auto">
                {entries.map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-navy-600 dark:text-ink-300 truncate min-w-0">{e.summary}</span>
                    <span className="text-navy-400 dark:text-ink-500 shrink-0">{new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </li>
                ))}
              </ul>
              <button onClick={clearEntries} className="mt-2 flex items-center gap-1 text-xs text-navy-400 hover:text-red-500">
                <Trash2 size={11} /> Clear history
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
