import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, Clock, CornerDownLeft } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { getAllSearchableItems, type SearchableItem } from '@/data/allToolsRegistry';
import { useFavoriteTools } from '@/hooks/useFavoriteTools';
import { useRecentToolsStore } from '@/hooks/useRecentTools';
import { useCommandPaletteStore } from '@/lib/store/commandPalette';
import { useFocusTrap } from '@/hooks/useFocusTrap';

export function CommandPalette() {
  const { isOpen: open, close, toggle } = useCommandPaletteStore();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const navigate = useNavigate();
  const { favorites } = useFavoriteTools();
  const [recent] = useRecentToolsStore();

  const allItems = useMemo(() => getAllSearchableItems(), []);

  useFocusTrap(panelRef, open);

  // Lock body scroll while the palette is open so touch-drag on the backdrop can't
  // scroll the page behind it on mobile.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggle();
      }
      if (e.key === 'Escape') close();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggle, close]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  const results: SearchableItem[] = useMemo(() => {
    if (!query.trim()) {
      const recentItems = recent
        .map((r) => allItems.find((i) => i.path === r.path))
        .filter((i): i is SearchableItem => Boolean(i));
      return recentItems.length > 0 ? recentItems : allItems.slice(0, 8);
    }
    const q = query.toLowerCase();
    return allItems.filter((i) => i.title.toLowerCase().includes(q) || i.subtitle.toLowerCase().includes(q) || i.section.toLowerCase().includes(q)).slice(0, 20);
  }, [query, allItems, recent]);

  // Arrow-key navigation moves `activeIndex`, but the results list scrolls independently
  // (max-h-96 overflow-y-auto) — without this, repeated ArrowDown/ArrowUp can push the
  // highlighted row out of the visible area while keyboard focus stays in the input above,
  // leaving no visual indication of which item Enter would actually select.
  useEffect(() => {
    itemRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  function go(path: string) {
    navigate(path);
    close();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[activeIndex]) {
      go(results[activeIndex].path);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[12vh] px-4" role="dialog" aria-modal="true" aria-label="Command palette">
          <motion.div
            className="fixed inset-0 bg-navy-950/50 backdrop-blur-sm"
            onClick={close}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          />
          <motion.div
            ref={panelRef}
            className="relative w-full max-w-xl glass-panel overflow-hidden"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <div className="flex items-center gap-3 border-b border-navy-100 dark:border-white/10 px-4 py-3.5">
              <Search size={18} className="text-navy-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={onKeyDown}
                placeholder="Search tools, pages..."
                className="flex-1 bg-transparent outline-none focus:ring-2 focus:ring-electric-500/20 rounded text-navy-900 dark:text-ink-100 placeholder:text-navy-400"
                aria-label="Search"
              />
              <kbd className="hidden sm:inline text-[10px] font-semibold text-navy-400 border border-navy-200 dark:border-white/10 rounded px-1.5 py-0.5">ESC</kbd>
            </div>

            <div className="max-h-96 overflow-y-auto py-2">
              {!query.trim() && (
                <p className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-navy-400 dark:text-ink-500 flex items-center gap-1.5">
                  <Clock size={11} /> {recent.length > 0 ? 'Recent' : 'Suggested'}
                </p>
              )}
              {results.length === 0 && <p className="px-4 py-6 text-sm text-navy-400 text-center">No results for "{query}"</p>}
              {results.map((item, i) => {
                const Icon = item.icon;
                const isFavorite = favorites.includes(item.path);
                return (
                  <button
                    key={item.id}
                    ref={(el) => { itemRefs.current[i] = el; }}
                    onClick={() => go(item.path)}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${i === activeIndex ? 'bg-electric-500/10' : ''}`}
                  >
                    <Icon size={16} className="text-navy-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <p className="text-xs text-navy-400 dark:text-ink-500 truncate">{item.section}</p>
                    </div>
                    {isFavorite && <Star size={13} className="text-amber-400 shrink-0" fill="currentColor" />}
                    {i === activeIndex && <CornerDownLeft size={13} className="text-navy-300 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
