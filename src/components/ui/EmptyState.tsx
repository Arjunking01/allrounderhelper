import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-50 dark:bg-white/5 text-navy-400 dark:text-ink-500 mb-4">
        <Icon size={24} />
      </div>
      <h3 className="font-semibold text-navy-800 dark:text-ink-100">{title}</h3>
      <p className="text-sm text-navy-500 dark:text-ink-500 mt-1 max-w-xs">{description}</p>
    </div>
  );
}
