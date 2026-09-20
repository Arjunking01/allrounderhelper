import { useMemo, useState } from 'react';
import { Search, Star, Clock } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { clsx } from '@/lib/utils/clsx';
import { PROMPT_LIBRARY, promptCategories, type PromptTemplate } from '../logic/promptLibrary';

const DIFFICULTY_COLOR: Record<string, string> = {
  beginner: 'bg-emerald-500/10 text-emerald-500',
  intermediate: 'bg-amber-500/10 text-amber-500',
  advanced: 'bg-red-500/10 text-red-500',
};

export function PromptLibraryPanel({ onUse }: { onUse: (template: PromptTemplate) => void }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [favorites, setFavorites] = useLocalStorage<string[]>('ar-ai-prompt-favorites', []);
  const [recent, setRecent] = useLocalStorage<string[]>('ar-ai-prompt-recent', []);
  const [view, setView] = useState<'all' | 'favorites' | 'recent'>('all');

  function toggleFavorite(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setFavorites((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  }

  function use(template: PromptTemplate) {
    setRecent((prev) => [template.id, ...prev.filter((r) => r !== template.id)].slice(0, 10));
    onUse(template);
  }

  const filtered = useMemo(() => {
    let list = PROMPT_LIBRARY;
    if (view === 'favorites') list = list.filter((p) => favorites.includes(p.id));
    else if (view === 'recent') list = recent.map((id) => PROMPT_LIBRARY.find((p) => p.id === id)).filter((p): p is PromptTemplate => Boolean(p));
    if (category !== 'all') list = list.filter((p) => p.category === category);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.tags.some((t) => t.includes(q)));
    }
    return list;
  }, [query, category, view, favorites, recent]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
          <input
            type="text"
            placeholder={`Search ${PROMPT_LIBRARY.length} prompts...`}
            aria-label="Search prompt library"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-lg border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 pl-8 pr-3 py-2 text-sm outline-none focus:border-electric-500"
          />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category" className="rounded-lg border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-3 py-2 text-sm outline-none focus:border-electric-500">
          <option value="all">All categories</option>
          {promptCategories().map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="flex gap-1 rounded-xl bg-navy-50 dark:bg-white/5 p-1 w-fit">
        {(['all', 'favorites', 'recent'] as const).map((v) => (
          <button key={v} onClick={() => setView(v)} className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium capitalize flex items-center gap-1.5', view === v ? 'bg-white dark:bg-navy-800 text-electric-500 shadow-sm' : 'text-navy-500 dark:text-ink-400')}>
            {v === 'favorites' && <Star size={11} />}
            {v === 'recent' && <Clock size={11} />}
            {v}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto pr-1">
        {filtered.length === 0 && <p className="text-sm text-navy-400 col-span-2 text-center py-6">No prompts match.</p>}
        {filtered.map((pmt) => (
          <button key={pmt.id} onClick={() => use(pmt)} className="text-left rounded-xl border border-navy-100 dark:border-white/10 p-3 hover:border-electric-500 transition-colors relative">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium pr-4">{pmt.title}</p>
              <span
                role="button"
                tabIndex={0}
                aria-label={favorites.includes(pmt.id) ? `Remove ${pmt.title} from favorites` : `Add ${pmt.title} to favorites`}
                onClick={(e) => toggleFavorite(pmt.id, e)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleFavorite(pmt.id, e as unknown as React.MouseEvent); } }}
                className={clsx('shrink-0', favorites.includes(pmt.id) ? 'text-amber-500' : 'text-navy-300 dark:text-ink-600 hover:text-amber-500')}
              >
                <Star size={13} fill={favorites.includes(pmt.id) ? 'currentColor' : 'none'} />
              </span>
            </div>
            <p className="text-xs text-navy-500 dark:text-ink-500 mt-0.5">{pmt.description}</p>
            <div className="flex items-center gap-1.5 mt-2">
              <span className={clsx('text-[10px] font-medium px-1.5 py-0.5 rounded', DIFFICULTY_COLOR[pmt.difficulty])}>{pmt.difficulty}</span>
              <span className="text-[10px] text-navy-400 dark:text-ink-500">{pmt.category}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
