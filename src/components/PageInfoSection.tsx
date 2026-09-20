import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';

interface Faq {
  question: string;
  answer: string;
}

interface RelatedLink {
  label: string;
  href: string;
}

interface Props {
  about: string;
  tips: string[];
  faqs: Faq[];
  related?: RelatedLink[];
}

/**
 * A compact, original "About / Tips / FAQ / Related" content block for interactive
 * app-style pages (Dashboard, Calendar, Notes, etc.) that otherwise have little
 * standalone text. Lighter than ToolArticle, which is built for calculator pages.
 */
export function PageInfoSection({ about, tips, faqs, related }: Props) {
  const baseId = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <Card className="mt-6 space-y-6">
      <div>
        <h2 className="font-semibold text-lg mb-2">About this tool</h2>
        <p className="text-sm text-navy-600 dark:text-ink-300 leading-relaxed">{about}</p>
      </div>

      <div>
        <h2 className="font-semibold text-lg mb-2">Tips</h2>
        <ul className="space-y-1.5">
          {tips.map((t, i) => (
            <li key={i} className="flex gap-2.5 text-sm text-navy-600 dark:text-ink-300 leading-relaxed">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-electric-500" />
              {t}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="font-semibold text-lg mb-2">FAQ</h2>
        <div className="space-y-2">
          {faqs.map((f, i) => {
            const open = openIndex === i;
            const panelId = `${baseId}-faq-panel-${i}`;
            return (
              <div
                key={i}
                className={`rounded-xl border border-navy-100 dark:border-white/10 p-3.5 transition-colors ${open ? 'bg-navy-50/60 dark:bg-white/[0.03]' : ''}`}
              >
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(open ? null : i)}
                  className="w-full cursor-pointer text-left text-sm font-medium flex justify-between items-center gap-4"
                >
                  {f.question}
                  <span className={`text-navy-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-45' : ''}`}>+</span>
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      id={panelId}
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="mt-1.5 text-sm text-navy-600 dark:text-ink-300 leading-relaxed">{f.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {related && related.length > 0 && (
        <div>
          <h2 className="font-semibold text-lg mb-2">Related tools</h2>
          <div className="flex flex-wrap gap-2">
            {related.map((r) => (
              <Link key={r.href} to={r.href} className="rounded-full border border-navy-200 dark:border-white/10 px-3.5 py-1.5 text-sm font-medium hover:border-electric-500 hover:text-electric-500 transition-colors">
                {r.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
