import { useEffect, useMemo, useState } from 'react';
import { StickyNote, Plus, Trash2, Pin, Search, ChevronLeft } from 'lucide-react';
import { ProductivityToolLayout } from '@/components/ProductivityToolLayout';
import { PageInfoSection } from '@/components/PageInfoSection';
import { Card, SoftCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { clsx } from '@/lib/utils/clsx';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { getProductivityToolBySlug } from '@/data/productivityRegistry';
import { NOTE_CATEGORIES, normalizeNote, type Note } from '../logic/notesTypes';
import { getTextStats } from '@/lib/utils/textStats';
import type { ToolArticleContent } from '@/components/ToolArticle';

const tool = getProductivityToolBySlug('notes')!;

const article: ToolArticleContent = {
  intro:
    'Notes is a lightweight markdown notebook that saves as you type. Every note supports categories and pinning, and a search bar makes it fast to find something again once you have more than a handful.',
  whyItMatters:
    'A quick place to write things down matters most in the moment an idea, doubt, or reminder actually occurs \u2014 in the middle of a lecture, while reading, or mid-assignment. If capturing it takes too many steps, it gets lost.',
  howItWorks: [
    'Click New Note and start typing \u2014 basic markdown formatting (headings, bold, lists) is supported.',
    'Assign a category to keep related notes together.',
    'Pin important notes so they stay at the top of the list.',
    'Use the search bar to filter notes by title or content as your collection grows.',
    'Notes save automatically to local storage as you type \u2014 there is no separate save button.',
  ],
  examples: [
    { title: 'Lecture notes', body: 'Create one note per lecture, categorized by subject, and pin the ones you\u2019re actively revising from.' },
    { title: 'Quick capture', body: 'Jot down a question or idea the moment it occurs, then organize or expand on it later.' },
  ],
  mistakes: [
    'Putting everything in one giant note \u2014 splitting by topic makes search and pinning far more useful.',
    'Never using categories, which makes long lists harder to scan once you have dozens of notes.',
  ],
  tips: [
    'Use markdown headings inside longer notes so they\u2019re easier to skim later.',
    'Pin only what you\u2019re actively working with \u2014 unpin once it\u2019s no longer urgent.',
  ],
  faqs: [
    { question: 'Does Notes support images or attachments?', answer: 'Notes is markdown text only \u2014 it does not support embedded images or file attachments.' },
    { question: 'Are my notes backed up anywhere?', answer: 'No \u2014 notes are stored only in this browser\u2019s local storage, so they don\u2019t sync across devices or survive clearing site data.' },
  ],
  related: [
    { label: 'To-Do List', href: '/productivity/todo-list' },
    { label: 'Study Planner', href: '/productivity/study-planner' },
    { label: 'OCR Text Extraction', href: '/document-tools/ocr-text-extraction' },
  ],
};

function newNote(): Note {
  return normalizeNote({ id: crypto.randomUUID() });
}

export default function NotesPage() {
  const [notes, setNotes, notesPersistError] = useLocalStorage<Note[]>('ar-notes', []);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState<Note | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  // A note holds real written content that can't be recovered once gone (no undo, no
  // trash) — a single stray tap on the trash icon (right next to Pin, both small icon
  // buttons on mobile) would otherwise destroy it instantly. Reuses the same ConfirmDialog
  // already used for irreversible actions elsewhere (AI conversation permanent-delete).
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return notes
      .filter((n) => n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt));
  }, [notes, search]);

  useEffect(() => {
    if (activeId) setDraft(notes.find((n) => n.id === activeId) ?? null);
    else setDraft(null);
    setSaveStatus('idle');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  // Auto-save with a short debounce whenever the draft actually changes.
  // Guard against re-saving (and bumping updatedAt) when a note is merely
  // opened for viewing and the draft hasn't diverged from stored content yet.
  useEffect(() => {
    if (!draft) return;
    const original = notes.find((n) => n.id === draft.id);
    const unchanged =
      original &&
      original.title === draft.title &&
      original.content === draft.content &&
      original.pinned === draft.pinned;
    if (unchanged) {
      setSaveStatus('idle');
      return;
    }
    setSaveStatus('saving');
    const timeout = setTimeout(() => {
      setNotes((prev) => prev.map((n) => (n.id === draft.id ? { ...draft, updatedAt: new Date().toISOString() } : n)));
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  // Reconcile the status shown to the student with what actually happened on disk.
  // useLocalStorage's own write effect (fired by the setNotes call above) runs before this
  // one, so by the time this runs `notesPersistError` reflects the outcome of that write —
  // only flip out of 'saving' here, so unrelated `notes` changes (create/delete/pin) don't
  // affect the currently-open note's indicator.
  useEffect(() => {
    if (saveStatus !== 'saving') return;
    setSaveStatus(notesPersistError ? 'error' : 'saved');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes, notesPersistError]);

  function createNote() {
    const note = newNote();
    setNotes((prev) => [note, ...prev]);
    setActiveId(note.id);
  }

  function deleteNote(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (activeId === id) setActiveId(null);
  }

  function togglePin(id: string) {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)));
  }

  return (
    <ProductivityToolLayout
      toolName={tool.name}
      tagline={tool.tagline}
      description={tool.description}
      path="/productivity/notes"
      icon={StickyNote}
      breadcrumb={{ label: 'Notes' }}
article={article}
      headerActions={<Button icon={<Plus size={16} />} onClick={createNote}>New note</Button>}
    >
      {/* Mobile (<lg): a single-pane master-detail — the list and editor never stack on top
          of each other. Selecting a note swaps the list out for the editor (with a Back
          button); clearing the selection swaps back. Desktop keeps both panes side by side,
          unaffected by any of this. */}
      <div className="grid lg:grid-cols-[320px_1fr] gap-5">
        <Card className={clsx('p-4 sm:p-4', activeId && 'hidden lg:block')}>
          <div className="relative mb-3">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" />
            <input
              type="text"
              aria-label="Search notes"
              placeholder="Search notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 pl-9 pr-4 py-2 text-sm outline-none focus:border-electric-500 focus:ring-2 focus:ring-electric-500/20"
            />
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon={StickyNote} title="No notes yet" description="Create your first note to see it here." />
          ) : (
            <ul className="space-y-1.5 max-h-[60vh] overflow-y-auto">
              {filtered.map((note) => (
                <li key={note.id}>
                  <button
                    onClick={() => setActiveId(note.id)}
                    className={clsx(
                      'w-full text-left rounded-xl px-3.5 py-2.5 transition-colors',
                      activeId === note.id ? 'bg-electric-500/10 text-electric-600 dark:text-electric-400' : 'hover:bg-navy-50 dark:hover:bg-white/5'
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      {note.pinned && <Pin size={11} className="text-violet-500 shrink-0" />}
                      <span className="font-medium text-sm truncate min-w-0">{note.title || 'Untitled note'}</span>
                    </div>
                    <p className="text-xs text-navy-500 dark:text-ink-500 truncate mt-0.5">{note.content || 'No content yet'}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className={clsx(!draft && 'hidden lg:block')}>
          {draft ? (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between gap-3 mb-4">
                <button
                  onClick={() => setActiveId(null)}
                  aria-label="Back to notes list"
                  className="lg:hidden -ml-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-navy-500 dark:text-ink-400 hover:bg-navy-50 dark:hover:bg-white/5"
                >
                  <ChevronLeft size={18} />
                </button>
                <input
                  type="text"
                  placeholder="Note title"
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  className="flex-1 text-xl font-semibold bg-transparent outline-none focus:ring-2 focus:ring-electric-500/20 rounded placeholder:text-navy-300 dark:placeholder:text-ink-600"
                />
                <div className="flex items-center gap-1">
                  <button onClick={() => togglePin(draft.id)} aria-label="Pin note" className={clsx('p-2 rounded-lg', draft.pinned ? 'text-violet-500 bg-violet-500/10' : 'text-navy-400 hover:bg-navy-50 dark:hover:bg-white/5')}>
                    <Pin size={16} />
                  </button>
                  <button onClick={() => setConfirmDeleteId(draft.id)} aria-label="Delete note" className="p-2 rounded-lg text-navy-400 hover:text-red-500 hover:bg-red-500/10">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <select
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                className="w-fit mb-4 rounded-lg border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-3 py-1.5 text-xs outline-none focus:border-electric-500"
              >
                {NOTE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <textarea
                placeholder="Write in markdown — **bold**, _italic_, - lists..."
                value={draft.content}
                onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                className="flex-1 min-h-[320px] w-full resize-none bg-transparent outline-none focus:ring-2 focus:ring-electric-500/20 rounded text-sm leading-relaxed text-navy-700 dark:text-ink-300 placeholder:text-navy-300 dark:placeholder:text-ink-600"
              />
              <div className="flex items-center justify-between text-xs text-navy-400 dark:text-ink-500 mt-3">
                <span>
                  {getTextStats(draft.content).words} words · {getTextStats(draft.content).readingTimeMinutes} min read
                </span>
                <span
                  className={clsx(saveStatus === 'saving' && 'text-amber-500', saveStatus === 'error' && 'text-red-500')}
                  role={saveStatus === 'error' ? 'alert' : undefined}
                >
                  {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'error' ? "Not saved — this browser's storage is full or unavailable" : 'Saved'}
                </span>
              </div>
            </div>
          ) : (
            <SoftCard className="border-dashed">
              <EmptyState icon={StickyNote} title="Select or create a note" description="Choose a note from the list, or start a new one to begin writing." />
            </SoftCard>
          )}
        </Card>
      </div>

      <PageInfoSection
        about="Notes gives you a distraction-free place for lecture notes, reading summaries, and quick ideas, organized by category and searchable by title or content. Everything is saved in your browser automatically as you type, so there's no save button to remember."
        tips={[
          'Use categories to separate note types — e.g. one per subject or one for \u201cideas\u201d vs \u201clecture notes\u201d — so the sidebar stays easy to scan.',
          'The word count and reading time under the editor update live, which is handy for keeping summaries concise.',
          'Search checks both titles and note bodies, so you can find a note even if you only remember a phrase from it.',
          'Since notes live in your browser\u2019s local storage, exporting or backing them up elsewhere is worth doing before clearing site data.',
        ]}
        faqs={[
          { question: 'Are my notes private?', answer: 'Yes. Notes are stored locally in your browser and are never sent to a server, so only you can see them on that device.' },
          { question: 'Will my notes sync across devices?', answer: 'Not currently — local storage is per-browser, per-device. Notes made on your phone won\u2019t appear on your laptop.' },
        ]}
        related={[
          { label: 'Study Planner', href: '/productivity/study-planner' },
          { label: 'To-Do List', href: '/productivity/todo-list' },
        ]}
      />

      <ConfirmDialog
        open={confirmDeleteId !== null}
        title="Delete this note?"
        description="This can't be undone — the note's content will be permanently deleted."
        confirmLabel="Delete"
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={() => {
          if (confirmDeleteId) deleteNote(confirmDeleteId);
          setConfirmDeleteId(null);
        }}
      />
    </ProductivityToolLayout>
  );
}
