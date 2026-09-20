import type { ReactNode } from 'react';
import { Seo, SITE_URL } from '@/components/Seo';
import { Breadcrumbs, breadcrumbJsonLd } from '@/components/ui/Breadcrumbs';
import { Logo } from '@/components/ui/Logo';

interface Props {
  title: string;
  description: string;
  path: string;
  showLogo?: boolean;
  children: ReactNode;
}

export function StaticPageLayout({ title, description, path, showLogo = false, children }: Props) {
  return (
    <div className="noise-bg">
      <Seo title={title} description={description} path={path} jsonLd={breadcrumbJsonLd([{ label: title }], SITE_URL)} />
      <div className="mx-auto max-w-3xl px-4 sm:px-6 pt-8">
        <Breadcrumbs items={[{ label: title }]} />
      </div>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
        {showLogo && <Logo size={56} className="mb-6" />}
        <h1 className="text-3xl sm:text-4xl font-semibold mb-8">{title}</h1>
        <div className="prose-content space-y-6 text-navy-600 dark:text-ink-300 leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}
