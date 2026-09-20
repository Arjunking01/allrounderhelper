import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Breadcrumbs, breadcrumbJsonLd, type Crumb } from '@/components/ui/Breadcrumbs';
import { Seo, SITE_URL } from '@/components/Seo';
import { ToolArticle, faqJsonLd, type ToolArticleContent } from '@/components/ToolArticle';
import { FavoriteToggle } from '@/components/ui/FavoriteToggle';
import { ResultActionBar } from '@/components/ResultActionBar';
import { useTrackToolVisit } from '@/hooks/useRecentTools';
import type { LucideIcon } from 'lucide-react';

interface CalculatorLayoutProps {
  toolName: string;
  tagline: string;
  description: string;
  path: string;
  icon: LucideIcon;
  breadcrumb: Crumb;
  children: ReactNode;
  article: ToolArticleContent;
  /** Current result as a short human-readable string (e.g. "CGPA: 8.42"). Enables copy/share/print/history. Omit or pass '' while there's no valid result. */
  resultSummary?: string;
}

export function CalculatorLayout({
  toolName,
  tagline,
  description,
  path,
  icon: Icon,
  breadcrumb,
  children,
  article,
  resultSummary,
}: CalculatorLayoutProps) {
  const crumbs: Crumb[] = [{ label: 'Academic Tools', href: '/academic-tools' }, breadcrumb];
  const toolSlug = path.split('/').filter(Boolean).pop() ?? toolName;
  useTrackToolVisit(path, toolName);

  return (
    <div className="noise-bg">
      <Seo
        title={toolName}
        description={description}
        path={path}
        jsonLd={[breadcrumbJsonLd(crumbs, SITE_URL), faqJsonLd(article.faqs)]}
      />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 pt-8">
        <Breadcrumbs items={crumbs} />
      </div>

      <header className="mx-auto max-w-5xl px-4 sm:px-6 pt-8 pb-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex items-center gap-4"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl gradient-brand text-white shadow-lg shadow-electric-500/20">
            <Icon size={22} />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-semibold">{toolName}</h1>
            <p className="text-navy-500 dark:text-ink-400 text-sm sm:text-base">{tagline}</p>
          </div>
          <FavoriteToggle path={path} />
        </motion.div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 pb-10">
        {children}
        {resultSummary !== undefined && <ResultActionBar toolName={toolName} toolSlug={toolSlug} resultSummary={resultSummary} />}
      </main>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 border-t border-navy-100 dark:border-white/10">
        <ToolArticle content={article} toolName={toolName} />
      </div>
    </div>
  );
}

