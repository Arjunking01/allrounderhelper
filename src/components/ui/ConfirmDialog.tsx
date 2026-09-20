import { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { Button } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Generic confirmation dialog for irreversible actions (permanent delete, clear all,
 *  etc.). Reused rather than duplicated per-caller — same overlay/focus-trap/scroll-lock
 *  pattern as OnboardingTour and AiOnboardingDialog. */
export function ConfirmDialog({ open, title, description, confirmLabel = 'Delete', onConfirm, onCancel }: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, open);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-navy-950/60 backdrop-blur-sm p-0 sm:p-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          aria-describedby="confirm-dialog-description"
          onKeyDown={(e) => { if (e.key === 'Escape') onCancel(); }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            ref={dialogRef}
            className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl bg-white dark:bg-navy-900 border border-navy-100 dark:border-white/10 shadow-2xl p-6"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
              <AlertTriangle size={18} />
            </div>
            <h2 id="confirm-dialog-title" className="mt-4 text-base font-semibold text-navy-900 dark:text-ink-100">{title}</h2>
            <p id="confirm-dialog-description" className="mt-1.5 text-sm text-navy-500 dark:text-ink-500 leading-relaxed">{description}</p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
              <Button size="sm" variant="danger" onClick={onConfirm}>{confirmLabel}</Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
