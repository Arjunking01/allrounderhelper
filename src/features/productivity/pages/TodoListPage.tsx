import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckSquare, Plus, Trash2, Pencil, Search, X } from 'lucide-react';
import { ProductivityToolLayout } from '@/components/ProductivityToolLayout';
import { Card, SoftCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { clsx } from '@/lib/utils/clsx';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { getProductivityToolBySlug } from '@/data/productivityRegistry';
import { DEFAULT_CATEGORIES, type Task, type TaskPriority } from '../logic/todoTypes';
import type { ToolArticleContent } from '@/components/ToolArticle';

const tool = getProductivityToolBySlug('todo-list')!;

const article: ToolArticleContent = {
  intro:
    'This to-do list lets you capture tasks with a due date, priority, category, and notes, then filter and search through them as your list grows. Everything is saved to your browser automatically, so your tasks are there the next time you open the page.',
  whyItMatters:
    'A written task list frees up mental energy — once something is recorded with a due date and priority, you don\u2019t have to keep holding it in your head. For students juggling assignments, exams, and personal tasks at once, that alone reduces the chance of missing a deadline.',
  howItWorks: [
    'Click "New task" and fill in a title, optional notes, category, priority, and due date.',
    'Tasks appear in the list sorted by due date, with priority shown as a colored tag.',
    'Use the Active / Completed / All filters and the search box to narrow down a long list.',
    'Check a task off to mark it complete, or use the edit and delete icons to update it.',
    'Everything is stored locally in your browser — nothing is sent to a server.',
  ],
  examples: [
    {
      title: 'Assignment tracking',
      body: 'Add each assignment with its due date and course as the category, then sort by due date to see what\u2019s coming up first.',
    },
    {
      title: 'Daily errands',
      body: 'Use the "high" priority tag for anything time-sensitive today, and leave routine tasks at medium or low so they don\u2019t compete for attention.',
    },
  ],
  mistakes: [
    'Adding vague tasks like "study" instead of something actionable like "review chapter 4 notes" — specific tasks are easier to actually start.',
    'Marking everything as high priority, which defeats the purpose of having a priority field at all.',
    'Never revisiting completed tasks — filtering to "Completed" occasionally is a quick way to see real progress.',
  ],
  tips: [
    'Use categories consistently (e.g. by subject or by personal/academic) so the search and filters stay useful as the list grows.',
    'Set due dates even for tasks without a hard deadline — it keeps the list sorted in a useful order.',
    'Clear out completed tasks periodically if the list starts feeling cluttered.',
  ],
  faqs: [
    {
      question: 'Will I lose my tasks if I clear my browser cache?',
      answer: 'Yes — tasks are stored in local storage on this device only, so clearing site data or switching browsers/devices will not carry them over.',
    },
    {
      question: 'Can I set reminders for due dates?',
      answer: 'The list itself doesn\u2019t send notifications, but sorting by due date makes upcoming tasks easy to spot at a glance each time you open it.',
    },
    {
      question: 'Is there a limit to how many tasks I can add?',
      answer: 'No fixed limit — practically, local storage can comfortably hold thousands of tasks before size becomes a concern.',
    },
  ],
  related: [
    { label: 'Study Planner', href: '/productivity/study-planner' },
    { label: 'Weekly Planner', href: '/productivity/weekly-planner' },
    { label: 'Goal Tracker', href: '/productivity/goal-tracker' },
  ],
};
type Filter = 'all' | 'active' | 'completed';

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  low: 'bg-emerald-500/10 text-emerald-500',
  medium: 'bg-violet-500/10 text-violet-500',
  high: 'bg-red-500/10 text-red-500',
};

function emptyDraft(): Omit<Task, 'id' | 'createdAt' | 'completed'> {
  return { title: '', notes: '', category: DEFAULT_CATEGORIES[0], priority: 'medium', dueDate: '' };
}

export default function TodoListPage() {
  const [tasks, setTasks] = useLocalStorage<Task[]>('ar-todo-tasks', []);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyDraft());
  const [formOpen, setFormOpen] = useState(false);

  const filtered = useMemo(() => {
    return tasks
      .filter((t) => (filter === 'active' ? !t.completed : filter === 'completed' ? t.completed : true))
      .filter((t) => t.title.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'));
  }, [tasks, filter, search]);

  function openNewForm() {
    setEditingId(null);
    setDraft(emptyDraft());
    setFormOpen(true);
  }

  function openEditForm(task: Task) {
    setEditingId(task.id);
    setDraft({ title: task.title, notes: task.notes ?? '', category: task.category, priority: task.priority, dueDate: task.dueDate ?? '' });
    setFormOpen(true);
  }

  function saveTask() {
    if (!draft.title.trim()) return;
    if (editingId) {
      setTasks((prev) => prev.map((t) => (t.id === editingId ? { ...t, ...draft, title: draft.title.trim() } : t)));
    } else {
      const newTask: Task = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), completed: false, ...draft, title: draft.title.trim() };
      setTasks((prev) => [newTask, ...prev]);
    }
    setFormOpen(false);
    setEditingId(null);
    setDraft(emptyDraft());
  }

  function toggleComplete(id: string) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  }

  function deleteTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  // Edit and Delete sit right next to each other as small, always-visible (not
  // hover-revealed) icon buttons on mobile — an easy target for a mis-tap. Confirming
  // before the irreversible one (delete) costs nothing for the common case (edit) while
  // giving a way back from the accidental one. Same ConfirmDialog used for Notes/AI.
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const activeCount = tasks.filter((t) => !t.completed).length;

  return (
    <ProductivityToolLayout
      toolName={tool.name}
      tagline={tool.tagline}
      description={tool.description}
      path="/productivity/todo-list"
      icon={CheckSquare}
      breadcrumb={{ label: 'To-Do List' }}
      article={article}
      headerActions={<Button icon={<Plus size={16} />} onClick={openNewForm}>New task</Button>}
    >
      <Card>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-5">
          <div className="flex gap-1 rounded-xl bg-navy-50 dark:bg-white/5 p-1 w-fit">
            {(['all', 'active', 'completed'] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={clsx(
                  'px-3.5 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors',
                  filter === f ? 'bg-white dark:bg-navy-800 text-electric-500 shadow-sm' : 'text-navy-500 dark:text-ink-400'
                )}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" />
            <input
              type="text"
              aria-label="Search tasks"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 pl-9 pr-4 py-2 text-sm outline-none focus:border-electric-500 focus:ring-2 focus:ring-electric-500/20 w-full sm:w-56"
            />
          </div>
        </div>

        {formOpen && (
          <SoftCard className="mb-5">
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                autoFocus
                type="text"
                placeholder="Task title"
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                className="sm:col-span-2 rounded-xl border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-4 py-2.5 outline-none focus:border-electric-500 focus:ring-2 focus:ring-electric-500/20"
              />
              <select
                value={draft.category}
                onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
                className="rounded-xl border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-4 py-2.5 outline-none focus:border-electric-500"
              >
                {DEFAULT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select
                value={draft.priority}
                onChange={(e) => setDraft((d) => ({ ...d, priority: e.target.value as TaskPriority }))}
                className="rounded-xl border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-4 py-2.5 outline-none focus:border-electric-500"
              >
                <option value="low">Low priority</option>
                <option value="medium">Medium priority</option>
                <option value="high">High priority</option>
              </select>
              <input
                type="date"
                value={draft.dueDate}
                onChange={(e) => setDraft((d) => ({ ...d, dueDate: e.target.value }))}
                className="rounded-xl border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-4 py-2.5 outline-none focus:border-electric-500"
              />
              <input
                type="text"
                placeholder="Notes (optional)"
                value={draft.notes}
                onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
                className="rounded-xl border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-4 py-2.5 outline-none focus:border-electric-500"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <Button size="sm" onClick={saveTask}>{editingId ? 'Save changes' : 'Add task'}</Button>
              <Button size="sm" variant="ghost" onClick={() => { setFormOpen(false); setEditingId(null); }}>Cancel</Button>
            </div>
          </SoftCard>
        )}

        {filtered.length === 0 ? (
          <EmptyState icon={CheckSquare} title="No tasks here yet" description="Add a task to start tracking your to-dos with due dates and priorities." />
        ) : (
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
            {filtered.map((task) => (
              <motion.li
                key={task.id}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-start gap-3 rounded-xl border border-navy-100 dark:border-white/10 p-3.5 group overflow-hidden"
              >
                <button
                  onClick={() => toggleComplete(task.id)}
                  aria-label={task.completed ? 'Mark as active' : 'Mark as complete'}
                  className={clsx(
                    'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors',
                    task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-navy-300 dark:border-white/20'
                  )}
                >
                  {task.completed && <CheckSquare size={12} />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={clsx('font-medium truncate', task.completed && 'line-through text-navy-400 dark:text-ink-500')}>
                    {task.title}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span className={clsx('text-[11px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5', PRIORITY_STYLES[task.priority])}>
                      {task.priority}
                    </span>
                    <span className="text-[11px] text-navy-500 dark:text-ink-500 rounded-full bg-navy-50 dark:bg-white/5 px-2 py-0.5">
                      {task.category}
                    </span>
                    {task.dueDate && (
                      <span className="text-[11px] text-navy-500 dark:text-ink-500">Due {new Date(task.dueDate).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEditForm(task)} aria-label="Edit task" className="p-1.5 rounded-lg text-navy-400 hover:text-electric-500 hover:bg-electric-500/10">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setConfirmDeleteId(task.id)} aria-label="Delete task" className="p-1.5 rounded-lg text-navy-400 hover:text-red-500 hover:bg-red-500/10">
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.li>
            ))}
            </AnimatePresence>
          </ul>
        )}

        {tasks.length > 0 && (
          <p className="text-xs text-navy-400 dark:text-ink-500 mt-5 flex items-center gap-1">
            <X size={12} className="opacity-0" />{activeCount} active task{activeCount !== 1 ? 's' : ''} remaining
          </p>
        )}
      </Card>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        title="Delete this task?"
        description="This can't be undone."
        confirmLabel="Delete"
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={() => {
          if (confirmDeleteId) deleteTask(confirmDeleteId);
          setConfirmDeleteId(null);
        }}
      />
    </ProductivityToolLayout>
  );
}
