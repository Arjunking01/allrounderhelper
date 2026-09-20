import { AnimatePresence, motion } from 'framer-motion';
import { Download, X } from 'lucide-react';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';

/** Bottom-anchored install prompt. Only renders when the browser has actually fired
 *  `beforeinstallprompt` — never a fake/persuasive banner shown unconditionally.
 *
 *  This can appear over whatever the student is already doing (mid-scroll, mid-form), and
 *  dismissing/installing removes it just as unexpectedly — a hard mount/unmount here read as
 *  a glitch rather than an intentional prompt. Same settle-in/out treatment as the toast stack
 *  (opacity + small y/scale via AnimatePresence) gives it the arrival/departure continuity the
 *  rest of the app's floating UI already has. */
export function InstallBanner() {
  const { canInstall, promptInstall, dismiss } = useInstallPrompt();

  return (
    <AnimatePresence>
      {canInstall && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.97 }}
          role="region"
          aria-label="Install app"
          className="fixed inset-x-3 z-[200] sm:inset-x-auto sm:left-4 sm:max-w-sm"
          style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="glass-panel rounded-2xl p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl gradient-brand text-white">
              <Download size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-navy-900 dark:text-ink-100">Install ALLROUNDER HELPER</p>
              <p className="text-xs text-navy-500 dark:text-ink-400">Add it to your home screen for faster, offline-ready access.</p>
            </div>
            <button
              onClick={promptInstall}
              className="shrink-0 rounded-xl gradient-brand text-white text-xs font-semibold px-3 py-2 hover:brightness-110 transition-all"
            >
              Install
            </button>
            <button
              onClick={dismiss}
              aria-label="Dismiss install prompt"
              className="shrink-0 rounded-lg p-1.5 text-navy-400 hover:text-navy-600 dark:text-ink-500 dark:hover:text-ink-300 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
