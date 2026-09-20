export interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  color?: string;
  pinned: boolean;
  favorite: boolean;
  archived: boolean;
  trashed: boolean;
  createdAt: string;
  updatedAt: string;
}

export const NOTE_CATEGORIES = ['General', 'Lecture Notes', 'Ideas', 'To Review'];

export const NOTE_COLORS = ['#3b6dfb', '#8b3ffb', '#17cf8f', '#fb923c', '#f43f5e', '#06b6d4'];

export type NoteSortKey = 'updatedAt' | 'createdAt' | 'title' | 'favorite';

/** Fills defaults for notes saved before tags/favorite/archive/trash/color existed, so old data keeps working. */
export function normalizeNote(raw: Partial<Note> & { id: string }): Note {
  return {
    id: raw.id,
    title: raw.title ?? '',
    content: raw.content ?? '',
    category: raw.category ?? NOTE_CATEGORIES[0],
    tags: raw.tags ?? [],
    color: raw.color,
    pinned: raw.pinned ?? false,
    favorite: raw.favorite ?? false,
    archived: raw.archived ?? false,
    trashed: raw.trashed ?? false,
    createdAt: raw.createdAt ?? raw.updatedAt ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
  };
}
