import { useState } from 'react';
import { Plus, Search, Trash2, Pencil, Check, X, MessageSquare, Pin, Archive, Copy, RotateCcw } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { clsx } from '@/lib/utils/clsx';
import type { Conversation, ConversationFolder } from '../logic/aiTypes';
import { FOLDER_LABELS } from '../logic/aiTypes';
import { conversationStats } from '../logic/useConversations';

type FilterKey = 'all' | 'pinned' | 'archived' | 'deleted' | ConversationFolder;

interface ChatSidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  search: string;
  onSearchChange: (value: string) => void;
  folderFilter: FilterKey;
  onFolderFilterChange: (f: FilterKey) => void;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onToggleArchive: (id: string) => void;
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onClearAll?: () => void;
}

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pinned', label: 'Pinned' },
  { key: 'academic', label: 'Academic' },
  { key: 'coding', label: 'Coding' },
  { key: 'math', label: 'Math' },
  { key: 'personal', label: 'Personal' },
  { key: 'archived', label: 'Archived' },
  { key: 'deleted', label: 'Deleted' },
];

export function ChatSidebar({
  conversations, activeId, search, onSearchChange, folderFilter, onFolderFilterChange,
  onSelect, onCreate, onRename, onDelete, onTogglePin, onToggleArchive, onRestore, onPermanentDelete, onDuplicate, onClearAll,
}: ChatSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const isDeletedView = folderFilter === 'deleted';

  function startRename(c: Conversation) {
    setEditingId(c.id);
    setEditValue(c.title);
  }

  function commitRename() {
    if (editingId && editValue.trim()) onRename(editingId, editValue.trim());
    setEditingId(null);
  }

  return (
    <div className="flex flex-col h-full">
      <button onClick={onCreate} className="flex items-center gap-2 rounded-xl gradient-brand text-white font-medium px-3.5 py-2.5 text-sm mb-3 shrink-0">
        <Plus size={15} /> New chat
      </button>

      <div className="relative mb-2 shrink-0">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
        <input
          type="text" placeholder="Search title, message, code..." value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 pl-8 pr-3 py-2 text-sm outline-none focus:border-electric-500"
          aria-label="Search conversations"
        />
      </div>

      <div className="flex flex-wrap gap-1 mb-3 shrink-0">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => onFolderFilterChange(f.key)}
            className={clsx('px-2 py-1 rounded-md text-[11px] font-medium', folderFilter === f.key ? 'bg-electric-500/10 text-electric-500' : 'text-navy-500 dark:text-ink-400 hover:bg-navy-50 dark:hover:bg-white/5')}
          >
            {f.label}
          </button>
        ))}
        {folderFilter === 'all' && onClearAll && conversations.length > 0 && (
          <button
            onClick={onClearAll}
            className="ml-auto px-2 py-1 rounded-md text-[11px] font-medium text-red-500/80 hover:bg-red-500/10 hover:text-red-500"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-1">
        {conversations.length === 0 ? (
          <EmptyState icon={MessageSquare} title="No conversations" description="Start a new chat to see it here." />
        ) : (
          conversations.map((c) => {
            const stats = conversationStats(c);
            return (
              <div
                key={c.id}
                role={editingId === c.id ? undefined : 'button'}
                tabIndex={editingId === c.id ? undefined : 0}
                aria-current={activeId === c.id ? 'true' : undefined}
                aria-label={editingId === c.id ? undefined : `Open conversation: ${c.title}`}
                className={clsx('group rounded-xl px-3 py-2.5 cursor-pointer transition-colors', activeId === c.id ? 'bg-electric-500/10 text-electric-600 dark:text-electric-400' : 'hover:bg-navy-50 dark:hover:bg-white/5')}
                onClick={() => editingId !== c.id && onSelect(c.id)}
                onKeyDown={(e) => {
                  if (editingId === c.id) return;
                  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(c.id); }
                }}
              >
                {editingId === c.id ? (
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <input autoFocus aria-label="Conversation name" value={editValue} onChange={(e) => setEditValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && commitRename()} className="flex-1 min-w-0 rounded-lg border border-electric-500 bg-white dark:bg-navy-900 px-2 py-1 text-sm outline-none" />
                    <button onClick={commitRename} aria-label="Save name" className="p-1 text-emerald-500"><Check size={14} /></button>
                    <button onClick={() => setEditingId(null)} aria-label="Cancel rename" className="p-1 text-navy-400"><X size={14} /></button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <span className="min-w-0 flex-1 text-sm font-medium truncate flex items-center gap-1">
                        {c.pinned && <Pin size={10} className="text-amber-500 shrink-0" />}
                        {c.title}
                      </span>
                      <div className="flex sm:hidden sm:group-hover:flex sm:group-focus-within:flex items-center gap-0.5 shrink-0">
                        {isDeletedView ? (
                          <>
                            <button onClick={(e) => { e.stopPropagation(); onRestore(c.id); }} aria-label="Restore conversation" className="p-1 rounded text-navy-400 hover:text-emerald-500"><RotateCcw size={12} /></button>
                            <button onClick={(e) => { e.stopPropagation(); onPermanentDelete(c.id); }} aria-label="Delete permanently" className="p-1 rounded text-navy-400 hover:text-red-500"><Trash2 size={12} /></button>
                          </>
                        ) : (
                          <>
                            <button onClick={(e) => { e.stopPropagation(); onTogglePin(c.id); }} aria-label={c.pinned ? 'Unpin' : 'Pin'} className="p-1 rounded text-navy-400 hover:text-amber-500"><Pin size={12} /></button>
                            <button onClick={(e) => { e.stopPropagation(); onDuplicate(c.id); }} aria-label="Duplicate conversation" className="p-1 rounded text-navy-400 hover:text-electric-500"><Copy size={12} /></button>
                            <button onClick={(e) => { e.stopPropagation(); onToggleArchive(c.id); }} aria-label={c.archived ? 'Unarchive' : 'Archive'} className="p-1 rounded text-navy-400 hover:text-violet-500"><Archive size={12} /></button>
                            <button onClick={(e) => { e.stopPropagation(); startRename(c); }} aria-label="Rename conversation" className="p-1 rounded text-navy-400 hover:text-electric-500"><Pencil size={12} /></button>
                            <button onClick={(e) => { e.stopPropagation(); onDelete(c.id); }} aria-label="Delete conversation" className="p-1 rounded text-navy-400 hover:text-red-500"><Trash2 size={12} /></button>
                          </>
                        )}
                      </div>
                    </div>
                    <p className="text-[10px] text-navy-400 dark:text-ink-500 mt-0.5">
                      {FOLDER_LABELS[c.folder]} · {stats.messageCount} msgs · ~{stats.estimatedTokens} tok · {new Date(c.updatedAt).toLocaleDateString()}
                    </p>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
