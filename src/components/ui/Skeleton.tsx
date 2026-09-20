import { clsx } from '@/lib/utils/clsx';
import { Logo } from '@/components/ui/Logo';

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('animate-pulse rounded-lg bg-navy-100 dark:bg-white/10', className)} />;
}

/** Full-page skeleton shown while a lazy route chunk loads — doubles as the app's loading screen. */
export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 space-y-6" aria-busy="true" aria-label="Loading page">
      <div className="flex items-center gap-4">
        <Logo size={48} className="animate-pulse" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3.5 w-72" />
        </div>
      </div>
      <Skeleton className="h-64 w-full rounded-3xl" />
      <div className="grid sm:grid-cols-2 gap-4">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
      </div>
    </div>
  );
}

/** Compact skeleton for card-sized regions (e.g. a tool list before data loads). */
export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-navy-100 dark:border-white/10 p-5 space-y-3">
      <Skeleton className="h-9 w-9 rounded-xl" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-full" />
    </div>
  );
}
