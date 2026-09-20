import { useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { CONVERSATIONS_STORAGE_KEY } from './useConversations';
import type { Conversation } from './aiTypes';

export interface RecentConversationSummary {
  id: string;
  title: string;
  updatedAt: string;
  messageCount: number;
}

/** Read-only view of recent, non-deleted, non-archived conversations, most recent first.
 *  Deliberately lighter than `useConversations` — no local UI state (active id, search,
 *  folder filter) — for read-only surfaces like the Dashboard that just need a list. */
export function useRecentConversations(limit = 5): RecentConversationSummary[] {
  const [conversations] = useLocalStorage<Conversation[]>(CONVERSATIONS_STORAGE_KEY, []);

  return useMemo(() => {
    return conversations
      .filter((c) => c.deletedAt === null && !c.archived && c.messages.length > 0)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, limit)
      .map((c) => ({ id: c.id, title: c.title, updatedAt: c.updatedAt, messageCount: c.messages.length }));
  }, [conversations, limit]);
}
