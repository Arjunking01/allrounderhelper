import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { Breadcrumbs, breadcrumbJsonLd, type Crumb } from '@/components/ui/Breadcrumbs';
import { Seo, SITE_URL } from '@/components/Seo';
import { FavoriteToggle } from '@/components/ui/FavoriteToggle';
import { ToolArticle, faqJsonLd, type ToolArticleContent } from '@/components/ToolArticle';
import { useTrackToolVisit } from '@/hooks/useRecentTools';

interface ProductivityToolLayoutProps {
  toolName: string;
  tagline: string;
  description: string;
  path: string;
  icon: LucideIcon;
  breadcrumb: Crumb;
  headerActions?: ReactNode;
  /** Optional educational content (how it works, FAQs, tips, related tools) rendered below the tool. */
  article?: ToolArticleContent;
  children: ReactNode;
}

export function ProductivityToolLayout({
  toolName,
  tagline,
  description,
  path,
  icon: Icon,
  breadcrumb,
  headerActions,
  article,
  children,
}: ProductivityToolLayoutProps) {
  const crumbs: Crumb[] = [{ label: 'Productivity', href: '/productivity' }, breadcrumb];
  useTrackToolVisit(path, toolName);

  return (
    <div className="noise-bg min-h-[70vh]">
      <Seo
        title={toolName}
        description={description}
        path={path}
        jsonLd={article ? [breadcrumbJsonLd(crumbs, SITE_URL), faqJsonLd(article.faqs)] : breadcrumbJsonLd(crumbs, SITE_URL)}
      />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 pt-8">
        <Breadcrumbs items={crumbs} />
      </div>

      <header className="mx-auto max-w-5xl px-4 sm:px-6 pt-8 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex items-center gap-4"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl gradient-brand text-white shadow-lg shadow-electric-500/20">
            <Icon size={22} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold">{toolName}</h1>
            <p className="text-navy-500 dark:text-ink-400 text-sm sm:text-base">{tagline}</p>
          </div>
        </motion.div>
        <div className="flex items-center gap-2">
          <FavoriteToggle path={path} />
          {headerActions}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 pb-20">{children}</main>

      {article && (
        <div className="mx-auto max-w-5xl px-4 sm:px-6 border-t border-navy-100 dark:border-white/10">
          <ToolArticle content={article} toolName={toolName} />
        </div>
      )}
    </div>
  );
}

