import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { X, ArrowRight } from 'lucide-react';
import aiAvatar from '@/assets/ai-character/allrounder-ai-avatar.png';
import { useWelcomeBack } from '@/hooks/useWelcomeBack';

/**
 * A brief, tasteful "welcome back" moment for a genuine return visit \u2014 not a popup, not
 * shown every load. Reuses the same mascot asset as the AI Assistant avatar (never a separate
 * character) and the app's existing reduce-motion convention. See useWelcomeBack.ts for the
 * return-detection/cooldown logic and message priority.
 */
export function WelcomeBackCard() {
  const { show, message, actionLabel, actionHref, reduceMotion, dismiss } = useWelcomeBack();

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          role="status"
          className="mx-auto max-w-2xl mb-6 rounded-2xl glass-panel px-4 py-3.5 flex flex-wrap sm:flex-nowrap items-center gap-3"
        >
          <motion.div
            className="h-10 w-10 shrink-0 rounded-xl bg-electric-500/10 flex items-center justify-center overflow-hidden"
            animate={reduceMotion ? undefined : { rotate: [0, -8, 8, -4, 0] }}
            transition={reduceMotion ? undefined : { duration: 0.9, delay: 0.2, ease: 'easeInOut' }}
          >
            <img src={aiAvatar} alt="" className="h-full w-full object-contain" />
          </motion.div>

          <p className="flex-1 min-w-[12rem] text-sm text-navy-700 dark:text-ink-200">{message}</p>

          {actionHref && actionLabel && (
            <Link
              to={actionHref}
              onClick={dismiss}
              className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-electric-500 hover:brightness-110 transition-all whitespace-nowrap ml-[3.25rem] sm:ml-0"
            >
              {actionLabel} <ArrowRight size={12} />
            </Link>
          )}

          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="shrink-0 rounded-lg p-1 text-navy-400 hover:text-navy-600 dark:text-ink-500 dark:hover:text-ink-300 transition-colors"
          >
            <X size={15} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
