import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, AlertTriangle, CalendarClock, Flame, BookOpenCheck, CalendarRange, Focus, PartyPopper } from 'lucide-react';
import { ProductivityToolLayout } from '@/components/ProductivityToolLayout';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { getProductivityToolBySlug } from '@/data/productivityRegistry';
import { usePlanMyDay, type PlanItem } from '../logic/planMyDay';
import type { ToolArticleContent } from '@/components/ToolArticle';

const tool = getProductivityToolBySlug('plan-my-day')!;

const article: ToolArticleContent = {
  intro:
    'Plan My Day pulls together what\u2019s overdue, what\u2019s due today, which habits are still unchecked, and which study sessions or weekly-schedule items are set for today \u2014 from every tool on this site \u2014 into one answer to "what should I do today?" instead of making you check each tool separately.',
  whyItMatters:
    'A to-do list, a calendar, a habit tracker, and a study planner are each useful on their own, but none of them individually answers "what should I actually do right now?" \u2014 that answer only exists once everything is looked at together, in one place, ranked by urgency.',
  howItWorks: [
    'Overdue items (from To-Do, Assignment Tracker, Exam Countdown, Goal Tracker, and Daily Planner) are shown first.',
    'Items due today from those same tools come next.',
    'Habits not yet checked off today, and study sessions or Weekly Planner items scheduled for today, follow.',
    'Nothing is entered here directly \u2014 tapping an item takes you to the tool that owns it. Tapping the small focus icon next to an item instead opens Focus Mode with that item\u2019s name pre-filled as the session label.',
  ],
  examples: [
    { title: 'Morning check-in', body: 'Open Plan My Day first thing \u2014 it\u2019s the fastest way to see anything overdue before starting on today\u2019s items.' },
  ],
  mistakes: [
    'Treating this as a separate to-do list \u2014 it only ever reflects what\u2019s already entered in To-Do, Calendar-tracked tools, Habit Tracker, and Study Planner. Add or complete items in those tools; this page just brings them together.',
  ],
  tips: [
    'If a section is empty, that part of today is genuinely clear \u2014 not that the tool has no data.',
  ],
  faqs: [
    { question: 'Can I add tasks directly here?', answer: 'No \u2014 Plan My Day is read-only. Add or edit items in To-Do, Goal Tracker, Habit Tracker, or Study Planner, and they\u2019ll appear here automatically.' },
    { question: 'Does this include my Semester Planner?', answer: 'Not yet \u2014 Semester Planner tracks week-level focus areas rather than specific daily items, so it isn\u2019t included in this daily view. To-Do, Assignment Tracker, Exam Countdown, Goal Tracker, Daily Planner, Habit Tracker, Study Planner, and Weekly Planner are all included.' },
  ],
  related: [
    { label: 'Calendar', href: '/productivity/calendar' },
    { label: 'Daily Routine', href: '/productivity/daily-routine' },
    { label: 'Focus Mode', href: '/productivity/focus-mode' },
  ],
};

function PlanRow({ item, tone }: { item: PlanItem; tone: 'overdue' | 'default' }) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-navy-100 dark:border-white/10 hover:bg-navy-50 dark:hover:bg-white/5 transition-colors">
      <Link to={item.path} className="flex flex-1 min-w-0 items-center gap-3 px-4 py-3">
        <span className={`h-2 w-2 shrink-0 rounded-full ${item.sourceDot}`} />
        <span className="flex-1 min-w-0">
          <span className={`block truncate text-sm font-medium ${tone === 'overdue' ? 'text-red-600 dark:text-red-400' : 'text-navy-800 dark:text-ink-100'}`}>
            {item.title}
          </span>
        </span>
        {item.time && <span className="text-xs font-mono text-navy-400 dark:text-ink-500 shrink-0">{item.time}</span>}
        <span className="text-[10px] uppercase tracking-wide text-navy-400 dark:text-ink-500 shrink-0">{item.sourceLabel}</span>
      </Link>
      <Link
        to={`/productivity/focus-mode?task=${encodeURIComponent(item.title)}`}
        title={`Start a focus session for "${item.title}"`}
        aria-label={`Start a focus session for ${item.title}`}
        className="shrink-0 flex h-9 w-9 items-center justify-center mr-1.5 rounded-lg text-navy-400 dark:text-ink-500 hover:text-electric-500 hover:bg-electric-500/10 transition-colors"
      >
        <Focus size={16} />
      </Link>
    </div>
  );
}

function Section({ title, icon: Icon, items, tone = 'default' }: { title: string; icon: typeof Sparkles; items: PlanItem[]; tone?: 'overdue' | 'default' }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h2 className="flex items-center gap-2 text-sm font-semibold text-navy-700 dark:text-ink-200 mb-3">
        <Icon size={16} className={tone === 'overdue' ? 'text-red-500' : 'text-electric-500'} />
        {title}
        <span className="text-navy-400 dark:text-ink-500 font-normal">({items.length})</span>
      </h2>
      <div className="space-y-2">
        {items.map((item) => (
          <PlanRow key={item.id} item={item} tone={tone} />
        ))}
      </div>
    </div>
  );
}

export default function PlanMyDayPage() {
  const plan = usePlanMyDay();

  return (
    <ProductivityToolLayout
      toolName={tool.name}
      tagline={tool.tagline}
      description={tool.description}
      path="/productivity/plan-my-day"
      icon={tool.icon}
      breadcrumb={{ label: tool.name }}
      article={article}
    >
      <Card className="space-y-8">
        {plan.allCaughtUp ? (
          <div>
            <EmptyState
              icon={PartyPopper}
              title="You're all caught up"
              description="Nothing overdue, nothing due today, every habit checked off, and no study sessions or weekly items scheduled today. Enjoy the clear day."
            />
            <div className="flex flex-wrap justify-center gap-2">
              <Link to="/productivity/todo-list" className="inline-flex items-center rounded-lg border border-navy-200 dark:border-white/15 text-navy-900 dark:text-ink-100 hover:bg-navy-50 dark:hover:bg-white/5 text-sm font-semibold px-3 py-1.5 transition-colors">
                Add a task
              </Link>
              <Link to="/productivity/study-planner" className="inline-flex items-center rounded-lg border border-navy-200 dark:border-white/15 text-navy-900 dark:text-ink-100 hover:bg-navy-50 dark:hover:bg-white/5 text-sm font-semibold px-3 py-1.5 transition-colors">
                Plan a study session
              </Link>
              <Link to="/productivity/focus-mode" className="inline-flex items-center rounded-lg bg-navy-900 text-white dark:bg-white dark:text-navy-900 hover:opacity-90 text-sm font-semibold px-3 py-1.5 transition-opacity">
                Start Focus Mode
              </Link>
            </div>
          </div>
        ) : (
          <>
            <Section title="Overdue" icon={AlertTriangle} items={plan.overdue} tone="overdue" />
            <Section title="Due today" icon={CalendarClock} items={plan.dueToday} />
            <Section title="Study sessions today" icon={BookOpenCheck} items={plan.studyToday} />
            <Section title="On your weekly schedule today" icon={CalendarRange} items={plan.weeklyToday} />
            <Section title="Habits to check off today" icon={Flame} items={plan.habitsToday} />

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="flex items-center justify-between gap-4 rounded-xl border border-electric-200 dark:border-electric-500/20 bg-electric-50/50 dark:bg-electric-500/5 px-4 py-3"
            >
              <p className="text-sm text-navy-600 dark:text-ink-300 flex items-center gap-2">
                <Focus size={16} className="text-electric-500 shrink-0" />
                Ready to work through today's list without distractions?
              </p>
              <Link
                to="/productivity/focus-mode"
                className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-navy-900 text-white dark:bg-white dark:text-navy-900 hover:opacity-90 text-sm font-semibold px-3 py-1.5 transition-opacity"
              >
                Start Focus Mode
              </Link>
            </motion.div>
          </>
        )}
      </Card>
    </ProductivityToolLayout>
  );
}
