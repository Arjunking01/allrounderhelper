import { useMemo, useState } from 'react';

interface Searchable {
  name: string;
  tagline: string;
}

/** Client-side filter for a category's tool list by name/tagline. Pure and generic so
 *  every category page (academic, productivity, document, creator) shares one
 *  implementation instead of four copies of the same substring-match logic. */
export function useToolFilter<T extends Searchable>(items: T[]) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.name.toLowerCase().includes(q) || item.tagline.toLowerCase().includes(q));
  }, [items, query]);

  return { query, setQuery, filtered };
}
