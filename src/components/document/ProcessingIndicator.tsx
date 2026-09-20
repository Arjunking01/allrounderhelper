import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface ProcessingIndicatorProps {
  status: 'idle' | 'processing' | 'success' | 'error';
  progress?: number; // 0-100
  message?: string;
}

export function ProcessingIndicator({ status, progress, message }: ProcessingIndicatorProps) {
  if (status === 'idle') return null;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-navy-100 dark:border-white/10 px-4 py-3" role="status" aria-live="polite">
      {/* Crossfade the icon/message swap instead of a hard cut — this status sits at the end
       *  of every document-tool operation (processing -> success/error), so the swap is seen
       *  on essentially every use of the 13 pages sharing this component. */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={status}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="shrink-0 flex"
        >
          {status === 'processing' && <Loader2 size={18} className="animate-spin text-electric-500" />}
          {status === 'success' && <CheckCircle2 size={18} className="text-emerald-500" />}
          {status === 'error' && <XCircle size={18} className="text-red-500" />}
        </motion.span>
      </AnimatePresence>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-navy-800 dark:text-ink-100 truncate">
          {message ?? (status === 'processing' ? 'Processing...' : status === 'success' ? 'Done' : 'Something went wrong')}
        </p>
        {status === 'processing' && typeof progress === 'number' && (
          <div
            className="mt-1.5 h-1.5 w-full rounded-full bg-navy-100 dark:bg-white/10 overflow-hidden"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(Math.min(100, Math.max(0, progress)))}
            aria-label={message ?? 'Processing'}
          >
            <div className="h-full gradient-brand transition-all duration-200" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
          </div>
        )}
      </div>
    </div>
  );
}
