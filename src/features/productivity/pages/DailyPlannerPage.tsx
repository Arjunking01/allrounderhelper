import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, Plus, Trash2, ChevronLeft, ChevronRight, CheckCircle2, Focus } from 'lucide-react';
import { ProductivityToolLayout } from '@/components/ProductivityToolLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { clsx } from '@/lib/utils/clsx';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { getProductivityToolBySlug } from '@/data/productivityRegistry';
import { todayKey, type DailyPlanItem, type DailyPlanStore } from '../logic/dailyPlannerTypes';
import type { ToolArticleContent } from '@/components/ToolArticle';

const tool = getProductivityToolBySlug('daily-planner')!;

const article: ToolArticleContent = {
  intro:
    'Daily Planner time-blocks a single day, hour by hour, so you can plan exactly when each task happens rather than just what needs to get done. You can browse forward or back to plan ahead or review a past day.',
  whyItMatters:
    'A task list tells you what to do; a time-blocked plan tells you when. Assigning a time slot to a task makes it far more likely to actually happen, since it now competes for a specific part of the day rather than "sometime today."',
  howItWorks: [
    'Pick a date \u2014 today by default, or browse to another day.',
    'Add time-blocked items across the day.',
    'Mark items complete as you finish them and track daily completion.',
    'Tap the focus icon next to any item to start a Focus Mode session with that item\u2019s name pre-filled.',
    'Browse back to previous days to review how a day actually went.',
  ],
  examples: [
    { title: 'Exam day prep', body: 'Time-block revision sessions with fixed breaks the day before an exam so the schedule stays realistic and not just a wish list.' },
    { title: 'A day with unpredictable gaps', body: 'Between classes, leave 15\u201330 minute unlabeled blocks rather than scheduling back-to-back tasks \u2014 those gaps absorb the small overruns that time-blocking otherwise makes visible as failures, so the plan survives contact with an actual day.' },
  ],
  mistakes: [
    'Filling every minute with no buffer time \u2014 leave gaps for things that take longer than expected.',
    'Planning the day after it\u2019s already half over, losing the benefit of blocking time in advance.',
    'Treating an unfinished time block as a failure rather than moving it forward \u2014 the point is visibility, not a perfect completion record.',
  ],
  tips: [
    'Plan the next day the night before so you start it already knowing the shape of it.',
    'Use the Weekly Planner for the bigger picture and this tool for the day\u2019s specifics.',
    'Pair a time block with the Pomodoro Timer or Focus Mode to actually run the session, not just schedule it.',
  ],
  faqs: [
    { question: 'Can I plan future days in advance?', answer: 'Yes \u2014 browse forward to any date and add time-blocked items ahead of time.' },
    { question: 'What happens to unfinished items at the end of the day?', answer: 'They stay marked incomplete on that day\u2019s plan \u2014 you can review and re-add them to a future day if they still need doing.' },
    { question: 'Can I see how a previous day actually went?', answer: 'Yes \u2014 browse back to any past date to review what was planned and what got marked complete.' },
  ],
  related: [
    { label: 'Weekly Planner', href: '/productivity/weekly-planner' },
    { label: 'Daily Routine', href: '/productivity/daily-routine' },
    { label: 'Focus Mode', href: '/productivity/focus-mode' },
  ],
};

function addDays(key: string, delta: number): string {
  const d = new Date(key);
  d.setDate(d.getDate() + delta);
  return todayKey(d);
}

export default function DailyPlannerPage() {
  const [store, setStore] = useLocalStorage<DailyPlanStore>('ar-daily-planner', {});
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [time, setTime] = useState('09:00');
  const [title, setTitle] = useState('');

  const items = useMemo(() => (store[selectedDate] ?? []).sort((a, b) => a.time.localeCompare(b.time)), [store, selectedDate]);
  const completedCount = items.filter((i) => i.done).length;

  function addItem() {
    if (!title.trim()) return;
    const item: DailyPlanItem = { id: crypto.randomUUID(), time, title: title.trim(), done: false };
    setStore((prev) => ({ ...prev, [selectedDate]: [...(prev[selectedDate] ?? []), item] }));
    setTitle('');
  }

  function toggleDone(id: string) {
    setStore((prev) => ({ ...prev, [selectedDate]: (prev[selectedDate] ?? []).map((i) => (i.id === id ? { ...i, done: !i.done } : i)) }));
  }

  function removeItem(id: string) {
    setStore((prev) => ({ ...prev, [selectedDate]: (prev[selectedDate] ?? []).filter((i) => i.id !== id) }));
  }

  const isToday = selectedDate === todayKey();
  const dateLabel = new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <ProductivityToolLayout
      toolName={tool.name} tagline={tool.tagline} description={tool.description}
      path="/productivity/daily-planner" icon={CalendarDays} breadcrumb={{ label: 'Daily Planner' }}
article={article}
    >
      <Card>
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setSelectedDate((d) => addDays(d, -1))} aria-label="Previous day" className="flex h-9 w-9 items-center justify-center rounded-full border border-navy-200 dark:border-white/10 hover:border-electric-500">
            <ChevronLeft size={16} />
          </button>
          <div className="text-center">
            <p className="font-semibold">{dateLabel}</p>
            {!isToday && <button onClick={() => setSelectedDate(todayKey())} className="text-xs text-electric-500 hover:underline">Back to today</button>}
          </div>
          <button onClick={() => setSelectedDate((d) => addDays(d, 1))} aria-label="Next day" className="flex h-9 w-9 items-center justify-center rounded-full border border-navy-200 dark:border-white/10 hover:border-electric-500">
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-28 rounded-xl border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-3 py-2.5 text-sm outline-none focus:border-electric-500" />
          <input
            type="text" placeholder="Add a plan item..." value={title} onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
            className="flex-1 rounded-xl border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-4 py-2.5 outline-none focus:border-electric-500 focus:ring-2 focus:ring-electric-500/20"
          />
          <Button icon={<Plus size={16} />} onClick={addItem}>Add</Button>
        </div>

        {items.length === 0 ? (
          <EmptyState icon={CalendarDays} title="Nothing planned" description="Add a time-blocked item to start planning this day." />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <p className="text-sm text-navy-500 dark:text-ink-500">{completedCount} of {items.length} complete</p>
              <div className="h-1.5 w-full sm:w-32 rounded-full bg-navy-100 dark:bg-white/10 overflow-hidden">
                <div className="h-full gradient-brand transition-all" style={{ width: `${items.length ? (completedCount / items.length) * 100 : 0}%` }} />
              </div>
            </div>
            <ul className="space-y-2">
              <AnimatePresence initial={false}>
                {items.map((item) => (
                  <motion.li
                    key={item.id}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className="flex items-center gap-3 rounded-xl border border-navy-100 dark:border-white/10 px-4 py-2.5"
                  >
                    <span className="text-xs font-mono text-navy-400 dark:text-ink-500 w-12 shrink-0">{item.time}</span>
                    <button onClick={() => toggleDone(item.id)} aria-label="Toggle complete" className={clsx('flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2', item.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-navy-300 dark:border-white/20')}>
                      {item.done && <CheckCircle2 size={12} />}
                    </button>
                    <span className={clsx('flex-1 min-w-0 break-words text-sm', item.done && 'line-through text-navy-400 dark:text-ink-500')}>{item.title}</span>
                    <Link
                      to={`/productivity/focus-mode?task=${encodeURIComponent(item.title)}`}
                      title={`Start a focus session for "${item.title}"`}
                      aria-label={`Start a focus session for ${item.title}`}
                      className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg text-navy-400 dark:text-ink-500 hover:text-electric-500 hover:bg-electric-500/10 transition-colors"
                    >
                      <Focus size={14} />
                    </Link>
                    <button onClick={() => removeItem(item.id)} aria-label="Remove item" className="text-navy-400 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </>
        )}
      </Card>
    </ProductivityToolLayout>
  );
}
