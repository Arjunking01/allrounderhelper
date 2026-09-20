import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Target, Plus, Trash2 } from 'lucide-react';
import { ProductivityToolLayout } from '@/components/ProductivityToolLayout';
import { Card, SoftCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { clsx } from '@/lib/utils/clsx';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { getProductivityToolBySlug } from '@/data/productivityRegistry';
import { GOAL_CATEGORIES, type Goal, type GoalType } from '../logic/goalTypes';
import type { ToolArticleContent } from '@/components/ToolArticle';

const tool = getProductivityToolBySlug('goal-tracker')!;

const article: ToolArticleContent = {
  intro:
    'Goal Tracker helps you set short-term and long-term goals with deadlines and categories, then track progress toward each one over time.',
  whyItMatters:
    'Goals without a deadline or a way to track progress tend to stay vague intentions. Writing a goal down with a target date and checking in on progress makes it far more likely to actually get done.',
  howItWorks: [
    'Create a goal with a title, category, and target deadline.',
    'Choose whether it\u2019s a short-term or long-term goal.',
    'Update progress as you work toward it.',
    'Review active and completed goals by category.',
  ],
  examples: [
    { title: 'Short-term goal', body: 'Finish a specific project or reach a target score on a practice test within the next two weeks.' },
    { title: 'Long-term goal', body: 'Track a semester-long goal like maintaining a target CGPA, updating progress after each exam.' },
  ],
  mistakes: [
    'Setting goals with no deadline \u2014 an open-ended goal is easy to keep postponing indefinitely.',
    'Setting too many long-term goals at once, which spreads focus thin.',
  ],
  tips: [
    'Break a large long-term goal into a few short-term goals that build toward it.',
    'Revisit goals weekly rather than only when the deadline is near.',
  ],
  faqs: [
    { question: 'What\u2019s the difference between a goal here and a task in the To-Do List?', answer: 'Goals are meant for larger, longer-running objectives with progress tracking, while the To-Do List is better suited to discrete, completable tasks.' },
    { question: 'Can I categorize goals by subject or area of life?', answer: 'Yes \u2014 each goal can be assigned a category so you can group and filter related goals together.' },
    { question: 'How is progress actually tracked?', answer: 'Each goal has a manual progress slider from 0\u2013100% \u2014 you update it yourself as you make progress, rather than the tool inferring it from sub-tasks. It\u2019s marked complete automatically once the slider reaches 100%.' },
  ],
  related: [
    { label: 'Habit Tracker', href: '/productivity/habit-tracker' },
    { label: 'Semester Planner', href: '/productivity/semester-planner' },
  ],
};

function emptyDraft() {
  return { title: '', category: GOAL_CATEGORIES[0], type: 'short-term' as GoalType, deadline: '' };
}

export default function GoalTrackerPage() {
  const [goals, setGoals] = useLocalStorage<Goal[]>('ar-goals', []);
  const [tab, setTab] = useState<GoalType | 'all'>('all');
  const [draft, setDraft] = useState(emptyDraft());
  const [formOpen, setFormOpen] = useState(false);

  const filtered = useMemo(() => (tab === 'all' ? goals : goals.filter((g) => g.type === tab)), [goals, tab]);

  function addGoal() {
    if (!draft.title.trim()) return;
    const goal: Goal = { id: crypto.randomUUID(), ...draft, title: draft.title.trim(), progress: 0, completed: false, createdAt: new Date().toISOString() };
    setGoals((prev) => [goal, ...prev]);
    setDraft(emptyDraft());
    setFormOpen(false);
  }

  function updateProgress(id: string, progress: number) {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, progress, completed: progress >= 100 } : g)));
  }

  function removeGoal(id: string) {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }

  return (
    <ProductivityToolLayout
      toolName={tool.name}
      tagline={tool.tagline}
      description={tool.description}
      path="/productivity/goal-tracker"
      icon={Target}
      breadcrumb={{ label: 'Goal Tracker' }}
article={article}
      headerActions={<Button icon={<Plus size={16} />} onClick={() => setFormOpen((v) => !v)}>New goal</Button>}
    >
      <Card>
        <div className="flex gap-1 rounded-xl bg-navy-50 dark:bg-white/5 p-1 w-fit mb-5">
          {(['all', 'short-term', 'long-term'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={clsx(
                'px-3.5 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors',
                tab === t ? 'bg-white dark:bg-navy-800 text-electric-500 shadow-sm' : 'text-navy-500 dark:text-ink-400'
              )}
            >
              {t.replace('-', ' ')}
            </button>
          ))}
        </div>

        {formOpen && (
          <SoftCard className="mb-5">
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                autoFocus type="text" placeholder="Goal title" value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                className="sm:col-span-2 rounded-xl border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-4 py-2.5 outline-none focus:border-electric-500 focus:ring-2 focus:ring-electric-500/20"
              />
              <select value={draft.category} onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))} className="rounded-xl border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-4 py-2.5 outline-none focus:border-electric-500">
                {GOAL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={draft.type} onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value as GoalType }))} className="rounded-xl border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-4 py-2.5 outline-none focus:border-electric-500">
                <option value="short-term">Short-term</option>
                <option value="long-term">Long-term</option>
              </select>
              <input type="date" value={draft.deadline} onChange={(e) => setDraft((d) => ({ ...d, deadline: e.target.value }))} className="rounded-xl border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-4 py-2.5 outline-none focus:border-electric-500" />
            </div>
            <div className="flex gap-2 mt-4">
              <Button size="sm" onClick={addGoal}>Add goal</Button>
              <Button size="sm" variant="ghost" onClick={() => setFormOpen(false)}>Cancel</Button>
            </div>
          </SoftCard>
        )}

        {filtered.length === 0 ? (
          <EmptyState icon={Target} title="No goals here yet" description="Set a short or long-term goal to start tracking progress." />
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            <AnimatePresence initial={false}>
            {filtered.map((goal) => (
              <motion.div
                key={goal.id}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.2 }}
              >
              <SoftCard>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className={clsx('font-medium', goal.completed && 'text-emerald-500')}>{goal.title}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-[11px] text-navy-500 dark:text-ink-500 rounded-full bg-navy-100 dark:bg-white/5 px-2 py-0.5">{goal.category}</span>
                      <span className="text-[11px] text-navy-500 dark:text-ink-500 capitalize">{goal.type.replace('-', ' ')}</span>
                      {goal.deadline && <span className="text-[11px] text-navy-500 dark:text-ink-500">Due {new Date(goal.deadline).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <button onClick={() => removeGoal(goal.id)} aria-label="Remove goal" className="text-navy-400 hover:text-red-500 shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>
                <input type="range" min={0} max={100} value={goal.progress} onChange={(e) => updateProgress(goal.id, Number(e.target.value))} className="w-full accent-electric-500" />
                <span className="text-xs text-navy-500 dark:text-ink-500">{goal.progress}% complete{goal.completed && ' · 🎉 Done'}</span>
              </SoftCard>
              </motion.div>
            ))}
            </AnimatePresence>
          </div>
        )}
      </Card>
    </ProductivityToolLayout>
  );
}
