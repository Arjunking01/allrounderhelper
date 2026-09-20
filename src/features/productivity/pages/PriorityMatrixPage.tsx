import { useState } from 'react';
import { Grid2x2, Plus, Trash2 } from 'lucide-react';
import { ProductivityToolLayout } from '@/components/ProductivityToolLayout';
import { Card } from '@/components/ui/Card';
import { clsx } from '@/lib/utils/clsx';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { getProductivityToolBySlug } from '@/data/productivityRegistry';
import { QUADRANTS, type MatrixItem, type Quadrant } from '../logic/priorityMatrixTypes';
import type { ToolArticleContent } from '@/components/ToolArticle';

const tool = getProductivityToolBySlug('priority-matrix')!;

const article: ToolArticleContent = {
  intro:
    'Priority Matrix organizes tasks into the four-quadrant Eisenhower matrix \u2014 urgent/important, important/not urgent, urgent/not important, and neither \u2014 to help decide what to do now, schedule, delegate, or drop.',
  whyItMatters:
    'Not everything that feels urgent is actually important, and important work without a deadline is easy to keep postponing. Sorting tasks by both urgency and importance, rather than urgency alone, helps avoid spending all your time on the first and never getting to the second.',
  howItWorks: [
    'Add a task and place it into one of the four quadrants based on urgency and importance.',
    'Urgent + important: do first.',
    'Important, not urgent: schedule a specific time for it.',
    'Urgent, not important: delegate if possible, or handle quickly.',
    'Neither urgent nor important: consider dropping it.',
  ],
  examples: [
    { title: 'Exam week sorting', body: 'Place tomorrow\u2019s exam prep in "urgent + important," and a nice-to-have side project in "neither" until exams are over.' },
    { title: 'The important/not-urgent trap', body: 'Applying for a scholarship due in six weeks feels easy to postpone every single day, since nothing urgent forces it \u2014 that\u2019s exactly the "important, not urgent" quadrant the matrix is designed to protect. Scheduling one hour for it in the Weekly Planner now, while there\u2019s no pressure, avoids it becoming a last-minute urgent scramble later.' },
  ],
  mistakes: [
    'Putting everything in "urgent and important" \u2014 that quadrant should be the smallest if the sorting is honest.',
    'Never revisiting the matrix, letting items sit in "schedule" indefinitely without ever booking the time.',
    'Treating "urgent, not important" tasks (like a low-value notification or minor request) as equal to real priorities just because they feel time-pressured.',
  ],
  tips: [
    'Move important, not-urgent tasks into a specific time slot in the Weekly or Daily Planner so they actually get scheduled.',
    'Re-sort the matrix weekly \u2014 a task\u2019s quadrant shifts as its deadline gets closer, so a static one-time sort loses accuracy fast.',
  ],
  faqs: [
    { question: 'What if a task doesn\u2019t clearly fit one quadrant?', answer: 'Make your best judgment call \u2014 the value of the matrix is in forcing the comparison, not in perfect precision.' },
    { question: 'Should I move tasks between quadrants later?', answer: 'Yes \u2014 a task\u2019s urgency often changes as a deadline approaches, so revisiting the matrix periodically keeps it accurate.' },
    { question: 'What\u2019s the point of the "neither" quadrant?', answer: 'It\u2019s a deliberate place to notice low-value tasks you\u2019ve been doing out of habit, so you can consciously drop them instead of just running out of time for them.' },
  ],
  related: [
    { label: 'To-Do List', href: '/productivity/todo-list' },
    { label: 'Weekly Planner', href: '/productivity/weekly-planner' },
    { label: 'Focus Mode', href: '/productivity/focus-mode' },
  ],
};

export default function PriorityMatrixPage() {
  const [items, setItems] = useLocalStorage<MatrixItem[]>('ar-priority-matrix', []);
  const [drafts, setDrafts] = useState<Record<Quadrant, string>>({
    'urgent-important': '', 'not-urgent-important': '', 'urgent-not-important': '', 'not-urgent-not-important': '',
  });

  function addItem(quadrant: Quadrant) {
    const text = drafts[quadrant].trim();
    if (!text) return;
    setItems((prev) => [...prev, { id: crypto.randomUUID(), text, quadrant, done: false }]);
    setDrafts((prev) => ({ ...prev, [quadrant]: '' }));
  }

  function toggleDone(id: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  return (
    <ProductivityToolLayout
      toolName={tool.name} tagline={tool.tagline} description={tool.description}
      path="/productivity/priority-matrix" icon={Grid2x2} breadcrumb={{ label: 'Priority Matrix' }}
article={article}
    >
      <div className="grid sm:grid-cols-2 gap-4">
        {QUADRANTS.map((q) => {
          const quadrantItems = items.filter((i) => i.quadrant === q.key);
          return (
            <Card key={q.key} className={clsx('border-2', q.tone)}>
              <h2 className="font-semibold">{q.title}</h2>
              <p className="text-xs text-navy-500 dark:text-ink-500 mb-4">{q.subtitle}</p>

              {quadrantItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-8 px-4 text-navy-400 dark:text-ink-500">
                  <Grid2x2 size={20} className="mb-2 opacity-60" />
                  <p className="text-xs">No tasks here yet — add one below.</p>
                </div>
              ) : (
                <ul className="space-y-1.5 mb-3">
                  {quadrantItems.map((item) => (
                    <li key={item.id} className="flex items-center gap-2 rounded-lg bg-white/60 dark:bg-white/5 px-3 py-2 text-sm">
                      <input type="checkbox" checked={item.done} onChange={() => toggleDone(item.id)} className="accent-electric-500 shrink-0" />
                      <span className={clsx('flex-1 min-w-0 break-words', item.done && 'line-through text-navy-400 dark:text-ink-500')}>{item.text}</span>
                      <button onClick={() => removeItem(item.id)} aria-label="Remove" className="text-navy-400 hover:text-red-500 shrink-0">
                        <Trash2 size={13} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Add task..."
                  value={drafts[q.key]}
                  onChange={(e) => setDrafts((prev) => ({ ...prev, [q.key]: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && addItem(q.key)}
                  className="flex-1 rounded-lg border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-3 py-1.5 text-sm outline-none focus:border-electric-500"
                />
                <button onClick={() => addItem(q.key)} aria-label={`Add to ${q.title}`} className="flex h-8 w-8 items-center justify-center rounded-lg gradient-brand text-white shrink-0">
                  <Plus size={14} />
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </ProductivityToolLayout>
  );
}
