import { useMemo, useState } from 'react';
import { Printer } from 'lucide-react';
import { CreatorToolLayout } from '@/components/CreatorToolLayout';
import { PageInfoSection } from '@/components/PageInfoSection';
import { Card, SoftCard } from '@/components/ui/Card';
import { getCreatorToolBySlug } from '@/data/creatorToolsRegistry';
import type { ToolArticleContent } from '@/components/ToolArticle';

const tool = getCreatorToolBySlug('dpi-calculator')!;

const article: ToolArticleContent = {
  intro: 'DPI Calculator recommends the right DPI for an image before you print it, and gives quality guidance based on your image\u2019s pixel dimensions and intended print size.',
  whyItMatters: 'Printing an image at too low a DPI results in visible pixelation or blur, especially at larger sizes. Checking DPI before printing \u2014 not after \u2014 saves wasted prints and paper.',
  howItWorks: [
    'Enter your image\u2019s pixel dimensions and the size you plan to print at.',
    'The calculator shows the resulting DPI and whether it meets common print-quality thresholds.',
    'Adjust the print size or find out how much you\u2019d need to upscale the image.',
  ],
  examples: [
    { title: 'Checking before printing a poster', body: 'Enter an image\u2019s dimensions and a poster-sized target to see if the resulting DPI will look sharp at that size.' },
    { title: 'Finding the max safe print size', body: 'A 3000\u00d72000 pixel photo divided by a 300 DPI target gives a max sharp print size around 10\u00d76.7 inches \u2014 working backward from your target DPI to a print size (instead of forward from a fixed print size) tells you the largest you can go before quality starts to drop.' },
  ],
  mistakes: [
    'Only checking pixel dimensions and ignoring the intended print size \u2014 the same image can be print-quality at a small size and too low-DPI at a large one.',
    'Upscaling a low-resolution image in an editor and assuming that fixes DPI \u2014 upscaling adds interpolated pixels, not real detail, so print quality at close range still won\u2019t match a genuinely high-resolution source.',
  ],
  tips: [
    'Aim for at least 300 DPI for close-up prints like documents or photos; lower DPI (150\u2013200) can be acceptable for large prints viewed from a distance, like posters.',
    'If your DPI comes out too low, try a smaller print size rather than upscaling the image \u2014 upscaling doesn\u2019t add real detail.',
  ],
  faqs: [
    { question: 'What DPI is considered print-quality?', answer: '300 DPI is a common standard for sharp, close-viewing prints; posters and banners viewed from farther away can look fine at lower DPI, often 150\u2013200.' },
    { question: 'Does DPI matter for images only viewed on screen?', answer: 'No \u2014 DPI is a print-specific concept. Screens display images based on pixel dimensions, not DPI, so this calculator is only relevant when you\u2019re planning to print.' },
  ],
  related: [
    { label: 'Resolution Calculator', href: '/creator-tools/resolution-calculator' },
    { label: 'Aspect Ratio Calculator', href: '/creator-tools/aspect-ratio-calculator' },
  ],
};

function qualityBand(dpi: number): { label: string; tone: string } {
  if (dpi < 100) return { label: 'Too low for print — will look blurry', tone: 'text-red-500' };
  if (dpi < 150) return { label: 'Low quality — acceptable for large posters viewed from a distance', tone: 'text-amber-500' };
  if (dpi < 300) return { label: 'Good quality for most print materials', tone: 'text-electric-500' };
  return { label: 'Excellent — professional print quality', tone: 'text-emerald-500' };
}

export default function DpiCalculatorPage() {
  const [pixelWidth, setPixelWidth] = useState(2400);
  const [printWidthIn, setPrintWidthIn] = useState(8);

  const dpi = useMemo(() => Math.round(pixelWidth / printWidthIn), [pixelWidth, printWidthIn]);
  const quality = qualityBand(dpi);

  const recommendations = [
    { use: 'Web / screen display', dpi: '72 DPI' },
    { use: 'Standard document printing', dpi: '150–200 DPI' },
    { use: 'Professional photo prints', dpi: '300 DPI' },
    { use: 'Large-format posters/banners', dpi: '100–150 DPI (viewed from distance)' },
  ];

  return (
    <CreatorToolLayout toolName={tool.name} tagline={tool.tagline} description={tool.description} path="/creator-tools/dpi-calculator" icon={Printer} breadcrumb={{ label: 'DPI Calculator' }} article={article}>
      <Card>
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <label className="text-sm">Image width (px)
            <input type="number" min={1} value={pixelWidth} onChange={(e) => setPixelWidth(Number(e.target.value) || 1)} className="mt-1 w-full rounded-lg border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-3 py-2 outline-none focus:border-electric-500" />
          </label>
          <label className="text-sm">Intended print width (inches)
            <input type="number" min={0.1} step={0.1} value={printWidthIn} onChange={(e) => setPrintWidthIn(Number(e.target.value) || 0.1)} className="mt-1 w-full rounded-lg border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-3 py-2 outline-none focus:border-electric-500" />
          </label>
        </div>

        <SoftCard className="mb-6">
          <p className="text-xs text-navy-500 dark:text-ink-500 mb-1">Resulting print resolution</p>
          <p className="text-3xl font-display font-semibold text-gradient-brand">{dpi} DPI</p>
          <p className={`text-sm font-medium mt-1 ${quality.tone}`}>{quality.label}</p>
        </SoftCard>

        <h2 className="font-semibold mb-3">Recommended DPI by use case</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {recommendations.map((r) => (
            <div key={r.use} className="flex items-center justify-between rounded-xl border border-navy-100 dark:border-white/10 px-4 py-2.5">
              <span className="text-sm text-navy-600 dark:text-ink-300">{r.use}</span>
              <span className="text-sm font-semibold">{r.dpi}</span>
            </div>
          ))}
        </div>
      </Card>

      <PageInfoSection
        about="DPI (dots per inch) determines how sharp an image looks when printed. This calculator divides your image's pixel width by your intended print width to tell you the resulting print resolution, so you know whether a file will print sharp or blurry before you send it to a printer."
        tips={[
          'For professional prints (photos, business cards, brochures), aim for 300 DPI or higher.',
          'Web and screen graphics only need 72 DPI — anything higher just increases file size with no visible benefit.',
          'Large banners and posters can use lower DPI (100–150) since they are viewed from a distance.',
          'If your DPI comes out too low, either use a higher-resolution source image or reduce the intended print size.',
        ]}
        faqs={[
          { question: 'What DPI do I need for printing photos?', answer: '300 DPI is the standard for professional photo prints. Below 150 DPI, prints typically start to look visibly blurry or pixelated.' },
          { question: 'Is DPI the same as image resolution?', answer: 'Not quite — resolution is the total pixel count (e.g. 2400×3200), while DPI describes how densely those pixels are packed when printed at a specific physical size. The same image file can have different DPI depending on the print size.' },
          { question: 'Why does my DPI change if I resize the print?', answer: 'DPI is pixels ÷ inches, so shrinking the print size increases DPI (more pixels per inch) while enlarging it decreases DPI, even though the image file itself hasn\u2019t changed.' },
        ]}
        related={[
          { label: 'Resolution Calculator', href: '/creator-tools/resolution-calculator' },
          { label: 'Aspect Ratio Calculator', href: '/creator-tools/aspect-ratio-calculator' },
          { label: 'Image Resizer', href: '/document-tools/image-resizer' },
        ]}
      />
    </CreatorToolLayout>
  );
}
