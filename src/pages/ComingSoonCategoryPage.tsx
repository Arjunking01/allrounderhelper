import { Clock } from 'lucide-react';
import { Seo, SITE_URL } from '@/components/Seo';
import { Breadcrumbs, breadcrumbJsonLd } from '@/components/ui/Breadcrumbs';

interface Props {
  title: string;
  description: string;
  path: string;
  plannedTools: string[];
}

export default function ComingSoonCategoryPage({ title, description, path, plannedTools }: Props) {
  return (
    <div className="noise-bg min-h-[70vh]">
      <Seo title={title} description={description} path={path} noindex jsonLd={breadcrumbJsonLd([{ label: title }], SITE_URL)} />
      <div className="mx-auto max-w-4xl px-4 sm:px-6 pt-8">
        <Breadcrumbs items={[{ label: title }]} />
      </div>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-16 text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl gradient-brand text-white mx-auto mb-6">
          <Clock size={24} />
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold">{title}</h1>
        <p className="mt-4 text-navy-500 dark:text-ink-400 max-w-xl mx-auto">{description}</p>
        <p className="mt-2 text-sm font-medium text-violet-500">Launching in the next release.</p>

        <div className="mt-10 grid sm:grid-cols-2 gap-3 text-left max-w-xl mx-auto">
          {plannedTools.map((t) => (
            <div key={t} className="rounded-xl border border-navy-100 dark:border-white/10 px-4 py-3 text-sm text-navy-600 dark:text-ink-300">
              {t}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
