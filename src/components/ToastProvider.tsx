import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Info, XCircle, X } from 'lucide-react';
import { playUiSound } from '@/lib/audio/uiSound';
import { usePreferencesStore } from '@/lib/store/preferences';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastType, typeof CheckCircle2> = { success: CheckCircle2, error: XCircle, info: Info };
const COLORS: Record<ToastType, string> = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  info: 'text-electric-500',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const uiSoundEnabled = usePreferencesStore((s) => s.uiSoundEnabled);
  const uiSoundVolume = usePreferencesStore((s) => s.uiSoundVolume);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
    // Only success/error notifications get a tone — 'info' toasts stay silent so
    // routine/frequent notices never become noisy, per the global sound-effects preference.
    if (uiSoundEnabled && (type === 'success' || type === 'error')) {
      playUiSound(type, uiSoundVolume);
    }
  }, [uiSoundEnabled, uiSoundVolume]);

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed left-4 z-[100] flex flex-col gap-2 pointer-events-none" style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }} role="region" aria-live="polite" aria-label="Notifications">
        <AnimatePresence>
          {toasts.map((toast) => {
            const Icon = ICONS[toast.type];
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="pointer-events-auto flex items-center gap-2.5 rounded-2xl glass-panel px-4 py-3 shadow-lg max-w-[calc(100vw-2rem)] sm:max-w-sm"
              >
                <Icon size={16} className={`${COLORS[toast.type]} shrink-0`} />
                <p className="text-sm font-medium text-navy-800 dark:text-ink-100 flex-1">{toast.message}</p>
                <button onClick={() => dismiss(toast.id)} aria-label="Dismiss notification" className="text-navy-400 hover:text-navy-600 dark:hover:text-ink-200 shrink-0">
                  <X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
