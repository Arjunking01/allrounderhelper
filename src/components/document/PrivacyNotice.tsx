import { ShieldCheck } from 'lucide-react';

export function PrivacyNotice() {
  return (
    <div className="flex items-start gap-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15 px-4 py-2.5 mb-5">
      <ShieldCheck size={15} className="text-emerald-500 shrink-0 mt-0.5" />
      <p className="text-xs text-navy-600 dark:text-ink-300">
        Your file is processed entirely in your browser and is never uploaded to a server.
      </p>
    </div>
  );
}
