import { Link } from 'react-router-dom';
import { SoftCard } from '@/components/ui/Card';

export interface FaqItem {
  question: string;
  answer: string;
}

export interface RelatedTool {
  label: string;
  href: string;
}

export interface ToolArticleContent {
  intro: string;
  whyItMatters: string;
  howItWorks: string[];
  examples: { title: string; body: string }[];
  mistakes: string[];
  tips: string[];
  faqs: FaqItem[];
  related: RelatedTool[];
}

export function faqJsonLd(faqs: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}

export function ToolArticle({ content, toolName }: { content: ToolArticleContent; toolName: string }) {
  return (
    <article className="mx-auto max-w-3xl space-y-14 py-16">
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">About the {toolName}</h2>
        <p className="text-navy-600 dark:text-ink-300 leading-relaxed">{content.intro}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Why it matters</h2>
        <p className="text-navy-600 dark:text-ink-300 leading-relaxed">{content.whyItMatters}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">How it works</h2>
        <ol className="space-y-2">
          {content.howItWorks.map((step, i) => (
            <li key={i} className="flex gap-3 text-navy-600 dark:text-ink-300 leading-relaxed">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full gradient-brand text-xs font-semibold text-white">
                {i + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Worked examples</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {content.examples.map((ex, i) => (
            <SoftCard key={i}>
              <h3 className="font-semibold text-navy-900 dark:text-ink-100 mb-1.5">{ex.title}</h3>
              <p className="text-sm text-navy-600 dark:text-ink-300 leading-relaxed">{ex.body}</p>
            </SoftCard>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Common mistakes</h2>
        <ul className="space-y-2">
          {content.mistakes.map((m, i) => (
            <li key={i} className="flex gap-3 text-navy-600 dark:text-ink-300 leading-relaxed">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
              {m}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Tips to get accurate results</h2>
        <ul className="space-y-2">
          {content.tips.map((t, i) => (
            <li key={i} className="flex gap-3 text-navy-600 dark:text-ink-300 leading-relaxed">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
              {t}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Frequently asked questions</h2>
        <div className="space-y-3">
          {content.faqs.map((f, i) => (
            <details key={i} className="group rounded-2xl border border-navy-100 dark:border-white/10 p-4 open:bg-navy-50/60 dark:open:bg-white/[0.03]">
              <summary className="cursor-pointer list-none font-medium text-navy-900 dark:text-ink-100 flex justify-between items-center gap-4">
                {f.question}
                <span className="text-navy-400 group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-2 text-sm text-navy-600 dark:text-ink-300 leading-relaxed">{f.answer}</p>
            </details>
          ))}
        </div>
      </section>

      {content.related.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Related tools</h2>
          <div className="flex flex-wrap gap-2">
            {content.related.map((r) => (
              <Link
                key={r.href}
                to={r.href}
                className="rounded-full border border-navy-200 dark:border-white/10 px-4 py-2 text-sm font-medium text-navy-700 dark:text-ink-300 hover:border-electric-500 hover:text-electric-500 transition-colors"
              >
                {r.label}
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
