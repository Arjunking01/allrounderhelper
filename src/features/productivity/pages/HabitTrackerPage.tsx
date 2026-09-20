import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Flame, Plus, Trash2 } from 'lucide-react';
import { ProductivityToolLayout } from '@/components/ProductivityToolLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { clsx } from '@/lib/utils/clsx';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { getProductivityToolBySlug } from '@/data/productivityRegistry';
import { HABIT_COLORS, currentStreak, bestStreak, completionRate, missedYesterday, dateKey, type Habit } from '../logic/habitTypes';
import type { ToolArticleContent } from '@/components/ToolArticle';

const tool = getProductivityToolBySlug('habit-tracker')!;

const article: ToolArticleContent = {
  intro:
    'The Habit Tracker lets you check off daily habits, see a 35-day history at a glance, and track your current and best streaks for each one. It\u2019s built for habits you want to repeat consistently — like reading, exercise, or a daily study block — rather than one-off tasks.',
  whyItMatters:
    'Streak-based tracking works because it makes consistency visible. A single missed day feels different when you can see a 20-day streak next to it versus when there\u2019s no record at all — that visibility is often what keeps a habit going past the first couple of weeks.',
  howItWorks: [
    'Add a habit with a name and color.',
    'Each day, tap the habit to mark it complete for that day.',
    'The 35-day grid shows your recent history at a glance, color-coded by habit.',
    'Current streak counts consecutive completed days up to today; best streak is your longest run ever for that habit.',
    'A completion rate is calculated from your full history, so occasional gaps don\u2019t erase past progress.',
  ],
  examples: [
    {
      title: 'Daily study habit',
      body: 'Track "30 minutes of revision" every day during exam season to build a consistent study routine rather than cramming.',
    },
    {
      title: 'Physical habits',
      body: 'Track something simple like "10-minute walk" or "stretch" — habits are easier to sustain when the bar to check them off is low.',
    },
  ],
  mistakes: [
    'Adding too many habits at once — three or four consistently tracked habits beat ten that get abandoned within a week.',
    'Treating a broken streak as a reason to quit entirely — the best streak is saved separately, so one missed day doesn\u2019t erase your progress.',
    'Choosing habits that are too vague to check off honestly, like "be productive" instead of a specific, repeatable action.',
  ],
  tips: [
    'Pick habits you can realistically do every day, even a smaller version of them, rather than an ideal version you\u2019ll skip when busy.',
    'Use distinct colors per habit so the 35-day grid stays easy to read once you\u2019re tracking several.',
    'Check the "missed yesterday" signal early in the day — catching a gap quickly makes it easier to get back on track.',
  ],
  faqs: [
    {
      question: 'What happens if I miss a day?',
      answer: 'Your current streak resets, but your best streak and full completion history stay saved — missing a day doesn\u2019t erase past progress.',
    },
    {
      question: 'Can I track a habit that isn\u2019t daily, like twice a week?',
      answer: 'The tracker is built around daily check-ins; for a habit with a specific weekly schedule, the Weekly Planner may fit better.',
    },
    {
      question: 'Is my habit data private?',
      answer: 'Yes — it\u2019s stored only in your browser\u2019s local storage on this device and isn\u2019t sent anywhere.',
    },
  ],
  related: [
    { label: 'Goal Tracker', href: '/productivity/goal-tracker' },
    { label: 'Pomodoro Timer', href: '/productivity/pomodoro-timer' },
    { label: 'Focus Mode', href: '/productivity/focus-mode' },
    { label: 'Daily Planner', href: '/productivity/daily-planner' },
  ],
};

function last35Days(): Date[] {
  return Array.from({ length: 35 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (34 - i));
    return d;
  });
}

function lastNDays(n: number): Date[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    return d;
  });
}

export default function HabitTrackerPage() {
  const [habits, setHabits] = useLocalStorage<Habit[]>('ar-habits', []);
  const [name, setName] = useState('');
  const addingRef = useRef(false);
  const week = useMemo(() => lastNDays(7), []);
  const month = useMemo(() => last35Days(), []);

  // Releases the add-guard only once the new habit has actually committed \u2014 not on a fixed
  // delay \u2014 so a second rapid trigger is blocked for the whole real race window.
  useEffect(() => {
    addingRef.current = false;
  }, [habits]);

  function addHabit() {
    // Guard against a rapid double-click/double-Enter creating two identical habits: `name`
    // is read from this closure and setName('') is an async state update, so a second
    // invocation firing before that clear commits would still see the same non-empty name.
    // The ref stays locked until the actual commit (see the effect below), which closes the
    // race regardless of how close together the two triggers land \u2014 not a timing guess.
    if (addingRef.current) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    addingRef.current = true;
    const habit: Habit = { id: crypto.randomUUID(), name: trimmed, color: HABIT_COLORS[habits.length % HABIT_COLORS.length], createdAt: new Date().toISOString(), completions: {} };
    setHabits((prev) => [...prev, habit]);
    setName('');
  }

  function toggleDay(habitId: string, key: string) {
    setHabits((prev) =>
      prev.map((h) => (h.id === habitId ? { ...h, completions: { ...h.completions, [key]: !h.completions[key] } } : h))
    );
  }

  function removeHabit(id: string) {
    setHabits((prev) => prev.filter((h) => h.id !== id));
  }

  return (
    <ProductivityToolLayout
      toolName={tool.name}
      tagline={tool.tagline}
      description={tool.description}
      path="/productivity/habit-tracker"
      icon={Flame}
      breadcrumb={{ label: 'Habit Tracker' }}
      article={article}
    >
      <Card>
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="Add a habit, e.g. Read for 20 minutes"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addHabit()}
            className="flex-1 rounded-xl border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-4 py-2.5 outline-none focus:border-electric-500 focus:ring-2 focus:ring-electric-500/20"
          />
          <Button icon={<Plus size={16} />} onClick={addHabit}>Add</Button>
        </div>

        {habits.length === 0 ? (
          <EmptyState icon={Flame} title="Start your first habit" description="Create your first habit and start building a better version of yourself, one day at a time." />
        ) : (
          <div className="space-y-8">
            <AnimatePresence initial={false}>
            {habits.map((habit) => (
              <motion.div
                key={habit.id}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: habit.color }} />
                    <span className="font-medium">{habit.name}</span>
                    <span className="text-xs text-navy-500 dark:text-ink-500 rounded-full bg-navy-50 dark:bg-white/5 px-2 py-0.5">
                      🔥 {currentStreak(habit)} day streak
                    </span>
                    <span className="text-xs text-navy-500 dark:text-ink-500 rounded-full bg-navy-50 dark:bg-white/5 px-2 py-0.5">
                      🏆 Best {bestStreak(habit)}
                    </span>
                    {missedYesterday(habit) && (
                      <span className="text-xs text-red-500 rounded-full bg-red-500/10 px-2 py-0.5">Missed yesterday</span>
                    )}
                  </div>
                  <button onClick={() => removeHabit(habit.id)} aria-label="Remove habit" className="text-navy-400 hover:text-red-500 shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="flex gap-4 mb-3 text-xs text-navy-500 dark:text-ink-500">
                  <span>This week: <strong className="text-navy-700 dark:text-ink-300">{completionRate(habit, 7)}%</strong></span>
                  <span>This month: <strong className="text-navy-700 dark:text-ink-300">{completionRate(habit, 30)}%</strong></span>
                </div>

                {/* Weekly view */}
                <div className="flex gap-1.5 mb-3">
                  {week.map((d) => {
                    const key = dateKey(d);
                    const done = habit.completions[key];
                    return (
                      <button
                        key={key}
                        onClick={() => toggleDay(habit.id, key)}
                        aria-pressed={!!done}
                        aria-label={`${d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}, ${habit.name}, ${done ? 'completed' : 'not completed'}`}
                        className={clsx(
                          'flex-1 flex flex-col items-center gap-1 rounded-xl border py-2 text-xs transition-colors',
                          done ? 'text-white border-transparent' : 'border-navy-100 dark:border-white/10 text-navy-400 hover:border-electric-500'
                        )}
                        style={done ? { background: habit.color } : undefined}
                      >
                        <span aria-hidden="true">{d.toLocaleDateString(undefined, { weekday: 'narrow' })}</span>
                        <span aria-hidden="true">{d.getDate()}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Monthly streak heatmap */}
                <div className="grid grid-cols-[repeat(35,minmax(0,1fr))] gap-1">
                  {month.map((d) => {
                    const key = dateKey(d);
                    const done = habit.completions[key];
                    return (
                      <div
                        key={key}
                        title={key}
                        className={clsx('aspect-square rounded-sm', !done && 'bg-navy-100 dark:bg-white/10')}
                        style={done ? { background: habit.color } : undefined}
                      />
                    );
                  })}
                </div>
              </motion.div>
            ))}
            </AnimatePresence>
          </div>
        )}
      </Card>
    </ProductivityToolLayout>
  );
}
