import { useEffect, useMemo, useRef, useState } from 'react';
import { Hourglass, Plus, Trash2, Bell, BellOff } from 'lucide-react';
import { ProductivityToolLayout } from '@/components/ProductivityToolLayout';
import { Card, SoftCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { clsx } from '@/lib/utils/clsx';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { getProductivityToolBySlug } from '@/data/productivityRegistry';
import { daysRemaining, type CountdownExam, type ExamPriority } from '../logic/examCountdownTypes';
import type { ToolArticleContent } from '@/components/ToolArticle';

const tool = getProductivityToolBySlug('exam-countdown')!;

const article: ToolArticleContent = {
  intro:
    'Exam Countdown tracks every upcoming exam with a live countdown, a priority level, and an optional browser notification, so you always know exactly how much time is left.',
  whyItMatters:
    'Exam dates can feel abstract weeks in advance and suddenly urgent days before. A live, visible countdown keeps the real time remaining in view the whole time, not just when it\u2019s almost too late.',
  howItWorks: [
    'Add an exam with its subject, date, and a priority level.',
    'The countdown updates live, showing days (and hours as the date gets close) remaining.',
    'Enable browser notifications if you want a reminder as the exam approaches.',
    'Track multiple exams at once, sorted by how soon they are.',
  ],
  examples: [
    { title: 'Exam season overview', body: 'Add every exam for the term at once so you can immediately see which is soonest and prioritize study time accordingly.' },
    { title: 'Mixed priority list', body: 'A high-priority exam three weeks out and a low-priority quiz in two days can both need attention — sort by date first to catch the near-term one, then use priority to decide where your remaining study hours go once the immediate deadline is handled.' },
  ],
  mistakes: [
    'Adding exams only a few days before they happen \u2014 add them as soon as dates are announced so the countdown is useful from the start.',
    'Ignoring lower-priority exams until the countdown is nearly zero.',
    'Expecting to edit an exam\u2019s date in place \u2014 there\u2019s no edit option, so if a date changes, remove the old entry and add a new one with the correct date.',
  ],
  tips: [
    'Set priority based on both how soon the exam is and how much preparation it needs, not date alone.',
    'Pair with the Study Planner to turn the time shown here into an actual weekly study schedule.',
    'If an exam date is rescheduled, delete and re-add it rather than trying to find an edit option \u2014 the list always sorts itself by date automatically.',
  ],
  faqs: [
    { question: 'Do I need to allow notifications for this to work?', answer: 'No \u2014 the countdown itself works without notifications; browser notifications are an optional reminder sent the day before each exam.' },
    { question: 'Can I edit an exam date after adding it?', answer: 'No \u2014 there\u2019s no edit option. If a date changes, remove the entry and add it again with the new date; the list re-sorts automatically.' },
    { question: 'How are exams ordered in the list?', answer: 'Always by date, soonest first \u2014 priority level is shown as a label but doesn\u2019t change the sort order, so a low-priority exam that\u2019s sooner still appears above a high-priority one further out.' },
  ],
  related: [
    { label: 'Study Planner', href: '/productivity/study-planner' },
    { label: 'Semester Planner', href: '/productivity/semester-planner' },
    { label: 'Study Hours Calculator', href: '/academic-tools/study-hours-calculator' },
  ],
};

const PRIORITY_STYLES: Record<ExamPriority, string> = {
  low: 'bg-emerald-500/10 text-emerald-500',
  medium: 'bg-violet-500/10 text-violet-500',
  high: 'bg-red-500/10 text-red-500',
};

function emptyDraft() {
  return { name: '', subject: '', date: '', priority: 'medium' as ExamPriority };
}

export default function ExamCountdownPage() {
  const [exams, setExams] = useLocalStorage<CountdownExam[]>('ar-exam-countdowns', []);
  const [draft, setDraft] = useState(emptyDraft());
  const [formOpen, setFormOpen] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>('unsupported');
  const notifTimeouts = useRef(new Map<string, number>());

  useEffect(() => {
    if (typeof Notification !== 'undefined') setNotifPermission(Notification.permission);
    const timeouts = notifTimeouts.current;
    return () => {
      timeouts.forEach((id) => window.clearTimeout(id));
      timeouts.clear();
    };
  }, []);

  const sorted = useMemo(() => [...exams].sort((a, b) => a.date.localeCompare(b.date)), [exams]);

  function addExam() {
    if (!draft.name.trim() || !draft.date) return;
    const exam: CountdownExam = { id: crypto.randomUUID(), ...draft, name: draft.name.trim() };
    setExams((prev) => [...prev, exam]);

    // Notification architecture: schedule a browser notification if permission is already granted
    // and the exam is within the next 30 days. This runs entirely client-side.
    if (notifPermission === 'granted') {
      const msUntil = new Date(exam.date).getTime() - Date.now() - 24 * 60 * 60 * 1000; // 1 day before
      if (msUntil > 0 && msUntil < 30 * 24 * 60 * 60 * 1000) {
        const timeoutId = window.setTimeout(() => {
          new Notification(`Exam tomorrow: ${exam.name}`, { body: exam.subject || 'Good luck!' });
          notifTimeouts.current.delete(exam.id);
        }, msUntil);
        notifTimeouts.current.set(exam.id, timeoutId);
      }
    }

    setDraft(emptyDraft());
    setFormOpen(false);
  }

  async function requestNotifications() {
    if (typeof Notification === 'undefined') return;
    const result = await Notification.requestPermission();
    setNotifPermission(result);
  }

  function removeExam(id: string) {
    setExams((prev) => prev.filter((e) => e.id !== id));
    const timeoutId = notifTimeouts.current.get(id);
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
      notifTimeouts.current.delete(id);
    }
  }

  return (
    <ProductivityToolLayout
      toolName={tool.name}
      tagline={tool.tagline}
      description={tool.description}
      path="/productivity/exam-countdown"
      icon={Hourglass}
      breadcrumb={{ label: 'Exam Countdown' }}
article={article}
      headerActions={<Button icon={<Plus size={16} />} onClick={() => setFormOpen((v) => !v)}>Add exam</Button>}
    >
      <Card>
        {notifPermission !== 'unsupported' && (
          <SoftCard className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-navy-600 dark:text-ink-300 min-w-0">
              {notifPermission === 'granted' ? <Bell size={16} className="text-emerald-500 shrink-0" /> : <BellOff size={16} className="text-navy-400 shrink-0" />}
              {notifPermission === 'granted'
                ? 'Browser notifications are enabled — you\'ll get a reminder the day before each exam.'
                : 'Enable browser notifications to get reminders the day before an exam.'}
            </div>
            {notifPermission !== 'granted' && (
              <Button size="sm" variant="outline" onClick={requestNotifications}>Enable</Button>
            )}
          </SoftCard>
        )}

        {formOpen && (
          <SoftCard className="mb-5">
            <div className="grid sm:grid-cols-2 gap-3">
              <input autoFocus type="text" placeholder="Exam name" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} className="rounded-xl border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-4 py-2.5 outline-none focus:border-electric-500 focus:ring-2 focus:ring-electric-500/20" />
              <input type="text" placeholder="Subject" value={draft.subject} onChange={(e) => setDraft((d) => ({ ...d, subject: e.target.value }))} className="rounded-xl border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-4 py-2.5 outline-none focus:border-electric-500" />
              <input type="datetime-local" value={draft.date} onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))} className="rounded-xl border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-4 py-2.5 outline-none focus:border-electric-500" />
              <select value={draft.priority} onChange={(e) => setDraft((d) => ({ ...d, priority: e.target.value as ExamPriority }))} className="rounded-xl border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-4 py-2.5 outline-none focus:border-electric-500">
                <option value="low">Low priority</option>
                <option value="medium">Medium priority</option>
                <option value="high">High priority</option>
              </select>
            </div>
            <div className="flex gap-2 mt-4">
              <Button size="sm" onClick={addExam}>Add exam</Button>
              <Button size="sm" variant="ghost" onClick={() => setFormOpen(false)}>Cancel</Button>
            </div>
          </SoftCard>
        )}

        {sorted.length === 0 ? (
          <EmptyState icon={Hourglass} title="No exams tracked yet" description="Add an exam to see a live countdown here." />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sorted.map((exam) => {
              const days = daysRemaining(exam.date);
              return (
                <SoftCard key={exam.id} className="relative">
                  <button onClick={() => removeExam(exam.id)} aria-label="Remove exam" className="absolute top-3 right-3 text-navy-400 hover:text-red-500">
                    <Trash2 size={14} />
                  </button>
                  <span className={clsx('inline-block text-[11px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5 mb-3', PRIORITY_STYLES[exam.priority])}>
                    {exam.priority}
                  </span>
                  <p className="font-semibold">{exam.name}</p>
                  {exam.subject && <p className="text-sm text-navy-500 dark:text-ink-500">{exam.subject}</p>}
                  <p className="text-3xl font-display font-semibold text-gradient-brand mt-4">
                    {days > 0 ? `${days}d` : days === 0 ? 'Today' : 'Passed'}
                  </p>
                  <p className="text-xs text-navy-400 dark:text-ink-500 mt-1">{new Date(exam.date).toLocaleString()}</p>
                </SoftCard>
              );
            })}
          </div>
        )}
      </Card>
    </ProductivityToolLayout>
  );
}
