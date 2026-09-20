import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import aiAvatar from '@/assets/ai-character/allrounder-ai-avatar.png';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { usePreferencesStore } from '@/lib/store/preferences';
import { Button } from '@/components/ui/Button';

const STORAGE_KEY = 'ar-ai-onboarding-seen';

export function AiOnboardingDialog() {
  const [seen, setSeen] = useLocalStorage(STORAGE_KEY, false);
  const { displayName, setDisplayName } = usePreferencesStore();
  const [name, setName] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const active = !seen;

  useFocusTrap(dialogRef, active);

  useEffect(() => {
    if (!active) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [active]);

  if (!active) return null;

  function finish(save: boolean) {
    if (save && name.trim()) setDisplayName(name.trim());
    setSeen(true);
  }

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-navy-950/60 backdrop-blur-sm p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ai-onboarding-title"
          onKeyDown={(e) => { if (e.key === 'Escape') finish(false); }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            ref={dialogRef}
            className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white dark:bg-navy-900 border border-navy-100 dark:border-white/10 shadow-2xl p-6 sm:p-7"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-brand p-1">
              <img src={aiAvatar} alt="" className="h-full w-full object-contain" />
            </div>

            <h2 id="ai-onboarding-title" className="mt-4 text-xl font-semibold text-navy-900 dark:text-ink-100">
              Meet Your Personal AI Study Assistant
            </h2>
            <p className="mt-2 text-sm text-navy-500 dark:text-ink-500 leading-relaxed">
              Your intelligent study partner for learning, coding, productivity and exam success.
            </p>

            <label className="mt-5 block">
              <span className="text-sm font-medium text-navy-700 dark:text-ink-300 mb-2 block">What should I call you? <span className="font-normal text-navy-400 dark:text-ink-500">(optional)</span></span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={displayName || 'e.g. Alex'}
                maxLength={40}
                autoFocus
                className="w-full rounded-lg border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-3.5 py-2.5 text-sm text-navy-900 dark:text-ink-100 placeholder:text-navy-400 dark:placeholder:text-ink-500 focus:border-electric-500 focus:outline-none transition-colors"
              />
              <span className="text-xs text-navy-400 dark:text-ink-500 mt-1.5 block">
                Stored only on this device. You can change or remove it anytime in Settings.
              </span>
            </label>

            <div className="mt-6 flex items-center justify-end gap-3">
              <Button variant="ghost" size="sm" onClick={() => finish(false)}>
                Skip
              </Button>
              <Button size="sm" onClick={() => finish(true)}>
                Continue
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
