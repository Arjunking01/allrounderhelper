import { motion } from 'framer-motion';
import { clsx } from '@/lib/utils/clsx';

interface ResultStatProps {
  label: string;
  value: string;
  tone?: 'brand' | 'emerald' | 'violet' | 'neutral';
  hint?: string;
}

const toneClasses: Record<string, string> = {
  brand: 'text-gradient-brand',
  emerald: 'text-emerald-500',
  violet: 'text-violet-500',
  neutral: 'text-navy-900 dark:text-ink-100',
};

export function ResultStat({ label, value, tone = 'brand', hint }: ResultStatProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-1"
    >
      <span className="text-xs font-medium uppercase tracking-wide text-navy-500 dark:text-ink-500">
        {label}
      </span>
      <span className={clsx('text-3xl sm:text-4xl font-display font-semibold', toneClasses[tone])}>
        {value}
      </span>
      {hint && <span className="text-xs text-navy-500 dark:text-ink-500">{hint}</span>}
    </motion.div>
  );
}

export function ResultGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">{children}</div>;
}
