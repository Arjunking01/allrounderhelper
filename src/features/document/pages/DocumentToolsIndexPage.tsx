import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Seo, SITE_URL } from '@/components/Seo';
import { Breadcrumbs, breadcrumbJsonLd } from '@/components/ui/Breadcrumbs';
import { CategorySearchBar } from '@/components/CategorySearchBar';
import { MostUsedInCategory } from '@/components/MostUsedInCategory';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToolFilter } from '@/hooks/useToolFilter';
import { Search } from 'lucide-react';
import { documentTools, categoryLabels, type DocumentCategory } from '@/data/documentToolsRegistry';
import { faqJsonLd } from '@/components/ToolArticle';

const CATEGORY_ORDER: DocumentCategory[] = ['pdf', 'conversion', 'image', 'qr'];

const categoryFaqs = [
  {
    question: 'Are my files really never uploaded anywhere?',
    answer:
      'Correct for every tool in this section. PDF, image, and OCR processing all run using in-browser libraries and an on-device recognition engine — your file is read, processed, and downloaded again without ever leaving your device or touching a server.',
  },
  {
    question: 'Which tool should I use to shrink a PDF before submitting it?',
    answer:
      'Use Compress PDF. It re-optimizes the file\u2019s internal structure and images to reduce size while keeping the document readable — useful when a portal or email provider has an upload size limit.',
  },
  {
    question: 'How do I combine several scanned pages into one PDF?',
    answer:
      'Photograph or scan each page as an image, then use Image to PDF to combine them into a single ordered PDF file, ready for upload as one document.',
  },
  {
    question: 'Does the OCR tool work on handwriting?',
    answer:
      'The on-device OCR engine is built for printed text. It can struggle with handwriting, especially messy or cursive handwriting — results are usually far more reliable on typed or printed source material.',
  },
];

export default function DocumentToolsIndexPage() {
  const { query, setQuery, filtered } = useToolFilter(documentTools);

  return (
    <div className="noise-bg">
      <Seo
        title="Document & Image Tools"
        description="Free browser-based PDF, image, and QR tools for students — merge, split, compress, convert, crop, and generate codes without uploading to a server."
        path="/document-tools"
        jsonLd={[breadcrumbJsonLd([{ label: 'Document Tools' }], SITE_URL), faqJsonLd(categoryFaqs)]}
      />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-8">
        <Breadcrumbs items={[{ label: 'Document Tools' }]} />
      </div>
      <header className="mx-auto max-w-6xl px-4 sm:px-6 pt-8 pb-6">
        <h1 className="text-3xl sm:text-4xl font-semibold">Document & Image Tools</h1>
        <p className="mt-3 text-navy-500 dark:text-ink-400 max-w-2xl">
          PDF, image, and QR tools that run entirely in your browser — your files are processed locally and never uploaded to a server.
        </p>
      </header>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-6">
        <CategorySearchBar value={query} onChange={setQuery} placeholder="Search document tools..." />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-24">
        <MostUsedInCategory pathPrefix="/document-tools/" />

        {filtered.length === 0 ? (
          <EmptyState icon={Search} title="No tools match your search" description="Try a different keyword, or clear the search to see all tools." />
        ) : (
          <div className="space-y-12">
            {CATEGORY_ORDER.map((category) => {
              const items = filtered.filter((t) => t.category === category);
              if (items.length === 0) return null;
              return (
                <section key={category}>
                  <h2 className="text-xl font-semibold mb-4">{categoryLabels[category]}</h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((tool, i) => (
                      <motion.div key={tool.slug} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.3, delay: i * 0.03 }}>
                        <Link
                          to={`/document-tools/${tool.slug}`}
                          className="group relative flex flex-col gap-3 rounded-2xl border border-navy-100 dark:border-white/10 p-5 hover:border-electric-500 hover:shadow-lg hover:shadow-electric-500/5 transition-all h-full"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-brand text-white">
                            <tool.icon size={18} />
                          </div>
                          <div>
                            <h3 className="font-semibold group-hover:text-electric-500 transition-colors">{tool.name}</h3>
                            <p className="text-sm text-navy-500 dark:text-ink-500 mt-1">{tool.tagline}</p>
                          </div>
                          {tool.architectureOnly && (
                            <span className="absolute top-4 right-4 text-[10px] font-semibold uppercase tracking-wide text-violet-500 bg-violet-500/10 rounded-full px-2 py-1">
                              Architecture preview
                            </span>
                          )}
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 pb-24 space-y-12">
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Why everything here runs in your browser</h2>
          <p className="text-navy-600 dark:text-ink-300 leading-relaxed">
            Every tool in this category — PDF editing, image conversion, OCR text extraction, QR generation and
            scanning — uses in-browser processing rather than sending your file to a server. That matters for two
            practical reasons: your files (which may include ID scans, assignments, or personal documents) never
            leave your device, and there\u2019s no upload wait for large files since nothing is transmitted anywhere.
            The trade-off is that very large files are limited by your device\u2019s own memory rather than a server\u2019s.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">A typical document workflow</h2>
          <p className="text-navy-600 dark:text-ink-300 leading-relaxed">
            A common sequence for submitting scanned coursework: photograph each page, use Image to PDF to combine
            them into one file, then Compress PDF if the portal has a size limit, and finally Rearrange PDF or
            Delete PDF Pages if a page needs fixing before submission. For extracting text from a scanned document
            instead of resubmitting it, OCR Text Extraction converts the image content into editable, searchable
            text.
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
