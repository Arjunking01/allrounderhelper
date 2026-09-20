import { useMemo, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { ChatMessage, ChatRole, Conversation, ConversationFolder } from './aiTypes';
import type { Attachment } from './attachmentTypes';

export const CONVERSATIONS_STORAGE_KEY = 'ar-ai-conversations';

/** Revokes any blob: object URLs held by a message's attachments (uploaded image previews
 *  and AI-generated images alike) so the in-memory Blob they reference can be freed as soon
 *  as the message is actually gone, instead of only implicitly on page unload. Deliberately
 *  scoped to `blob:` — never revokes a non-blob URL, in case attachments ever carry a real
 *  remote/data URL in the future. Safe to call on messages with no attachments. */
function revokeMessageBlobUrls(message: ChatMessage) {
  for (const a of message.attachments ?? []) {
    if (a.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(a.previewUrl);
  }
}

function newConversation(providerId: string, folder: ConversationFolder = 'general'): Conversation {
  const now = new Date().toISOString();
  return { id: crypto.randomUUID(), title: 'New conversation', messages: [], providerId, folder, pinned: false, archived: false, deletedAt: null, createdAt: now, updatedAt: now };
}

const VALID_ROLES: ChatRole[] = ['system', 'user', 'assistant'];
const VALID_FOLDERS: ConversationFolder[] = ['academic', 'coding', 'math', 'personal', 'general'];

/** Normalizes a stored/imported `attachments` field into a real `Attachment[]`, dropping
 *  anything that isn't a plausible attachment object. Every consumer of `message.attachments`
 *  (ChatMessageBubble's `.filter`, `attachmentsWithText`/`hasAttachmentText` in
 *  attachmentTypes.ts, `revokeMessageBlobUrls`) assumes it's either undefined or a real array
 *  of objects — none of them defensively check the array itself. A corrupted localStorage
 *  entry or a hand-edited "Import chat" file can set this to any JSON value (a string, a
 *  plain object, a number), and without this guard the first `.filter(...)` call on it throws
 *  and the conversation becomes permanently unopenable (the bad value round-trips right back
 *  out to storage on every read). Individual malformed *items* inside an otherwise-valid array
 *  are dropped rather than repaired — every field on them is optional except id/name, so
 *  there's nothing safe to default `previewUrl`/`status` to. */
function sanitizeAttachments(value: unknown): Attachment[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const cleaned = value.filter((a): a is Attachment => !!a && typeof a === 'object' && typeof (a as Attachment).id === 'string' && typeof (a as Attachment).name === 'string');
  return cleaned.length > 0 ? cleaned : undefined;
}

/** Fixes up one stored message so downstream code can rely on its shape without every call
 *  site re-checking it. Deliberately preserves fields like `isStreaming`/`pinned` as-is (a
 *  live streaming message must not be reset mid-stream just because the storage list was
 *  re-read) — it only repairs fields other logic actually indexes/sorts/switches on: an
 *  unrecognized `role` (would otherwise render with no matching bubble style), a
 *  missing/unparseable `createdAt` (would otherwise throw inside a `.localeCompare` sort, e.g.
 *  in mergeConversations), and a non-array `attachments` (see sanitizeAttachments). Returns
 *  null only for entries too broken to use at all (no id or no string content). */
function sanitizeMessage(m: unknown): ChatMessage | null {
  if (!m || typeof m !== 'object') return null;
  const raw = m as Partial<ChatMessage>;
  if (typeof raw.id !== 'string' || !raw.id || typeof raw.content !== 'string') return null;
  const role: ChatRole = VALID_ROLES.includes(raw.role as ChatRole) ? (raw.role as ChatRole) : 'assistant';
  const createdAt = typeof raw.createdAt === 'string' && !isNaN(Date.parse(raw.createdAt)) ? raw.createdAt : new Date().toISOString();
  return { ...raw, id: raw.id, content: raw.content, role, createdAt, attachments: sanitizeAttachments(raw.attachments) } as ChatMessage;
}

/** Repairs one stored conversation against corrupted/hand-edited/older-schema localStorage
 *  data — one malformed entry (missing/wrong-typed field, non-array messages, invalid
 *  timestamp) should degrade that entry gracefully, never crash the whole AI Assistant.
 *  Entries with no usable `id` are dropped entirely; everything else falls back to a safe
 *  default per-field. This intentionally stays a flat per-field repair rather than a
 *  versioned migration system — there is only ever one shape to repair into. */
function sanitizeConversation(c: unknown): Conversation | null {
  if (!c || typeof c !== 'object') return null;
  const raw = c as Partial<Conversation>;
  if (typeof raw.id !== 'string' || !raw.id) return null;
  const createdAt = typeof raw.createdAt === 'string' && !isNaN(Date.parse(raw.createdAt)) ? raw.createdAt : new Date().toISOString();
  return {
    id: raw.id,
    title: typeof raw.title === 'string' && raw.title ? raw.title : 'Untitled conversation',
    messages: Array.isArray(raw.messages) ? raw.messages.map(sanitizeMessage).filter((m): m is ChatMessage => m !== null) : [],
    providerId: typeof raw.providerId === 'string' && raw.providerId ? raw.providerId : 'unknown',
    folder: VALID_FOLDERS.includes(raw.folder as ConversationFolder) ? (raw.folder as ConversationFolder) : 'general',
    pinned: Boolean(raw.pinned),
    archived: Boolean(raw.archived),
    deletedAt: typeof raw.deletedAt === 'string' && !isNaN(Date.parse(raw.deletedAt)) ? raw.deletedAt : null,
    createdAt,
    updatedAt: typeof raw.updatedAt === 'string' && !isNaN(Date.parse(raw.updatedAt)) ? raw.updatedAt : createdAt,
  };
}

export interface ConversationStats {
  messageCount: number;
  userMessages: number;
  assistantMessages: number;
  estimatedTokens: number;
  createdAt: string;
  updatedAt: string;
}

/** Rough token estimate (~4 characters per token) — clearly an estimate, never presented as exact. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function conversationStats(c: Conversation): ConversationStats {
  const userMessages = c.messages.filter((m) => m.role === 'user').length;
  const assistantMessages = c.messages.filter((m) => m.role === 'assistant' && !m.isSystemNotice).length;
  const estimatedTokens = c.messages.reduce((sum, m) => sum + estimateTokens(m.content), 0);
  return { messageCount: c.messages.length, userMessages, assistantMessages, estimatedTokens, createdAt: c.createdAt, updatedAt: c.updatedAt };
}

/** Strips per-attachment fields that must never be written to localStorage before a
 *  conversation array is persisted (the in-memory React state passed to setStoredConversations
 *  keeps these fields untouched \u2014 only the serialized-to-disk copy is stripped):
 *  - `previewUrl`: a session-local `blob:` object URL, already dead on the next page load.
 *  - `dataUrl`: the real base64 image bytes sent to a vision provider. Necessary in memory for
 *    sending/resending within the current session, but persisting every attached image's full
 *    bytes risks blowing localStorage's ~5-10MB quota \u2014 and a quota error here fails the
 *    ENTIRE stored value, silently losing the whole conversation history, not just the
 *    oversized attachment. Dropping it means an image attachment simply won't be re-sendable
 *    after a reload (same accepted limitation the app already has for previewUrl/blob:), rather
 *    than risking conversation data loss.
 *  - `pageImages`: the rasterized page images for a scanned PDF (see attachmentTextExtraction's
 *    renderScannedPdfPages) \u2014 same reasoning and same risk as `dataUrl`, actually worse in the
 *    worst case since it's an ARRAY of full-size images rather than one. Must never be
 *    persisted for the same localStorage-quota reason. `pageImagesTruncated` is kept (it's a
 *    tiny boolean, not bulk data) purely as a harmless leftover note; it has no effect once
 *    `pageImages` itself is gone.
 *  Text extracted from documents (`text`) is intentionally kept \u2014 it's plain text, typically
 *  small, and is exactly the content that makes a re-opened conversation still useful. */
function stripUnpersistableAttachmentData(list: Conversation[]): Conversation[] {
  return list.map((c) => ({
    ...c,
    messages: c.messages.map((m) =>
      m.attachments?.length
        ? { ...m, attachments: m.attachments.map(({ previewUrl: _previewUrl, dataUrl: _dataUrl, pageImages: _pageImages, ...rest }) => rest) }
        : m
    ),
  }));
}

export function useConversations(defaultProviderId: string) {
  const [storedConversations, setStoredConversations] = useLocalStorage<Conversation[]>(CONVERSATIONS_STORAGE_KEY, [], stripUnpersistableAttachmentData);
  // Sanitized view of whatever is actually in storage — repairs/drops malformed entries on
  // every read so a single corrupted conversation can't break sorting/filtering below.
  const conversations = useMemo(
    () => storedConversations.map(sanitizeConversation).filter((c): c is Conversation => c !== null),
    [storedConversations]
  );
  // All mutators below go through this rather than the raw storage setter, so every write
  // also sanitizes `prev` first — otherwise a mutator's own `{ ...c, ... }` spread (e.g.
  // appendMessage's `[...c.messages, message]`) could itself throw on a still-corrupted
  // entry that happens to be the one being updated.
  function setConversations(updater: (prev: Conversation[]) => Conversation[]) {
    setStoredConversations((prev) => updater(prev.map(sanitizeConversation).filter((c): c is Conversation => c !== null)));
  }
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [folderFilter, setFolderFilter] = useState<ConversationFolder | 'all' | 'pinned' | 'archived' | 'deleted'>('all');

  const active = useMemo(() => conversations.find((c) => c.id === activeId) ?? null, [conversations, activeId]);

  const visible = useMemo(() => {
    let list = conversations.filter((c) => (folderFilter === 'deleted' ? c.deletedAt !== null : c.deletedAt === null));
    if (folderFilter === 'pinned') list = list.filter((c) => c.pinned);
    else if (folderFilter === 'archived') list = list.filter((c) => c.archived);
    else if (folderFilter !== 'all' && folderFilter !== 'deleted') list = list.filter((c) => c.folder === folderFilter && !c.archived);
    else if (folderFilter === 'all') list = list.filter((c) => !c.archived);

    list = [...list].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt));

    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((c) => c.title.toLowerCase().includes(q) || c.messages.some((m) => m.content.toLowerCase().includes(q)));
  }, [conversations, search, folderFilter]);

  function createConversation(folder: ConversationFolder = 'general'): string {
    const conv = newConversation(defaultProviderId, folder);
    setConversations((prev) => [conv, ...prev]);
    setActiveId(conv.id);
    return conv.id;
  }

  function renameConversation(id: string, title: string) {
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title, updatedAt: new Date().toISOString() } : c)));
  }

  function setFolder(id: string, folder: ConversationFolder) {
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, folder, updatedAt: new Date().toISOString() } : c)));
  }

  function togglePin(id: string) {
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c)));
  }

  function toggleArchive(id: string) {
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, archived: !c.archived } : c)));
  }

  /** Soft-delete: moves the conversation to the Deleted view. Use permanentlyDelete to remove it for good. */
  function deleteConversation(id: string) {
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, deletedAt: new Date().toISOString() } : c)));
    if (activeId === id) setActiveId(null);
  }

  function restoreConversation(id: string) {
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, deletedAt: null } : c)));
  }

  function permanentlyDelete(id: string) {
    const target = conversations.find((c) => c.id === id);
    target?.messages.forEach(revokeMessageBlobUrls);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) setActiveId(null);
  }

  /** Soft-deletes every non-deleted conversation (moves them all to Trash, same as
   *  deleteConversation) rather than permanently erasing history in one action —
   *  consistent with the rest of this hook treating delete as reversible by default. */
  function clearAllConversations() {
    const now = new Date().toISOString();
    setConversations((prev) => prev.map((c) => (c.deletedAt ? c : { ...c, deletedAt: now })));
    setActiveId(null);
  }

  function duplicateConversation(id: string): string | null {
    const source = conversations.find((c) => c.id === id);
    if (!source) return null;
    const now = new Date().toISOString();
    const copy: Conversation = {
      ...source,
      id: crypto.randomUUID(),
      title: `${source.title} (copy)`,
      messages: source.messages.map((m) => ({ ...m, id: crypto.randomUUID() })),
      pinned: false,
      createdAt: now,
      updatedAt: now,
    };
    setConversations((prev) => [copy, ...prev]);
    return copy.id;
  }

  /** Imports a conversation previously produced by "Export chat" (JSON format). Always creates
   *  a fresh copy — never overwrites existing data. The file is untrusted input (it may have
   *  been hand-edited, come from another user, or simply be an older/malformed export), so
   *  every field actually used elsewhere is normalized here rather than passed through as-is:
   *  `role` is validated against the known set (an unrecognized role would otherwise render
   *  with no matching bubble style), and `createdAt` is validated as a real, parseable
   *  timestamp — a missing/malformed one would otherwise throw inside mergeConversations'
   *  `.localeCompare` sort the first time this imported conversation is merged with another. */
  function importConversation(data: unknown): string | null {
    if (!data || typeof data !== 'object') return null;
    const raw = data as Partial<Conversation>;
    if (!Array.isArray(raw.messages)) return null;
    const now = new Date().toISOString();
    const imported: Conversation = {
      id: crypto.randomUUID(),
      title: typeof raw.title === 'string' && raw.title.trim() ? `${raw.title} (imported)` : 'Imported conversation',
      messages: raw.messages
        .filter((m): m is ChatMessage => Boolean(m) && typeof m === 'object' && typeof (m as ChatMessage).content === 'string')
        .map((m) => {
          const validCreatedAt = typeof m.createdAt === 'string' && !isNaN(Date.parse(m.createdAt)) ? m.createdAt : now;
          const validRole = VALID_ROLES.includes(m.role) ? m.role : 'assistant';
          return { ...m, id: crypto.randomUUID(), role: validRole, createdAt: validCreatedAt, isStreaming: false, attachments: sanitizeAttachments(m.attachments) };
        }),
      providerId: defaultProviderId,
      folder: 'general',
      pinned: false,
      archived: false,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    setConversations((prev) => [imported, ...prev]);
    setActiveId(imported.id);
    return imported.id;
  }

  function mergeConversations(ids: string[], newTitle: string): string | null {
    const toMerge = conversations.filter((c) => ids.includes(c.id));
    if (toMerge.length < 2) return null;
    const sorted = [...toMerge].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const now = new Date().toISOString();
    const merged: Conversation = {
      id: crypto.randomUUID(),
      title: newTitle || `Merged: ${sorted.map((c) => c.title).join(' + ')}`,
      messages: sorted.flatMap((c) => c.messages).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
      providerId: sorted[0].providerId,
      folder: sorted[0].folder,
      pinned: false,
      archived: false,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    setConversations((prev) => [merged, ...prev.filter((c) => !ids.includes(c.id))]);
    setActiveId(merged.id);
    return merged.id;
  }

  function appendMessage(id: string, message: ChatMessage) {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const isFirstUserMessage = c.messages.length === 0 && message.role === 'user';
        return {
          ...c,
          messages: [...c.messages, message],
          title: isFirstUserMessage ? message.content.slice(0, 48) : c.title,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }

  /** `meta` deliberately includes the PHASE 2 completion fields (finishReason/continuable/
   *  manualContinuations) alongside the pre-existing ones — every caller that finalizes a
   *  message (send/continue/retry/edit-regenerate) now persists an honest completion signal
   *  through this same single function, rather than some call sites setting it and others not. */
  function updateMessage(
    conversationId: string,
    messageId: string,
    content: string,
    isStreaming: boolean,
    meta?: { generationMs?: number; modelUsed?: string; isError?: boolean; finishReason?: ChatMessage['finishReason']; continuable?: boolean; manualContinuations?: number }
  ) {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? { ...c, messages: c.messages.map((m) => (m.id === messageId ? { ...m, content, isStreaming, ...meta } : m)), updatedAt: new Date().toISOString() }
          : c
      )
    );
  }

  /** PHASE 2.1 — shared by editMessageAndTruncate and deleteMessagesFrom: removes every
   *  message at/after `fromIndex` from `conv`, revoking blob URLs for all of them (same
   *  cleanup discipline as deleteMessage/clearContext/permanentlyDelete). Returns only the
   *  KEPT messages — callers append whatever replaces the discarded ones themselves. */
  function truncateMessagesFrom(conv: Conversation, fromIndex: number): ChatMessage[] {
    conv.messages.slice(fromIndex).forEach(revokeMessageBlobUrls);
    return conv.messages.slice(0, fromIndex);
  }

  /** PHASE 2 — real edit semantics for a USER message: updates its text AND discards every
   *  message that came after it (the stale downstream answers an edited request would
   *  otherwise leave behind). Attachments on the edited message itself are left completely
   *  untouched (only `content` changes), so a re-sent image/PDF question keeps working exactly
   *  as it did before the edit. PHASE 2.1: callers must only invoke this AFTER validating the
   *  edit can actually be sent (size/capability checks) — see AiAssistantPage.editAndRegenerate,
   *  which now runs those checks against a candidate history built from the WOULD-BE edit
   *  before ever calling this, specifically so a rejected edit can no longer destroy
   *  conversation history for nothing (see AiAssistantPage's own doc comment on that function).
   *  Returns the updated message list synchronously so the caller can build the next provider
   *  request from it immediately, without waiting on a re-render to read `active` back out. */
  function editMessageAndTruncate(conversationId: string, messageId: string, content: string): ChatMessage[] | null {
    const conv = conversations.find((c) => c.id === conversationId);
    if (!conv) return null;
    const idx = conv.messages.findIndex((m) => m.id === messageId);
    if (idx === -1) return null;
    const kept = truncateMessagesFrom(conv, idx + 1);
    const truncated = [...kept, { ...conv.messages[idx], content }];
    setConversations((prev) => prev.map((c) => (c.id === conversationId ? { ...c, messages: truncated, updatedAt: new Date().toISOString() } : c)));
    return truncated;
  }

  /** PHASE 2.1 — removes a target message AND everything after it (e.g. a trailing
   *  "Switched to ..." system notice that described that specific, now-being-replaced
   *  attempt), so Retry always regenerates from a clean slate instead of leaving a stale
   *  notice about the answer it just replaced. Same blob-URL cleanup discipline as every other
   *  mutator in this hook. Returns the resulting (kept) message list, or null if not found —
   *  see AiAssistantPage.retryLast, the only caller. */
  function deleteMessagesFrom(conversationId: string, messageId: string): ChatMessage[] | null {
    const conv = conversations.find((c) => c.id === conversationId);
    if (!conv) return null;
    const idx = conv.messages.findIndex((m) => m.id === messageId);
    if (idx === -1) return null;
    const kept = truncateMessagesFrom(conv, idx);
    setConversations((prev) => prev.map((c) => (c.id === conversationId ? { ...c, messages: kept, updatedAt: new Date().toISOString() } : c)));
    return kept;
  }

  function deleteMessage(conversationId: string, messageId: string) {
    const conv = conversations.find((c) => c.id === conversationId);
    const target = conv?.messages.find((m) => m.id === messageId);
    if (target) revokeMessageBlobUrls(target);
    setConversations((prev) => prev.map((c) => (c.id === conversationId ? { ...c, messages: c.messages.filter((m) => m.id !== messageId) } : c)));
  }

  function togglePinMessage(conversationId: string, messageId: string) {
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, messages: c.messages.map((m) => (m.id === messageId ? { ...m, pinned: !m.pinned } : m)) } : c))
    );
  }

  function clearContext(conversationId: string) {
    const conv = conversations.find((c) => c.id === conversationId);
    conv?.messages.filter((m) => !m.pinned).forEach(revokeMessageBlobUrls);
    setConversations((prev) => prev.map((c) => (c.id === conversationId ? { ...c, messages: c.messages.filter((m) => m.pinned) } : c)));
  }

  return {
    conversations: visible,
    allConversations: conversations,
    active,
    activeId,
    setActiveId,
    search,
    setSearch,
    folderFilter,
    setFolderFilter,
    createConversation,
    renameConversation,
    setFolder,
    togglePin,
    toggleArchive,
    deleteConversation,
    restoreConversation,
    permanentlyDelete,
    clearAllConversations,
    duplicateConversation,
    importConversation,
    mergeConversations,
    appendMessage,
    updateMessage,
    editMessageAndTruncate,
    deleteMessagesFrom,
    deleteMessage,
    togglePinMessage,
    clearContext,
  };
}
