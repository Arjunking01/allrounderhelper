import { useMemo, useState } from 'react';
import { FileCheck2, Plus, Trash2, Search } from 'lucide-react';
import { ProductivityToolLayout } from '@/components/ProductivityToolLayout';
import { Card, SoftCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { clsx } from '@/lib/utils/clsx';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { getProductivityToolBySlug } from '@/data/productivityRegistry';
import { STATUS_LABEL, type Assignment, type AssignmentStatus } from '../logic/assignmentTypes';
import type { ToolArticleContent } from '@/components/ToolArticle';

const tool = getProductivityToolBySlug('assignment-tracker')!;

const article: ToolArticleContent = {
  intro:
    'Assignment Tracker keeps every assignment organized by subject and due date, with a not-started, in-progress, or submitted status so you always know exactly where each one stands.',
  whyItMatters:
    'When assignments are scattered across memory, messages, and different course pages, it\u2019s easy to lose track of one. A single tracked list with status and due dates removes that risk.',
  howItWorks: [
    'Add an assignment with its subject and due date.',
    'Set its status: not started, in progress, or submitted.',
    'Search and sort assignments to find what\u2019s due soonest or still outstanding.',
    'Update status as you make progress.',
  ],
  examples: [
    { title: 'End-of-week review', body: 'Sort by due date each week to see what\u2019s coming up, and filter by "not started" to find what needs attention first.' },
    { title: 'Catching a silent pile-up', body: 'Three assignments due the same week across different courses rarely feel urgent individually when they\u2019re each announced weeks apart \u2014 but seeing all three sitting as "not started" in one filtered view makes the actual workload visible before the week they\u2019re all due.' },
  ],
  mistakes: [
    'Forgetting to update status after submitting \u2014 the tracker is only useful if it reflects reality.',
    'Adding an assignment without a due date, which makes sorting less useful.',
    'Only checking the tracker when a deadline feels close, rather than as a regular weekly review \u2014 the value is in catching a pile-up early, not just confirming what you already knew was urgent.',
  ],
  tips: [
    'Update status the moment something changes rather than batching updates later.',
    'Use subjects consistently so you can quickly filter assignments by course.',
  ],
  faqs: [
    { question: 'Can I track assignments for multiple subjects at once?', answer: 'Yes \u2014 assign each one a subject and use sorting or search to filter by course.' },
    { question: 'Can I search for a specific assignment?', answer: 'Yes \u2014 use the search bar to quickly find an assignment by name or subject instead of scrolling the full list.' },
    { question: 'Is this different from the To-Do List tool?', answer: 'Assignment Tracker is purpose-built for coursework \u2014 subject, due date, and submission status \u2014 while To-Do List is a general-purpose task list without those fields.' },
  ],
  related: [
    { label: 'To-Do List', href: '/productivity/todo-list' },
    { label: 'Exam Countdown', href: '/productivity/exam-countdown' },
    { label: 'Priority Matrix', href: '/productivity/priority-matrix' },
    { label: 'Focus Mode', href: '/productivity/focus-mode' },
  ],
};

type SortKey = 'dueDate' | 'subject' | 'status';

function emptyDraft() {
  return { title: '', subject: '', dueDate: '', status: 'not-started' as AssignmentStatus, grade: '' };
}

const STATUS_COLOR: Record<AssignmentStatus, string> = {
  'not-started': 'bg-navy-100 dark:bg-white/10 text-navy-500 dark:text-ink-400',
  'in-progress': 'bg-amber-400/10 text-amber-500',
  submitted: 'bg-emerald-500/10 text-emerald-500',
};

export default function AssignmentTrackerPage() {
  const [assignments, setAssignments] = useLocalStorage<Assignment[]>('ar-assignments', []);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('dueDate');
  const [draft, setDraft] = useState(emptyDraft());
  const [formOpen, setFormOpen] = useState(false);

  const filtered = useMemo(() => {
    return assignments
      .filter((a) => a.title.toLowerCase().includes(search.toLowerCase()) || a.subject.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        if (sortKey === 'dueDate') return (a.dueDate || '9999').localeCompare(b.dueDate || '9999');
        if (sortKey === 'subject') return a.subject.localeCompare(b.subject);
        return a.status.localeCompare(b.status);
      });
  }, [assignments, search, sortKey]);

  const submittedCount = assignments.filter((a) => a.status === 'submitted').length;

  function addAssignment() {
    if (!draft.title.trim()) return;
    const assignment: Assignment = { id: crypto.randomUUID(), ...draft, title: draft.title.trim(), createdAt: new Date().toISOString() };
    setAssignments((prev) => [assignment, ...prev]);
    setDraft(emptyDraft());
    setFormOpen(false);
  }

  function updateStatus(id: string, status: AssignmentStatus) {
    setAssignments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  }

  function updateGrade(id: string, grade: string) {
    setAssignments((prev) => prev.map((a) => (a.id === id ? { ...a, grade } : a)));
  }

  function removeAssignment(id: string) {
    setAssignments((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <ProductivityToolLayout
      toolName={tool.name} tagline={tool.tagline} description={tool.description}
      path="/productivity/assignment-tracker" icon={FileCheck2} breadcrumb={{ label: 'Assignment Tracker' }}
article={article}
      headerActions={<Button icon={<Plus size={16} />} onClick={() => setFormOpen((v) => !v)}>New assignment</Button>}
    >
      <Card>
        {assignments.length > 0 && (
          <SoftCard className="mb-5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 sm:justify-between">
            <p className="text-sm text-navy-600 dark:text-ink-300">{submittedCount} of {assignments.length} submitted</p>
            <div className="h-1.5 w-full sm:w-40 rounded-full bg-navy-100 dark:bg-white/10 overflow-hidden">
              <div className="h-full gradient-brand transition-all" style={{ width: `${assignments.length ? (submittedCount / assignments.length) * 100 : 0}%` }} />
            </div>
          </SoftCard>
        )}

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-5">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" />
            <input type="text" aria-label="Search assignments" placeholder="Search assignments..." value={search} onChange={(e) => setSearch(e.target.value)} className="rounded-xl border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 pl-9 pr-4 py-2 text-sm outline-none focus:border-electric-500 w-full sm:w-64" />
          </div>
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} className="rounded-xl border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-3 py-2 text-sm outline-none focus:border-electric-500">
            <option value="dueDate">Sort by due date</option>
            <option value="subject">Sort by subject</option>
            <option value="status">Sort by status</option>
          </select>
        </div>

        {formOpen && (
          <SoftCard className="mb-5">
            <div className="grid sm:grid-cols-2 gap-3">
              <input autoFocus type="text" placeholder="Assignment title" value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} className="sm:col-span-2 rounded-xl border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-4 py-2.5 outline-none focus:border-electric-500 focus:ring-2 focus:ring-electric-500/20" />
              <input type="text" placeholder="Subject" value={draft.subject} onChange={(e) => setDraft((d) => ({ ...d, subject: e.target.value }))} className="rounded-xl border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-4 py-2.5 outline-none focus:border-electric-500" />
              <input type="date" value={draft.dueDate} onChange={(e) => setDraft((d) => ({ ...d, dueDate: e.target.value }))} className="rounded-xl border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-4 py-2.5 outline-none focus:border-electric-500" />
              <input type="text" placeholder="Grade (optional, e.g. A- or 92%)" value={draft.grade} onChange={(e) => setDraft((d) => ({ ...d, grade: e.target.value }))} className="rounded-xl border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-4 py-2.5 outline-none focus:border-electric-500" />
            </div>
            <div className="flex gap-2 mt-4">
              <Button size="sm" onClick={addAssignment}>Add assignment</Button>
              <Button size="sm" variant="ghost" onClick={() => setFormOpen(false)}>Cancel</Button>
            </div>
          </SoftCard>
        )}

        {filtered.length === 0 ? (
          <EmptyState icon={FileCheck2} title="No assignments yet" description="Track assignment deadlines and submission status here." />
        ) : (
          <ul className="space-y-2">
            {filtered.map((a) => (
              <li key={a.id} className="flex items-center gap-3 rounded-xl border border-navy-100 dark:border-white/10 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{a.title}</p>
                  <p className="text-xs text-navy-500 dark:text-ink-500">{a.subject}{a.dueDate && ` · Due ${new Date(a.dueDate).toLocaleDateString()}`}</p>
                </div>
                <select value={a.status} onChange={(e) => updateStatus(a.id, e.target.value as AssignmentStatus)} className={clsx('rounded-lg px-2.5 py-1.5 text-xs font-medium border-0 outline-none focus:ring-2 focus:ring-electric-500/40', STATUS_COLOR[a.status])}>
                  {(Object.keys(STATUS_LABEL) as AssignmentStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </select>
                <input
                  type="text"
                  placeholder="Grade"
                  value={a.grade ?? ''}
                  onChange={(e) => updateGrade(a.id, e.target.value)}
                  className="w-20 rounded-lg border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-2 py-1.5 text-xs outline-none focus:border-electric-500 shrink-0"
                />
                <button onClick={() => removeAssignment(a.id)} aria-label="Remove assignment" className="text-navy-400 hover:text-red-500 shrink-0">
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </ProductivityToolLayout>
  );
}
