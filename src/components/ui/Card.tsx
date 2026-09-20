import { forwardRef, type HTMLAttributes } from 'react';
import { clsx } from '@/lib/utils/clsx';

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function Card({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={clsx(
        'glass-panel p-6 sm:p-8',
        className
      )}
      {...props}
    />
  );
});

export function SoftCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        'rounded-2xl border border-navy-100 dark:border-white/10 bg-navy-50/60 dark:bg-white/[0.03] p-5',
        className
      )}
      {...props}
    />
  );
}
