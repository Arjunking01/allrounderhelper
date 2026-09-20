import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Seo, SITE_URL } from '@/components/Seo';
import { Breadcrumbs, breadcrumbJsonLd } from '@/components/ui/Breadcrumbs';
import { CategorySearchBar } from '@/components/CategorySearchBar';
import { MostUsedInCategory } from '@/components/MostUsedInCategory';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToolFilter } from '@/hooks/useToolFilter';
import { Search } from 'lucide-react';
import { creatorTools } from '@/data/creatorToolsRegistry';
import { faqJsonLd } from '@/components/ToolArticle';

const categoryFaqs = [
  {
    question: 'What is the difference between DPI Calculator and Resolution Calculator?',
    answer:
      'DPI Calculator works out how sharp an image will look when printed at a given physical size, based on its pixel dimensions. Resolution Calculator works the other way — it tells you what pixel dimensions you need to hit a target resolution or aspect ratio for screens, video, or print.',
  },
  {
    question: 'Why do my thumbnail colors look different once uploaded to YouTube or Instagram?',
    answer:
      'Platforms recompress images and can shift color slightly, especially in shadows. Check your design using the Thumbnail Safe Zone Checker and preview on an actual device before finalizing colors and text placement.',
  },
  {
    question: 'Which tool should I use to build a matching color scheme?',
    answer:
      'Start in Color Picker to identify or adjust a base color, then use Palette Generator to build a harmonious set of complementary or analogous colors around it, and Gradient Generator if you need a smooth blend between two of them.',
  },
];

export default function CreatorToolsIndexPage() {
  const { query, setQuery, filtered } = useToolFilter(creatorTools);

  return (
    <div className="noise-bg">
      <Seo
        title="Creator Tools"
        description="Free color, gradient, palette, and sizing tools for content creators — color picker, gradient generator, palette generator, aspect ratio and DPI calculators, and more."
        path="/creator-tools"
        jsonLd={[breadcrumbJsonLd([{ label: 'Creator Tools' }], SITE_URL), faqJsonLd(categoryFaqs)]}
      />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-8">
        <Breadcrumbs items={[{ label: 'Creator Tools' }]} />
      </div>
      <header className="mx-auto max-w-6xl px-4 sm:px-6 pt-8 pb-6">
        <h1 className="text-3xl sm:text-4xl font-semibold">Creator Tools</h1>
        <p className="mt-3 text-navy-500 dark:text-ink-400 max-w-2xl">
          Color, gradient, palette, and sizing tools for thumbnails, social posts, and print — all free, all in your browser.
        </p>
      </header>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-6">
        <CategorySearchBar value={query} onChange={setQuery} placeholder="Search creator tools..." />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-24">
        <MostUsedInCategory pathPrefix="/creator-tools/" />

        {filtered.length === 0 ? (
          <EmptyState icon={Search} title="No tools match your search" description="Try a different keyword, or clear the search to see all tools." />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((tool, i) => (
              <motion.div key={tool.slug} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.3, delay: i * 0.03 }}>
                <Link
                  to={`/creator-tools/${tool.slug}`}
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
          <h2 className="text-2xl font-semibold">Color, sizing, and print math for creators</h2>
          <p className="text-navy-600 dark:text-ink-300 leading-relaxed">
            These tools split into two groups. Color and gradient tools (Color Picker, Palette Generator, Gradient
            Generator) help you build a consistent visual identity across thumbnails, slides, and social posts.
            Sizing and print tools (Aspect Ratio, Resolution, DPI, Social Media Size Guide, Thumbnail Safe Zone
            Checker) solve the more technical problem of making sure your image is the right shape and sharp
            enough for wherever it\u2019s going — a video thumbnail, a printed poster, or a specific platform\u2019s upload
            requirements.
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
