import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, GraduationCap, ListTodo, FileText, Palette, Sparkles, Bot, Flame, History, CalendarClock, ClipboardList, Calculator, Timer } from 'lucide-react';
import aiAvatar from '@/assets/ai-character/allrounder-ai-avatar.png';
import { Seo, SITE_URL, SITE_NAME } from '@/components/Seo';
import { Logo } from '@/components/ui/Logo';
import { WelcomeBackCard } from '@/components/WelcomeBackCard';
import { TiltCard } from '@/components/ui/TiltCard';
import { academicTools } from '@/data/toolsRegistry';
import { useRecentToolsStore } from '@/hooks/useRecentTools';
import { useProductivityInsights } from '@/hooks/useProductivityInsights';
import { faqJsonLd } from '@/components/ToolArticle';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { CountdownExam } from '@/features/productivity/logic/examCountdownTypes';
import { daysRemaining } from '@/features/productivity/logic/examCountdownTypes';
import { STATUS_LABEL, type Assignment } from '@/features/productivity/logic/assignmentTypes';

const CATEGORIES = [
  { icon: GraduationCap, title: 'Academic Tools', desc: '14 calculators for grades, attendance, and study planning.', href: '/academic-tools', live: true },
  { icon: ListTodo, title: 'Productivity', desc: 'Planners, trackers, and focus tools for daily momentum.', href: '/productivity', live: true },
  { icon: FileText, title: 'Document Tools', desc: 'Merge, compress, and convert PDFs and images.', href: '/document-tools', live: true },
  { icon: Palette, title: 'Creator Tools', desc: 'Thumbnail, title, and palette helpers for content creators.', href: '/creator-tools', live: true },
];

const PROBLEMS = [
  { icon: CalendarClock, text: 'I have exams coming up', href: '/productivity/exam-countdown' },
  { icon: ClipboardList, text: 'I have too many assignments', href: '/productivity/assignment-tracker' },
  { icon: Calculator, text: 'I need to calculate my grades', href: '/academic-tools/cgpa-calculator' },
  { icon: Timer, text: 'I can\u2019t focus right now', href: '/productivity/focus-mode' },
  { icon: FileText, text: 'I need to work with a PDF or image', href: '/document-tools' },
  { icon: Palette, text: 'I\u2019m creating content and need sizing/color tools', href: '/creator-tools' },
  { icon: Bot, text: 'I\u2019m not sure where to start', href: '/ai-assistant' },
];

const WORKFLOWS = [
  {
    title: 'Exam week',
    steps: [
      { label: 'Exam Countdown', href: '/productivity/exam-countdown' },
      { label: 'Study Planner', href: '/productivity/study-planner' },
      { label: 'Study Hours', href: '/academic-tools/study-hours-calculator' },
      { label: 'Focus Mode', href: '/productivity/focus-mode' },
      { label: 'Pomodoro Timer', href: '/productivity/pomodoro-timer' },
    ],
  },
  {
    title: 'Assignment week',
    steps: [
      { label: 'Assignment Tracker', href: '/productivity/assignment-tracker' },
      { label: 'Deadline Calculator', href: '/academic-tools/deadline-calculator' },
      { label: 'Focus Mode', href: '/productivity/focus-mode' },
      { label: 'Notes', href: '/productivity/notes' },
    ],
  },
  {
    title: 'Semester setup',
    steps: [
      { label: 'Semester Planner', href: '/productivity/semester-planner' },
      { label: 'SGPA Calculator', href: '/academic-tools/sgpa-calculator' },
      { label: 'CGPA Calculator', href: '/academic-tools/cgpa-calculator' },
      { label: 'Goal Tracker', href: '/productivity/goal-tracker' },
    ],
  },
  {
    title: 'Creator workflow',
    steps: [
      { label: 'Resolution Calculator', href: '/creator-tools/resolution-calculator' },
      { label: 'DPI Calculator', href: '/creator-tools/dpi-calculator' },
      { label: 'Thumbnail Safe Zone', href: '/creator-tools/thumbnail-safe-zone-checker' },
      { label: 'Social Media Size Guide', href: '/creator-tools/social-media-size-guide' },
    ],
  },
];

function isAssignmentOverdue(a: Assignment): boolean {
  return new Date(a.dueDate).getTime() < new Date(new Date().toDateString()).getTime();
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const homeFaqs = [
  {
    question: 'Is ALLROUNDER HELPER free to use?',
    answer: 'Yes. Every calculator, planner, document tool, and creator tool is free, with no account required. The AI Study Assistant includes a daily free-message limit.',
  },
  {
    question: 'Do I need to create an account?',
    answer: 'No. Calculators work instantly with no sign-up, and productivity tools like Notes and To-Do List save automatically to your browser on your device.',
  },
  {
    question: 'Are my documents and files uploaded to a server?',
    answer: 'Document and image tools (PDF, OCR, image conversion) process files entirely in your browser — they are never uploaded anywhere. See the Document Tools page for details on each tool.',
  },
  {
    question: 'What can the AI Study Assistant actually help with?',
    answer: 'It can explain concepts step by step, summarize text or PDFs you attach, suggest which calculator fits your question, and help draft a study plan. Like any AI tool, it can make mistakes, so verify anything important — especially exact figures or grading policies — independently.',
  },
];

export default function HomePage() {
  const [recentTools] = useRecentToolsStore();
  const { streak } = useProductivityInsights();
  const hasRecent = recentTools.length > 0;
  const [exams] = useLocalStorage<CountdownExam[]>('ar-exam-countdowns', []);
  const [assignments] = useLocalStorage<Assignment[]>('ar-assignments', []);
  const nextExam = exams
    .filter((e) => daysRemaining(e.date) >= 0)
    .sort((a, b) => daysRemaining(a.date) - daysRemaining(b.date))[0];
  const nextAssignment = assignments
    .filter((a) => a.status !== 'submitted')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];
  const hasFocusData = Boolean(nextExam || nextAssignment);

  return (
    <div className="noise-bg">
      <Seo
        title={`${SITE_NAME} — Calculators, Planners & Tools for Students`}
        description="Calculate, plan, organize, and study smarter with ALLROUNDER HELPER — free academic calculators, productivity tools, document utilities, and creator tools built for students."
        path="/"
        jsonLd={[
          { '@context': 'https://schema.org', '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
          { '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME, url: SITE_URL, potentialAction: { '@type': 'SearchAction', target: `${SITE_URL}/academic-tools?q={search_term_string}`, 'query-input': 'required name=search_term_string' } },
          faqJsonLd(homeFaqs),
        ]}
      />

      {/* Hero — trimmed mobile top/bottom padding (was pt-16/pb-20, ~equivalent to a
          quarter of a 375x667 screen before any real content) so a phone user reaches
          "What do you need today?" without a full scroll first. Desktop unchanged. */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-10 sm:pt-24 pb-10 sm:pb-20 text-center">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Logo size={56} className="mx-auto mb-4 sm:mb-5 h-14! w-14! sm:h-16! sm:w-16! drop-shadow-lg" />
          <span className="inline-flex items-center gap-1.5 rounded-full border border-navy-200 dark:border-white/10 px-3 py-1 text-xs font-medium text-navy-500 dark:text-ink-400 mb-4 sm:mb-6">
            <Sparkles size={12} className="text-electric-500" /> Built for students, from day one
          </span>
          <h1 className="text-3xl sm:text-6xl font-semibold leading-[1.1] sm:leading-[1.05] max-w-3xl mx-auto">
            Calculate. Plan. <span className="text-gradient-brand">Study smarter.</span>
          </h1>
          <p className="mt-4 sm:mt-5 text-base sm:text-lg text-navy-500 dark:text-ink-400 max-w-xl mx-auto">
            One platform for grade calculators, study planning, and the everyday tools that keep student life organized.
          </p>
          <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/academic-tools" className="inline-flex items-center gap-2 whitespace-nowrap rounded-2xl gradient-brand text-white font-semibold px-5 sm:px-6 py-3 sm:py-3.5 shadow-lg shadow-electric-500/20 hover:brightness-110 transition-all">
              Explore Academic Tools <ArrowRight size={16} />
            </Link>
            <Link to="/about" className="inline-flex items-center gap-2 whitespace-nowrap rounded-2xl border border-navy-200 dark:border-white/15 font-semibold px-5 sm:px-6 py-3 sm:py-3.5 hover:bg-navy-50 dark:hover:bg-white/5 transition-colors">
              Learn more
            </Link>
          </div>
        </motion.div>
      </section>

      {/* What do you need today? — problem-first entry point, routes verified against App.tsx */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
        <WelcomeBackCard />
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.35 }}>
          <h2 className="text-lg font-semibold mb-4">What do you need today?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PROBLEMS.map((p) => (
              <Link
                key={p.text}
                to={p.href}
                className="group flex items-center gap-3 rounded-2xl glass-panel px-4 py-3.5 hover:-translate-y-0.5 transition-transform"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-electric-500/10 text-electric-500">
                  <p.icon size={17} />
                </span>
                <span className="text-sm font-medium group-hover:text-electric-500 transition-colors">{p.text}</span>
                <ArrowRight size={14} className="ml-auto text-navy-300 dark:text-ink-600 group-hover:text-electric-500 transition-colors" />
              </Link>
            ))}
          </div>
        </motion.div>
      </section>

      {/* New here? — lightweight onboarding, shown only to visitors with no recorded activity yet */}
      {!hasRecent && (
        <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.35 }} className="rounded-2xl border border-dashed border-navy-200 dark:border-white/15 p-5 sm:p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-navy-400 dark:text-ink-500 mb-3">New here?</h2>
            <ol className="grid sm:grid-cols-3 gap-4 text-sm">
              <li className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full gradient-brand text-white text-xs font-semibold">1</span><span className="text-navy-600 dark:text-ink-300">Pick what you're trying to accomplish above</span></li>
              <li className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full gradient-brand text-white text-xs font-semibold">2</span><span className="text-navy-600 dark:text-ink-300">Use the tool it takes you to — no sign-up needed</span></li>
              <li className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full gradient-brand text-white text-xs font-semibold">3</span><span className="text-navy-600 dark:text-ink-300">Come back here — your recent tools will show up automatically</span></li>
            </ol>
          </motion.div>
        </section>
      )}

      {/* AI Assistant — deliberately its own section, not buried in the category grid */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.35 }}>
          <Link
            to="/ai-assistant"
            className="group relative flex flex-col sm:flex-row items-start sm:items-center gap-6 overflow-hidden rounded-3xl gradient-brand p-7 sm:p-9 text-white shadow-xl shadow-electric-500/20 hover:brightness-105 transition-all"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm p-2">
              <img src={aiAvatar} alt="" className="h-full w-full object-contain" />
            </div>
            <div className="flex-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide mb-2">
                <Sparkles size={11} /> AI Study Assistant
              </span>
              <h2 className="text-xl sm:text-2xl font-semibold">Not sure which tool you need?</h2>
              <p className="mt-1.5 text-sm sm:text-base text-white/90 max-w-2xl">
                Tell ALLROUNDER HELPER AI what you're dealing with — "I have exams next week and haven't started" — and it'll point you to the right tools, not the whole catalog.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-2xl bg-white text-navy-900 font-semibold px-5 py-3 shrink-0 group-hover:brightness-95 transition-all">
              Start chatting <ArrowRight size={16} />
            </span>
          </Link>
        </motion.div>
      </section>

      {/* Continue where you left off + streak — only shown once there's real local activity to reflect */}
      {hasRecent && (
        <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.35 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <History size={18} className="text-electric-500" /> Continue where you left off
              </h2>
              {streak > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 px-3 py-1 text-xs font-semibold">
                  <Flame size={13} /> {streak} day streak
                </span>
              )}
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
              {recentTools.slice(0, 6).map((tool) => (
                <Link
                  key={tool.path}
                  to={tool.path}
                  className="group flex-none w-56 rounded-2xl glass-panel p-4 hover:-translate-y-0.5 transition-transform"
                >
                  <span className="text-xs text-navy-400 dark:text-ink-500">{timeAgo(tool.timestamp)}</span>
                  <p className="mt-1 font-medium text-sm group-hover:text-electric-500 transition-colors line-clamp-2">{tool.title}</p>
                </Link>
              ))}
            </div>
          </motion.div>
        </section>
      )}

      {/* Today's focus — only real localStorage data (exam countdowns, open assignments); shown to any
          returning user (hasRecent) so a clear-for-now state is possible, not just when data exists */}
      {hasRecent && (
        <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.35 }}>
            <h2 className="text-lg font-semibold mb-4">Today's focus</h2>
            {hasFocusData ? (
            <div className="grid sm:grid-cols-2 gap-3">
              {nextExam && (
                <Link to="/productivity/exam-countdown" className="group flex items-center gap-3 rounded-2xl glass-panel px-4 py-3.5 hover:-translate-y-0.5 transition-transform">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-electric-500/10 text-electric-500">
                    <CalendarClock size={17} />
                  </span>
                  <span className="text-sm">
                    <span className="block font-medium group-hover:text-electric-500 transition-colors">
                      {daysRemaining(nextExam.date) === 0 ? 'Exam today' : `${daysRemaining(nextExam.date)} day${daysRemaining(nextExam.date) === 1 ? '' : 's'} until ${nextExam.subject}`}
                    </span>
                    <span className="text-navy-400 dark:text-ink-500">{nextExam.name}</span>
                  </span>
                </Link>
              )}
              {nextAssignment && (
                <Link to="/productivity/assignment-tracker" className="group flex items-center gap-3 rounded-2xl glass-panel px-4 py-3.5 hover:-translate-y-0.5 transition-transform">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-electric-500/10 text-electric-500">
                    <ClipboardList size={17} />
                  </span>
                  <span className="text-sm">
                    <span className="block font-medium group-hover:text-electric-500 transition-colors">
                      {isAssignmentOverdue(nextAssignment) ? `${nextAssignment.title} — overdue` : `${nextAssignment.title} due ${new Date(nextAssignment.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`}
                    </span>
                    <span className={isAssignmentOverdue(nextAssignment) ? 'text-orange-600 dark:text-orange-400 font-medium' : 'text-navy-400 dark:text-ink-500'}>
                      {isAssignmentOverdue(nextAssignment) ? `Was due ${new Date(nextAssignment.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : STATUS_LABEL[nextAssignment.status]}
                    </span>
                  </span>
                </Link>
              )}
            </div>
            ) : (
              <Link to="/productivity/study-planner" className="group flex items-center gap-3 rounded-2xl glass-panel px-4 py-3.5 hover:-translate-y-0.5 transition-transform">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                  <CalendarClock size={17} />
                </span>
                <span className="text-sm">
                  <span className="block font-medium group-hover:text-electric-500 transition-colors">You're clear for now</span>
                  <span className="text-navy-400 dark:text-ink-500">No exams or open assignments tracked — plan your next study session</span>
                </span>
              </Link>
            )}
          </motion.div>
        </section>
      )}

      {/* Study workflow chains — real problem→tool→next-step sequences, every href verified against App.tsx */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.35 }}>
          <h2 className="text-lg font-semibold mb-1">Not just tools — workflows</h2>
          <p className="text-sm text-navy-500 dark:text-ink-400 mb-4">Follow one of these sequences instead of guessing which tool comes next.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {WORKFLOWS.map((wf) => (
              <div key={wf.title} className="rounded-2xl glass-panel p-4 sm:p-5">
                <h3 className="text-sm font-semibold mb-3">{wf.title}</h3>
                <ol className="space-y-0">
                  {wf.steps.map((s, i) => (
                    <li key={s.href} className="relative pl-8">
                      {i < wf.steps.length - 1 && (
                        <span aria-hidden="true" className="absolute left-[11px] top-6 bottom-0 w-px bg-navy-200 dark:bg-white/10" />
                      )}
                      <span aria-hidden="true" className="absolute left-0 top-0.5 flex h-[22px] w-[22px] items-center justify-center rounded-full gradient-brand text-white text-[10px] font-semibold">
                        {i + 1}
                      </span>
                      <Link to={s.href} className="block pb-4 text-sm font-medium text-navy-700 dark:text-ink-200 hover:text-electric-500 transition-colors">
                        {s.label}
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-24">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORIES.map((cat, i) => (
            <motion.div key={cat.title} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.3, delay: i * 0.05 }}>
              <TiltCard to={cat.href} className="group relative flex flex-col gap-3 rounded-2xl glass-panel p-6 h-full hover:-translate-y-0.5 transition-transform">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-brand text-white">
                  <cat.icon size={20} />
                </div>
                <h3 className="font-semibold text-lg group-hover:text-electric-500 transition-colors">{cat.title}</h3>
                <p className="text-sm text-navy-500 dark:text-ink-400">{cat.desc}</p>
                {!cat.live && (
                  <span className="absolute top-5 right-5 text-[10px] font-semibold uppercase tracking-wide text-violet-500 bg-violet-500/10 rounded-full px-2 py-1">
                    Coming soon
                  </span>
                )}
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured academic tools */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-24">
        <div className="flex items-end justify-between mb-6">
          <h2 className="text-2xl sm:text-3xl font-semibold">Student essentials</h2>
          <Link to="/academic-tools" className="text-sm font-medium text-electric-500 hover:underline flex items-center gap-1">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {academicTools.slice(0, 8).map((tool) => (
            <Link
              key={tool.slug}
              to={`/academic-tools/${tool.slug}`}
              className="group flex flex-col gap-2 rounded-2xl border border-navy-100 dark:border-white/10 p-4 hover:border-electric-500 transition-colors"
            >
              <tool.icon size={18} className="text-electric-500" />
              <span className="font-medium text-sm group-hover:text-electric-500 transition-colors">{tool.shortName}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Why this exists + FAQ — deliberately placed after tool discovery, not before it */}
      <section className="mx-auto max-w-3xl px-4 sm:px-6 pb-24 space-y-12">
        <div className="space-y-3">
          <h2 className="text-2xl sm:text-3xl font-semibold">Why ALLROUNDER HELPER exists</h2>
          <p className="text-navy-600 dark:text-ink-300 leading-relaxed">
            Most students end up bouncing between a dozen different sites for grade math, a separate app for
            to-do lists, another for PDF editing, and a chat app for quick doubts. ALLROUNDER HELPER puts the
            calculators, planners, document tools, and an AI assistant students actually use in one place, built
            to work the same way on a phone during a lecture break as it does on a laptop at a desk.
          </p>
          <p className="text-navy-600 dark:text-ink-300 leading-relaxed">
            Every academic calculator here shows its formula and reasoning, not just a final number, so you can
            check it against your own transcript or coursework instead of taking it on faith. Productivity and
            document tools save and process data locally on your device — no account, no upload, no waiting.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Frequently asked questions</h2>
          <div className="space-y-3">
            {homeFaqs.map((f, i) => (
              <details
                key={i}
                className="group rounded-2xl border border-navy-100 dark:border-white/10 p-4 open:bg-navy-50/60 dark:open:bg-white/[0.03]"
              >
                <summary className="cursor-pointer list-none font-medium text-navy-900 dark:text-ink-100 flex justify-between items-center gap-4">
                  {f.question}
                  <span className="text-navy-400 group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="mt-2 text-sm text-navy-600 dark:text-ink-300 leading-relaxed">{f.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
