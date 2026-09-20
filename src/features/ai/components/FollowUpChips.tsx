import { ArrowUpRight } from 'lucide-react';

interface Props {
  suggestions: string[];
  onSelect: (text: string) => void;
  disabled?: boolean;
}

/** Quick-reply chips shown under the latest assistant message. Clicking one sends it
 * immediately as the next message — same as typing it and hitting Send. */
export function FollowUpChips({ suggestions, onSelect, disabled }: Props) {
  if (suggestions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-2 ml-11 max-w-2xl" role="group" aria-label="Suggested follow-ups">
      {suggestions.map((s) => (
        <button
          key={s}
          onClick={() => onSelect(s)}
          disabled={disabled}
          className="inline-flex items-center gap-1 rounded-full border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-3 py-1.5 text-xs font-medium text-navy-600 dark:text-ink-300 hover:border-electric-500 hover:text-electric-600 dark:hover:text-electric-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {s}
          <ArrowUpRight size={11} className="opacity-60" />
        </button>
      ))}
    </div>
  );
}
