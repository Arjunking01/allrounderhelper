import { useMemo, useState } from 'react';
import { Search, ChevronUp, ChevronDown, X } from 'lucide-react';
import type { Conversation } from '../logic/aiTypes';

interface Props {
  conversation: Conversation | null;
  onJump: (messageId: string) => void;
  onClose: () => void;
}

export function ChatSearchBar({ conversation, onJump, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);

  const matches = useMemo(() => {
    if (!conversation || !query.trim()) return [];
    const q = query.toLowerCase();
    return conversation.messages.filter((m) => m.content.toLowerCase().includes(q));
  }, [conversation, query]);

  function go(dir: 1 | -1) {
    if (matches.length === 0) return;
    const next = (index + dir + matches.length) % matches.length;
    setIndex(next);
    onJump(matches[next].id);
  }

  function onQueryChange(v: string) {
    setQuery(v);
    setIndex(0);
  }

  return (
    <div className="flex items-center gap-2 border-b border-navy-100 dark:border-white/10 px-4 py-2.5 bg-white dark:bg-navy-900">
      <Search size={14} className="text-navy-400 shrink-0" />
      <input
        autoFocus
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') go(e.shiftKey ? -1 : 1);
          if (e.key === 'Escape') onClose();
        }}
        placeholder="Search this conversation..."
        aria-label="Search conversation"
        className="flex-1 bg-transparent outline-none focus:ring-2 focus:ring-electric-500/20 rounded text-sm"
      />
      {query.trim() && <span className="text-xs text-navy-400 shrink-0">{matches.length > 0 ? `${index + 1}/${matches.length}` : '0 results'}</span>}
      <button onClick={() => go(-1)} disabled={matches.length === 0} aria-label="Previous match" className="p-1 rounded text-navy-400 hover:text-electric-500 disabled:opacity-30">
        <ChevronUp size={14} />
      </button>
      <button onClick={() => go(1)} disabled={matches.length === 0} aria-label="Next match" className="p-1 rounded text-navy-400 hover:text-electric-500 disabled:opacity-30">
        <ChevronDown size={14} />
      </button>
      <button onClick={onClose} aria-label="Close search" className="p-1 rounded text-navy-400 hover:text-red-500">
        <X size={14} />
      </button>
    </div>
  );
}
