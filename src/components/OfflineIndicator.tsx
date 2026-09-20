import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { WifiOff } from 'lucide-react';

export function OfflineIndicator() {
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);

  useEffect(() => {
    function update() {
      setOnline(navigator.onLine);
    }
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  // Connectivity can flip at any moment while a student is mid-task, so this badge mounting/
  // unmounting in the header is a real, unpredictable state change — not a user-triggered one
  // like a dialog open. It gets the same settle-in/settle-out treatment as toasts (opacity +
  // small y/scale) so it doesn't register as a layout jump next to whatever the header is doing.
  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          initial={{ opacity: 0, y: -4, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="flex items-center justify-center gap-1.5 rounded-full bg-amber-400/10 text-amber-500 text-xs font-medium h-9 w-9 sm:h-auto sm:w-auto sm:px-3 sm:py-1.5 shrink-0"
          role="status"
          title="Offline — saved tools still work"
        >
          <WifiOff size={13} className="shrink-0" />
          <span className="hidden sm:inline">Offline — saved tools still work</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
