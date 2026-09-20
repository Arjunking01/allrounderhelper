import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Seo, SITE_URL } from '@/components/Seo';
import { Breadcrumbs, breadcrumbJsonLd } from '@/components/ui/Breadcrumbs';
import { CategorySearchBar } from '@/components/CategorySearchBar';
import { MostUsedInCategory } from '@/components/MostUsedInCategory';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToolFilter } from '@/hooks/useToolFilter';
import { academicTools } from '@/data/toolsRegistry';
import { Search } from 'lucide-react';
import { faqJsonLd } from '@/components/ToolArticle';

const categoryFaqs = [
  {
    question: 'Which grade calculator should I use first — CGPA or SGPA?',
    answer:
      'Use the SGPA Calculator if you only need one semester\u2019s grade point average. Use the CGPA Calculator once you have results from more than one semester and want the credit-weighted average across all of them.',
  },
  {
    question: 'Do these calculators know my university\u2019s exact grading rules?',
    answer:
      'No. Grading scales (0\u201310 point systems, percentage conversion factors, attendance thresholds) vary by university, so every calculator here uses the general formula and lets you enter your own scale or values. Always confirm the exact policy in your institution\u2019s academic handbook before treating a result as official.',
  },
  {
    question: 'Can I use the Attendance Calculator to plan how many classes I can skip?',
    answer:
      'Yes \u2014 enter your classes held and attended so far along with your college\u2019s minimum attendance requirement, and it will show how many additional classes you can miss (or need to attend) while staying above that threshold.',
  },
  {
    question: 'Is my grade and marks data stored anywhere?',
    answer:
      'These calculators run entirely in your browser. Values you type are used only to compute the result on this page and are not sent to a server or saved to an account.',
  },
];

export default function AcademicToolsPage() {
  const { query, setQuery, filtered } = useToolFilter(academicTools);

  return (
    <div className="noise-bg">
      <Seo
        title="Academic Tools"
        description="Free academic calculators for students — CGPA, SGPA, attendance, percentage, exam scores, study planning, and more."
        path="/academic-tools"
        jsonLd={[breadcrumbJsonLd([{ label: 'Academic Tools' }], SITE_URL), faqJsonLd(categoryFaqs)]}
      />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-8">
        <Breadcrumbs items={[{ label: 'Academic Tools' }]} />
      </div>
      <header className="mx-auto max-w-6xl px-4 sm:px-6 pt-8 pb-6">
        <h1 className="text-3xl sm:text-4xl font-semibold">Academic Tools</h1>
        <p className="mt-3 text-navy-500 dark:text-ink-400 max-w-2xl">
          Fourteen free calculators covering grades, attendance, budgeting, and study planning — built for accuracy and speed on any device.
        </p>
      </header>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-6">
        <CategorySearchBar value={query} onChange={setQuery} placeholder="Search academic tools..." />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-24">
        <MostUsedInCategory pathPrefix="/academic-tools/" />

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
                  to={`/academic-tools/${tool.slug}`}
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
          <h2 className="text-2xl font-semibold">Which academic tool do you actually need?</h2>
          <p className="text-navy-600 dark:text-ink-300 leading-relaxed">
            Most students land on this page for one of three reasons: they just got results and want to know
            their SGPA or CGPA, they\u2019re worried about falling below their attendance requirement, or they need
            to work out what score they still need on a final exam. The fourteen tools below cover those situations
            plus the smaller, recurring calculations \u2014 unit conversions, budget tracking, study hours \u2014 that come
            up around exam season.
          </p>
          <p className="text-navy-600 dark:text-ink-300 leading-relaxed">
            A quick way to choose: if you have results from <em>one</em> semester, start with SGPA. If you have
            results from <em>multiple</em> semesters and want the cumulative figure, use CGPA. If a professor or
            portal only shows a percentage and you need the grade-point equivalent (or the reverse), use GPA to
            Percentage or Semester Percentage. If you\u2019re trying to figure out whether you can afford to miss
            class, use the Attendance Calculator before you skip, not after.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">How these calculators handle grading differences</h2>
          <p className="text-navy-600 dark:text-ink-300 leading-relaxed">
            Grading systems are not standardized across universities \u2014 some use a 10-point scale, some a 4-point
            scale, and percentage-to-GPA conversion factors differ by institution. Rather than hardcoding one
            university\u2019s policy, each calculator here asks for the raw numbers (grade points, credits, marks,
            or attendance counts) and applies the general formula, so the math is transparent and you can check
            it against your own transcript. Where a calculator needs an assumption \u2014 like the common CGPA \u00d7 9.5
            percentage conversion \u2014 that assumption is stated on the tool\u2019s own page.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">A typical workflow around exam season</h2>
          <p className="text-navy-600 dark:text-ink-300 leading-relaxed">
            Students commonly move through these tools in sequence: checking the Attendance Calculator early in
            the semester to confirm they\u2019re not at risk of an attendance shortfall, using the Marks Required
            calculator before a final exam to see what score is needed for a target grade, then running SGPA once
            results are out, and finally updating CGPA once every semester on record has a confirmed grade. For
            ongoing coursework, the Study Hours and Study Planner tools (in Productivity) pair naturally with the
            Exam Countdown to structure revision time.
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
