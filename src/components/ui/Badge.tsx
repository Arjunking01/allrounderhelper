import type { HTMLAttributes } from 'react';
import { clsx } from '@/lib/utils/clsx';

type BadgeTone = 'brand' | 'neutral' | 'emerald' | 'amber' | 'red' | 'violet';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

const TONE_CLASSES: Record<BadgeTone, string> = {
  brand: 'bg-electric-500/10 text-electric-500',
  neutral: 'bg-navy-100 dark:bg-white/10 text-navy-600 dark:text-ink-300',
  emerald: 'bg-emerald-500/10 text-emerald-500',
  amber: 'bg-amber-400/10 text-amber-500',
  red: 'bg-red-500/10 text-red-500',
  violet: 'bg-violet-500/10 text-violet-500',
};

export function Badge({ tone = 'neutral', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
        TONE_CLASSES[tone],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
