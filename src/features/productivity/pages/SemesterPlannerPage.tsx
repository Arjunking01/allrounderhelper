import { useMemo, useState } from 'react';
import { CalendarRange as SemesterIcon, RefreshCw, CheckCircle2 } from 'lucide-react';
import { ProductivityToolLayout } from '@/components/ProductivityToolLayout';
import { Card, SoftCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { clsx } from '@/lib/utils/clsx';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { getProductivityToolBySlug } from '@/data/productivityRegistry';
import { weeksBetween, type SemesterPlan, type SemesterWeek } from '../logic/semesterPlannerTypes';
import type { ToolArticleContent } from '@/components/ToolArticle';

const tool = getProductivityToolBySlug('semester-planner')!;

const article: ToolArticleContent = {
  intro:
    'Semester Planner takes your semester start and end dates and automatically generates a week-by-week plan, with space to set a weekly focus for each week of the term.',
  whyItMatters:
    'A semester is long enough that it\u2019s easy to lose track of where you are in it. Breaking it into weeks with a stated focus for each turns a vague multi-month stretch into a sequence of manageable chunks.',
  howItWorks: [
    'Enter your semester start and end dates.',
    'Click to generate the plan \u2014 the tool works out how many weeks fall between the two dates and creates one entry per week.',
    'Set a focus or goal for each week \u2014 a short note describing what that week is for.',
    'Mark a week complete as you move through the term to see how far through the plan you are.',
    'If your dates change, update them and regenerate \u2014 existing weekly focuses and completion marks are kept where the week numbers still line up.',
  ],
  examples: [
    { title: 'Term overview', body: 'Set a broad focus for early weeks (building foundations) and a narrower focus for weeks near exams (targeted revision).' },
    { title: 'Mid-semester check-in', body: 'Look at how many weeks are marked complete versus how many remain to get an honest sense of pacing before it\u2019s too late to adjust.' },
  ],
  mistakes: [
    'Setting the plan once at the start of term and never revisiting it as priorities shift.',
    'Leaving weekly focuses too vague to actually guide that week\u2019s work \u2014 naming the specific topic or task works better than something generic.',
    'Forgetting to mark weeks complete, which makes the progress view less useful for judging where you actually are.',
  ],
  tips: [
    'Combine this with the Study Planner for the weekly session-level detail underneath each week\u2019s focus.',
    'Write next week\u2019s focus a little in advance, at the start of the current week, so you\u2019re never starting a week without a plan for it.',
    'Use a consistent short label for recurring types of weeks (like "revision" or "break") so the plan is easy to scan at a glance.',
  ],
  faqs: [
    { question: 'What if my semester dates change?', answer: 'You can update the start and end dates at any time and regenerate the week-by-week breakdown to match.' },
    { question: 'Does it account for breaks or holidays?', answer: 'The breakdown is a straight week-by-week split between your dates \u2014 it doesn\u2019t detect holidays automatically, but you can leave a week\u2019s focus blank or label it "break" for any week off.' },
    { question: 'Is my plan saved if I close the browser?', answer: 'Yes \u2014 everything is saved automatically to this device, so it\u2019s there when you come back.' },
    { question: 'Can I plan more than one semester at a time?', answer: 'The planner holds one active plan at a time \u2014 generating a new date range replaces the current week breakdown.' },
  ],
  related: [
    { label: 'Study Planner', href: '/productivity/study-planner' },
    { label: 'Exam Countdown', href: '/productivity/exam-countdown' },
  ],
};

const EMPTY_PLAN: SemesterPlan = { startDate: '', endDate: '', weeks: [] };

export default function SemesterPlannerPage() {
  const [plan, setPlan] = useLocalStorage<SemesterPlan>('ar-semester-planner', EMPTY_PLAN);
  const [startDate, setStartDate] = useState(plan.startDate);
  const [endDate, setEndDate] = useState(plan.endDate);

  const weekCount = useMemo(() => weeksBetween(startDate, endDate), [startDate, endDate]);

  function generateWeeks() {
    if (weekCount === 0) return;
    const weeks: SemesterWeek[] = Array.from({ length: weekCount }, (_, i) => {
      const existing = plan.weeks[i];
      return existing ?? { id: crypto.randomUUID(), weekNumber: i + 1, focus: '', completed: false };
    });
    setPlan({ startDate, endDate, weeks });
  }

  function updateFocus(id: string, focus: string) {
    setPlan((prev) => ({ ...prev, weeks: prev.weeks.map((w) => (w.id === id ? { ...w, focus } : w)) }));
  }

  function toggleComplete(id: string) {
    setPlan((prev) => ({ ...prev, weeks: prev.weeks.map((w) => (w.id === id ? { ...w, completed: !w.completed } : w)) }));
  }

  const completedWeeks = plan.weeks.filter((w) => w.completed).length;
  const progress = plan.weeks.length ? (completedWeeks / plan.weeks.length) * 100 : 0;

  return (
    <ProductivityToolLayout
      toolName={tool.name} tagline={tool.tagline} description={tool.description}
      path="/productivity/semester-planner" icon={SemesterIcon} breadcrumb={{ label: 'Semester Planner' }}
article={article}
    >
      <Card>
        <div className="flex flex-wrap items-end gap-3 mb-6">
          <label className="text-sm">Semester start
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 rounded-lg border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-3 py-2 outline-none focus:border-electric-500 block" />
          </label>
          <label className="text-sm">Semester end
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 rounded-lg border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-3 py-2 outline-none focus:border-electric-500 block" />
          </label>
          <Button icon={<RefreshCw size={14} />} onClick={generateWeeks} disabled={weekCount === 0}>
            Generate {weekCount > 0 ? `${weekCount} weeks` : ''}
          </Button>
        </div>

        {plan.weeks.length === 0 ? (
          <EmptyState icon={SemesterIcon} title="No semester plan yet" description="Set a start and end date, then generate your week-by-week plan." />
        ) : (
          <>
            <SoftCard className="mb-5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 sm:justify-between">
              <p className="text-sm text-navy-600 dark:text-ink-300">{completedWeeks} of {plan.weeks.length} weeks complete</p>
              <div className="h-1.5 w-full sm:w-40 rounded-full bg-navy-100 dark:bg-white/10 overflow-hidden">
                <div className="h-full gradient-brand transition-all" style={{ width: `${progress}%` }} />
              </div>
            </SoftCard>

            <div className="space-y-2">
              {plan.weeks.map((week) => (
                <div key={week.id} className="flex items-center gap-3 rounded-xl border border-navy-100 dark:border-white/10 px-4 py-2.5">
                  <span className="text-xs font-semibold text-navy-400 dark:text-ink-500 w-14 shrink-0">Week {week.weekNumber}</span>
                  <input
                    type="text"
                    placeholder="Focus for this week..."
                    value={week.focus}
                    onChange={(e) => updateFocus(week.id, e.target.value)}
                    className={clsx('flex-1 bg-transparent outline-none focus:ring-2 focus:ring-electric-500/20 rounded text-sm', week.completed && 'line-through text-navy-400 dark:text-ink-500')}
                  />
                  <button onClick={() => toggleComplete(week.id)} aria-label="Toggle week complete" className={clsx('flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2', week.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-navy-300 dark:border-white/20')}>
                    {week.completed && <CheckCircle2 size={13} />}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
    </ProductivityToolLayout>
  );
}
