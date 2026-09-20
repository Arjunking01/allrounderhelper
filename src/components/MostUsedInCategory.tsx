import { Link } from 'react-router-dom';
import { Flame } from 'lucide-react';
import { useMostUsedTools } from '@/hooks/useRecentTools';

/** Shows the user's own most-opened tools within this category, derived entirely from
 *  their local usage counts. Renders nothing until they have real usage to show —
 *  never a fabricated "popular" ranking. */
export function MostUsedInCategory({ pathPrefix }: { pathPrefix: string }) {
  const mostUsed = useMostUsedTools(20).filter((t) => t.path.startsWith(pathPrefix));

  if (mostUsed.length === 0) return null;

  return (
    <section className="mb-10">
      <h2 className="text-sm font-semibold text-navy-500 dark:text-ink-400 mb-3 flex items-center gap-1.5">
        <Flame size={14} className="text-orange-500" /> Your most used here
      </h2>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {mostUsed.slice(0, 6).map((t) => (
          <Link
            key={t.path}
            to={t.path}
            className="flex-none rounded-full border border-navy-200 dark:border-white/10 px-4 py-2 text-sm font-medium text-navy-700 dark:text-ink-300 hover:border-electric-500 hover:text-electric-500 transition-colors whitespace-nowrap"
          >
            {t.title}
          </Link>
        ))}
      </div>
    </section>
  );
}
