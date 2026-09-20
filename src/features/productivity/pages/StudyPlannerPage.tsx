import { useState } from 'react';
import { CalendarRange, Plus, Trash2 } from 'lucide-react';
import { ProductivityToolLayout } from '@/components/ProductivityToolLayout';
import { PageInfoSection } from '@/components/PageInfoSection';
import { Card, SoftCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { getProductivityToolBySlug } from '@/data/productivityRegistry';
import type { ToolArticleContent } from '@/components/ToolArticle';
import {
  DAYS, SUBJECT_COLORS, PRIORITY_META,
  type Subject, type StudySession, type ExamPlan, type StudyGoal, type SubjectPriority,
} from '../logic/studyPlannerTypes';

const tool = getProductivityToolBySlug('study-planner')!;

const article: ToolArticleContent = {
  intro:
    'Study Planner helps you organize subjects, build a weekly study schedule, and plan ahead for exams, so your study time is structured instead of decided on the fly each day.',
  whyItMatters:
    'Spreading study sessions across subjects on a set schedule is more effective than last-minute cramming, and having subjects and sessions written down makes it easier to notice one is being neglected before it becomes a problem.',
  howItWorks: [
    'Add each subject you\u2019re studying, along with any relevant details.',
    'Build a weekly schedule of study sessions per subject.',
    'Set exam prep goals tied to specific subjects and dates.',
    'Track progress against your study goals as the term goes on.',
  ],
  examples: [
    { title: 'Balanced weekly split', body: 'Assign fixed weekly sessions to every subject so none get skipped for weeks at a stretch as deadlines shift attention elsewhere.' },
    { title: 'Exam prep ramp-up', body: 'Increase session frequency for a subject in the weeks leading up to its exam while keeping light maintenance sessions for the rest.' },
    { title: 'Recovering after a missed week', body: 'If a busy week means several planned sessions get skipped, resist the urge to double every session the following week to "catch up" \u2014 instead, prioritize the one or two subjects with the nearest deadlines and let lower-priority sessions stay light until your schedule stabilizes.' },
  ],
  mistakes: [
    'Scheduling sessions for every subject only in exam week, rather than spreading study out over the term.',
    'Setting an unrealistic number of weekly sessions that gets abandoned within a few days.',
    'Overcorrecting after a missed week by cramming double sessions, which tends to cause burnout rather than catching up sustainably.',
  ],
  tips: [
    'Review and adjust your weekly schedule every couple of weeks as coursework changes.',
    'Pair this with the Exam Countdown tool so exam dates and study sessions stay aligned.',
    'Use the Pomodoro Timer or Focus Mode to actually run each planned session, rather than just tracking that a block of time exists.',
  ],
  faqs: [
    { question: 'Can I plan for multiple subjects at once?', answer: 'Yes \u2014 add as many subjects as you need and build a separate weekly schedule for each.' },
    { question: 'Is my study plan saved if I close the browser?', answer: 'Yes \u2014 it\u2019s saved to local storage on this device and will still be there next time you open the page.' },
    { question: 'What if I fall behind on my planned sessions?', answer: 'Adjust the schedule rather than abandoning it \u2014 reduce sessions for lower-priority subjects temporarily and keep the ones tied to upcoming exams, using Exam Countdown to see which subjects are most time-sensitive right now.' },
  ],
  related: [
    { label: 'Exam Countdown', href: '/productivity/exam-countdown' },
    { label: 'Semester Planner', href: '/productivity/semester-planner' },
    { label: 'Pomodoro Timer', href: '/productivity/pomodoro-timer' },
  ],
};

export default function StudyPlannerPage() {
  const [subjects, setSubjects] = useLocalStorage<Subject[]>('ar-study-subjects', []);
  const [sessions, setSessions] = useLocalStorage<StudySession[]>('ar-study-sessions', []);
  const [exams, setExams] = useLocalStorage<ExamPlan[]>('ar-study-exams', []);
  const [goals, setGoals] = useLocalStorage<StudyGoal[]>('ar-study-goals', []);

  const [subjectName, setSubjectName] = useState('');
  const [sessionDraft, setSessionDraft] = useState({ subjectId: '', day: 'Mon', startTime: '16:00', endTime: '17:00' });
  const [examDraft, setExamDraft] = useState({ subjectId: '', date: '', notes: '' });
  const [goalText, setGoalText] = useState('');

  function addSubject() {
    if (!subjectName.trim()) return;
    const subject: Subject = {
      id: crypto.randomUUID(),
      name: subjectName.trim(),
      color: SUBJECT_COLORS[subjects.length % SUBJECT_COLORS.length],
      progress: 0,
      priority: 'medium',
    };
    setSubjects((prev) => [...prev, subject]);
    setSubjectName('');
  }

  function updatePriority(id: string, priority: SubjectPriority) {
    setSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, priority } : s)));
  }

  function removeSubject(id: string) {
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    setSessions((prev) => prev.filter((s) => s.subjectId !== id));
    setExams((prev) => prev.filter((e) => e.subjectId !== id));
  }

  function updateProgress(id: string, progress: number) {
    setSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, progress } : s)));
  }

  function addSession() {
    if (!sessionDraft.subjectId) return;
    setSessions((prev) => [...prev, { id: crypto.randomUUID(), ...sessionDraft }]);
  }

  function addExam() {
    if (!examDraft.subjectId || !examDraft.date) return;
    setExams((prev) => [...prev, { id: crypto.randomUUID(), ...examDraft }].sort((a, b) => a.date.localeCompare(b.date)));
    setExamDraft({ subjectId: '', date: '', notes: '' });
  }

  function addGoal() {
    if (!goalText.trim()) return;
    setGoals((prev) => [...prev, { id: crypto.randomUUID(), text: goalText.trim(), done: false }]);
    setGoalText('');
  }

  const subjectById = (id: string) => subjects.find((s) => s.id === id);

  return (
    <ProductivityToolLayout
      toolName={tool.name}
      tagline={tool.tagline}
      description={tool.description}
      path="/productivity/study-planner"
      icon={CalendarRange}
      breadcrumb={{ label: 'Study Planner' }}
article={article}
    >
      <div className="space-y-6">
        {/* Subjects */}
        <Card>
          <h2 className="font-semibold text-lg mb-4">Subjects & progress</h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Add a subject, e.g. Organic Chemistry"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSubject()}
              className="flex-1 rounded-xl border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-4 py-2.5 outline-none focus:border-electric-500 focus:ring-2 focus:ring-electric-500/20"
            />
            <Button icon={<Plus size={16} />} onClick={addSubject}>Add</Button>
          </div>

          {subjects.length === 0 ? (
            <EmptyState icon={CalendarRange} title="No subjects yet" description="Add your first subject to start planning sessions and exams." />
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {subjects.map((s) => {
                const priority = s.priority ?? 'medium';
                return (
                <SoftCard key={s.id} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                      <span className="font-medium">{s.name}</span>
                    </div>
                    <button onClick={() => removeSubject(s.id)} aria-label="Remove subject" className="text-navy-400 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <select
                    value={priority}
                    onChange={(e) => updatePriority(s.id, e.target.value as SubjectPriority)}
                    className={`w-fit rounded-full px-2 py-0.5 text-xs font-medium outline-none focus:ring-2 focus:ring-electric-500/40 ${PRIORITY_META[priority].className}`}
                  >
                    {(Object.keys(PRIORITY_META) as SubjectPriority[]).map((p) => (
                      <option key={p} value={p}>{PRIORITY_META[p].label}</option>
                    ))}
                  </select>
                  <input
                    type="range" min={0} max={100} value={s.progress}
                    onChange={(e) => updateProgress(s.id, Number(e.target.value))}
                    className="w-full accent-electric-500"
                  />
                  <span className="text-xs text-navy-500 dark:text-ink-500">{s.progress}% covered</span>
                </SoftCard>
              );})}
            </div>
          )}
        </Card>

        {/* Weekly schedule */}
        <Card>
          <h2 className="font-semibold text-lg mb-4">Weekly schedule</h2>
          {subjects.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              <select value={sessionDraft.subjectId} onChange={(e) => setSessionDraft((d) => ({ ...d, subjectId: e.target.value }))} className="rounded-xl border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-3 py-2 text-sm outline-none focus:border-electric-500">
                <option value="">Subject</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select value={sessionDraft.day} onChange={(e) => setSessionDraft((d) => ({ ...d, day: e.target.value }))} className="rounded-xl border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-3 py-2 text-sm outline-none focus:border-electric-500">
                {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <input type="time" value={sessionDraft.startTime} onChange={(e) => setSessionDraft((d) => ({ ...d, startTime: e.target.value }))} className="rounded-xl border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-3 py-2 text-sm outline-none focus:border-electric-500" />
              <input type="time" value={sessionDraft.endTime} onChange={(e) => setSessionDraft((d) => ({ ...d, endTime: e.target.value }))} className="rounded-xl border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-3 py-2 text-sm outline-none focus:border-electric-500" />
              <Button size="sm" icon={<Plus size={14} />} onClick={addSession}>Add session</Button>
            </div>
          )}

          <div className="grid grid-cols-7 gap-2 text-xs">
            {DAYS.map((day) => (
              <div key={day} className="space-y-1.5">
                <p className="font-semibold text-center text-navy-500 dark:text-ink-400 mb-1">{day}</p>
                {sessions.filter((s) => s.day === day).map((s) => {
                  const subj = subjectById(s.subjectId);
                  return (
                    <div key={s.id} className="rounded-lg px-2 py-1.5 text-white text-[10px] leading-tight" style={{ background: subj?.color ?? '#8b3ffb' }}>
                      <p className="font-medium truncate">{subj?.name ?? 'Subject'}</p>
                      <p className="opacity-80">{s.startTime}–{s.endTime}</p>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </Card>

        {/* Exam planning */}
        <Card>
          <h2 className="font-semibold text-lg mb-4">Exam planning</h2>
          {subjects.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              <select value={examDraft.subjectId} onChange={(e) => setExamDraft((d) => ({ ...d, subjectId: e.target.value }))} className="rounded-xl border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-3 py-2 text-sm outline-none focus:border-electric-500">
                <option value="">Subject</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <input type="date" value={examDraft.date} onChange={(e) => setExamDraft((d) => ({ ...d, date: e.target.value }))} className="rounded-xl border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-3 py-2 text-sm outline-none focus:border-electric-500" />
              <input type="text" placeholder="Notes" value={examDraft.notes} onChange={(e) => setExamDraft((d) => ({ ...d, notes: e.target.value }))} className="rounded-xl border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-3 py-2 text-sm outline-none focus:border-electric-500 flex-1 min-w-[140px]" />
              <Button size="sm" icon={<Plus size={14} />} onClick={addExam}>Add exam</Button>
            </div>
          )}
          {exams.length === 0 ? (
            <EmptyState icon={CalendarRange} title="No exams planned" description="Add an exam date to see it counted down here." />
          ) : (
            <ul className="space-y-2">
              {exams.map((e) => (
                <li key={e.id} className="flex items-center justify-between rounded-xl border border-navy-100 dark:border-white/10 px-4 py-3">
                  <div>
                    <p className="font-medium text-sm">{subjectById(e.subjectId)?.name ?? 'Subject'}</p>
                    <p className="text-xs text-navy-500 dark:text-ink-500">{new Date(e.date).toLocaleDateString()} {e.notes && `· ${e.notes}`}</p>
                  </div>
                  <button onClick={() => setExams((prev) => prev.filter((x) => x.id !== e.id))} aria-label="Remove exam" className="text-navy-400 hover:text-red-500">
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Study goals */}
        <Card>
          <h2 className="font-semibold text-lg mb-4">Study goals</h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Add a study goal..."
              value={goalText}
              onChange={(e) => setGoalText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addGoal()}
              className="flex-1 rounded-xl border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-4 py-2.5 outline-none focus:border-electric-500 focus:ring-2 focus:ring-electric-500/20"
            />
            <Button size="sm" icon={<Plus size={14} />} onClick={addGoal}>Add</Button>
          </div>
          {goals.length === 0 ? (
            <EmptyState icon={CalendarRange} title="No goals set" description="Add a study goal to track alongside your schedule." />
          ) : (
            <ul className="space-y-2">
              {goals.map((g) => (
                <li key={g.id} className="flex items-center gap-3 rounded-xl border border-navy-100 dark:border-white/10 px-4 py-2.5">
                  <input
                    type="checkbox"
                    checked={g.done}
                    onChange={() => setGoals((prev) => prev.map((x) => (x.id === g.id ? { ...x, done: !x.done } : x)))}
                    className="h-4 w-4 accent-electric-500"
                  />
                  <span className={g.done ? 'flex-1 min-w-0 break-words line-through text-navy-400 dark:text-ink-500' : 'flex-1 min-w-0 break-words'}>{g.text}</span>
                  <button onClick={() => setGoals((prev) => prev.filter((x) => x.id !== g.id))} aria-label="Remove goal" className="text-navy-400 hover:text-red-500 shrink-0">
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <PageInfoSection
        about="Study Planner brings together the pieces of exam prep that usually live in separate notebooks: a subject list with progress and priority, a weekly time-block schedule, exam dates, and short-term goals. It's built for planning a study week, not just tracking hours after the fact."
        tips={[
          'Set priority (high/medium/low) on each subject so the ones that need the most attention stand out at the top of your list.',
          'Update the progress slider honestly as you cover material — it\u2019s more useful as a rough signal of what\u2019s left than a precise percentage.',
          'Block out weekly study sessions for the subjects with looming exam dates first, then fill in lighter subjects around them.',
          'Break big goals like \u201cfinish revision\u201d into a few short, checkable goals — they\u2019re easier to actually complete.',
        ]}
        faqs={[
          { question: 'Does progress update automatically as I study?', answer: 'No — you set it yourself with the slider. This keeps the planner honest to how much you\u2019ve actually covered rather than time spent.' },
          { question: 'Can I plan more than one week ahead?', answer: 'The weekly schedule repeats by day of week rather than by calendar date; for exam-specific deadlines, use the exam date field or the Semester Planner for a longer view.' },
        ]}
        related={[
          { label: 'Semester Planner', href: '/productivity/semester-planner' },
          { label: 'Exam Countdown', href: '/productivity/exam-countdown' },
          { label: 'Notes', href: '/productivity/notes' },
        ]}
      />
    </ProductivityToolLayout>
  );
}
