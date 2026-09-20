import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Seo, SITE_URL } from '@/components/Seo';
import { Breadcrumbs, breadcrumbJsonLd } from '@/components/ui/Breadcrumbs';
import { CategorySearchBar } from '@/components/CategorySearchBar';
import { MostUsedInCategory } from '@/components/MostUsedInCategory';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToolFilter } from '@/hooks/useToolFilter';
import { Search } from 'lucide-react';
import { productivityTools } from '@/data/productivityRegistry';
import { faqJsonLd } from '@/components/ToolArticle';

const categoryFaqs = [
  {
    question: 'Where is my data stored — do I need an account?',
    answer:
      'No account is needed. Every productivity tool here — To-Do List, Notes, planners, trackers — saves its data locally on your device using browser storage. Nothing is uploaded to a server, but that also means clearing your browser data or switching devices will not carry your data with it unless you export it first.',
  },
  {
    question: 'What is the difference between the Study Planner and the Weekly Planner?',
    answer:
      'The Study Planner is built around subjects, topics, and revision goals for a specific exam or course. The Weekly Planner is a general-purpose schedule for the whole week, covering classes, deadlines, and personal commitments alongside study time.',
  },
  {
    question: 'Should I use Pomodoro Timer or Focus Mode?',
    answer:
      'Pomodoro Timer structures work into fixed intervals (typically 25 minutes) with short breaks — useful when you want a consistent rhythm. Focus Mode is a single uninterrupted session for deep work on one task, without the built-in interval breaks.',
  },
  {
    question: 'How do these tools work together during exam season?',
    answer:
      'A common combination: set milestones in Exam Countdown, break the syllabus into tasks in the Study Planner or Assignment Tracker, schedule daily blocks in the Daily or Weekly Planner, and use Pomodoro Timer or Focus Mode to execute each session.',
  },
];

export default function ProductivityIndexPage() {
  const { query, setQuery, filtered } = useToolFilter(productivityTools);

  return (
    <div className="noise-bg">
      <Seo
        title="Productivity Tools"
        description="Free productivity tools for students — to-do lists, notes, study planner, Pomodoro timer, goal and habit tracking, exam countdowns, and a weekly planner. All saved locally on your device."
        path="/productivity"
        jsonLd={[breadcrumbJsonLd([{ label: 'Productivity' }], SITE_URL), faqJsonLd(categoryFaqs)]}
      />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-8">
        <Breadcrumbs items={[{ label: 'Productivity' }]} />
      </div>
      <header className="mx-auto max-w-6xl px-4 sm:px-6 pt-8 pb-6">
        <h1 className="text-3xl sm:text-4xl font-semibold">Productivity</h1>
        <p className="mt-3 text-navy-500 dark:text-ink-400 max-w-2xl">
          {productivityTools.length} tools to plan, focus, and build momentum — every one of them saves automatically to your device, no account required.
        </p>
      </header>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-6">
        <CategorySearchBar value={query} onChange={setQuery} placeholder="Search productivity tools..." />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-24">
        <MostUsedInCategory pathPrefix="/productivity/" />

        {filtered.length === 0 ? (
          <EmptyState icon={Search} title="No tools match your search" description="Try a different keyword, or clear the search to see all tools." />
        ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((tool, i) => (
          <motion.div
            key={tool.slug}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: i * 0.03 }}
          >
            <Link
              to={`/productivity/${tool.slug}`}
              className="group flex flex-col gap-3 rounded-2xl border border-navy-100 dark:border-white/10 p-5 hover:border-electric-500 hover:shadow-lg hover:shadow-electric-500/5 transition-all h-full"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-brand text-white">
                <tool.icon size={18} />
              </div>
              <div>
                <h2 className="font-semibold group-hover:text-electric-500 transition-colors">{tool.name}</h2>
                <p className="text-sm text-navy-500 dark:text-ink-500 mt-1">{tool.tagline}</p>
              </div>
            </Link>
          </motion.div>
        ))}
        </div>
        )}
      </div>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 pb-24 space-y-12">
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Choosing the right productivity tool</h2>
          <p className="text-navy-600 dark:text-ink-300 leading-relaxed">
            Most student productivity problems fall into three buckets: not knowing what to work on next, losing
            track of deadlines, and struggling to actually sit down and focus once a task is chosen. The tools
            above map onto each of those. To-Do List and Priority Matrix help decide what\u2019s next. Assignment
            Tracker, Exam Countdown, and the planners keep deadlines visible. Pomodoro Timer and Focus Mode handle
            the execution problem once you\u2019ve picked a task.
          </p>
          <p className="text-navy-600 dark:text-ink-300 leading-relaxed">
            You don\u2019t need to use all sixteen tools at once. Most students settle on two or three that fit their
            routine — for example, Weekly Planner for the overall schedule, Assignment Tracker for deadlines, and
            Pomodoro Timer for study sessions — rather than maintaining every tool in parallel.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Where your data actually lives</h2>
          <p className="text-navy-600 dark:text-ink-300 leading-relaxed">
            Every productivity tool on this page stores its data in your browser, on your device. There is no
            login and no server-side account, which means your notes and plans stay private, but it also means
            they\u2019re tied to that specific browser. If you plan to switch devices or clear your browser storage,
            check each tool for an export option first so you don\u2019t lose your data.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Frequently asked questions</h2>
          <div className="space-y-3">
            {categoryFaqs.map((f, i) => (
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
        </section>
      </div>
    </div>
  );
}
