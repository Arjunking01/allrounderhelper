import { useState } from 'react';
import { CalendarDays, Plus, Trash2 } from 'lucide-react';
import { ProductivityToolLayout } from '@/components/ProductivityToolLayout';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { getProductivityToolBySlug } from '@/data/productivityRegistry';
import { WEEK_DAYS, LABEL_COLORS, type WeeklyItem } from '../logic/weeklyPlannerTypes';
import type { ToolArticleContent } from '@/components/ToolArticle';

const tool = getProductivityToolBySlug('weekly-planner')!;

const article: ToolArticleContent = {
  intro:
    'Weekly Planner lays out your whole week, Monday through Sunday, in one view \u2014 tasks and subjects with color labels, so you can see the shape of the week at a glance instead of one day at a time.',
  whyItMatters:
    'Planning day by day can miss the bigger picture \u2014 a week that looks fine on Monday can turn out overloaded by Thursday. Seeing the full week together makes it easier to balance the load before it becomes a problem.',
  howItWorks: [
    'Add tasks or subjects to any day of the week.',
    'Use color labels to distinguish categories at a glance.',
    'Review the whole week to spot days that are overloaded or empty.',
    'Everything saves automatically to this device.',
  ],
  examples: [
    { title: 'Balancing the week', body: 'Spread study sessions for different subjects across different days instead of stacking them all on one, using color labels to check the balance visually.' },
    { title: 'Spotting a hidden overload', body: 'A week can look fine day-by-day but reveal a problem only in the weekly view \u2014 e.g. three separate deadlines that individually seemed manageable all landing on Thursday. Seeing the full week together surfaces that collision early enough to start one of them on Monday instead.' },
  ],
  mistakes: [
    'Planning the week once and never adjusting it as things change mid-week.',
    'Overloading one or two days while leaving others empty.',
    'Only looking at each day in isolation instead of scanning the whole week for clustering before the week starts.',
  ],
  tips: [
    'Plan the week ahead on a fixed day, like Sunday evening, so it\u2019s ready before the week starts.',
    'Use the Daily Planner for hour-by-hour detail on your busiest days.',
    'If a day looks overloaded, move something to a lighter day rather than trying to fit more focus into less time.',
  ],
  faqs: [
    { question: 'How is this different from the Daily Planner?', answer: 'Weekly Planner shows your whole week at once for a big-picture view; Daily Planner time-blocks a single day in more detail.' },
    { question: 'Can I use color labels for different subjects?', answer: 'Yes \u2014 assign a color per subject or category so the week\u2019s balance is visible at a glance.' },
    { question: 'Does the week reset automatically?', answer: 'No \u2014 your plan for a given week stays as you left it until you edit it yourself, so you can look back at how a past week was planned.' },
  ],
  related: [
    { label: 'Daily Planner', href: '/productivity/daily-planner' },
    { label: 'Semester Planner', href: '/productivity/semester-planner' },
  ],
};

export default function WeeklyPlannerPage() {
  const [items, setItems] = useLocalStorage<WeeklyItem[]>('ar-weekly-planner', []);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [labelType, setLabelType] = useState<Record<string, 'subject' | 'task'>>({});

  function addItem(day: string) {
    const title = (drafts[day] ?? '').trim();
    if (!title) return;
    const item: WeeklyItem = {
      id: crypto.randomUUID(),
      day,
      title,
      label: labelType[day] ?? 'task',
      color: LABEL_COLORS[items.filter((i) => i.day === day).length % LABEL_COLORS.length],
    };
    setItems((prev) => [...prev, item]);
    setDrafts((prev) => ({ ...prev, [day]: '' }));
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  return (
    <ProductivityToolLayout
      toolName={tool.name}
      tagline={tool.tagline}
      description={tool.description}
      path="/productivity/weekly-planner"
      icon={CalendarDays}
      breadcrumb={{ label: 'Weekly Planner' }}
article={article}
    >
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {WEEK_DAYS.map((day) => {
            const dayItems = items.filter((i) => i.day === day);
            return (
              <div key={day} className="rounded-2xl border border-navy-100 dark:border-white/10 p-3 flex flex-col gap-2 min-h-[220px]">
                <p className="font-semibold text-sm text-center pb-2 border-b border-navy-100 dark:border-white/10">{day}</p>

                {dayItems.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <EmptyState icon={CalendarDays} title="Nothing planned" description="Add a task or subject below." />
                  </div>
                ) : (
                  <ul className="flex-1 space-y-1.5">
                    {dayItems.map((item) => (
                      <li key={item.id} className="group flex items-center justify-between gap-1.5 rounded-lg px-2.5 py-1.5 text-white text-xs" style={{ background: item.color }}>
                        <span className="truncate min-w-0">{item.title}</span>
                        <button onClick={() => removeItem(item.id)} aria-label="Remove item" className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 shrink-0">
                          <Trash2 size={12} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="space-y-1.5 pt-1">
                  <input
                    type="text"
                    placeholder="Add item..."
                    value={drafts[day] ?? ''}
                    onChange={(e) => setDrafts((prev) => ({ ...prev, [day]: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && addItem(day)}
                    className="w-full rounded-lg border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-2.5 py-1.5 text-xs outline-none focus:border-electric-500"
                  />
                  <div className="flex items-center gap-1.5">
                    <select
                      value={labelType[day] ?? 'task'}
                      onChange={(e) => setLabelType((prev) => ({ ...prev, [day]: e.target.value as 'subject' | 'task' }))}
                      className="flex-1 rounded-lg border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-2 py-1.5 text-xs outline-none focus:border-electric-500"
                    >
                      <option value="task">Task</option>
                      <option value="subject">Subject</option>
                    </select>
                    <button onClick={() => addItem(day)} aria-label={`Add to ${day}`} className="flex h-7 w-7 items-center justify-center rounded-lg gradient-brand text-white shrink-0">
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </ProductivityToolLayout>
  );
}
