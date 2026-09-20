import { useMemo, useState } from 'react';
import { Scan } from 'lucide-react';
import { CreatorToolLayout } from '@/components/CreatorToolLayout';
import { Card, SoftCard } from '@/components/ui/Card';
import { getCreatorToolBySlug } from '@/data/creatorToolsRegistry';
import type { ToolArticleContent } from '@/components/ToolArticle';

const tool = getCreatorToolBySlug('resolution-calculator')!;

const article: ToolArticleContent = {
  intro: 'Resolution Calculator takes an image\u2019s pixel width and height plus a target print width, and works out the resulting PPI (pixels per inch), the print height that keeps the image proportional, and a quick reference table of the pixel dimensions at 50%, 100%, 150%, and 200% scale.',
  whyItMatters: 'An image that looks sharp on a screen can print blurry if it doesn\u2019t have enough pixels for the size you\u2019re printing it at. Working out the PPI before sending a file to print \u2014 or before scaling an image up or down for a design \u2014 avoids a disappointing, soft-looking result.',
  howItWorks: [
    'Enter the image\u2019s pixel width and height \u2014 these are the dimensions of the actual image file, not the screen it\u2019s displayed on.',
    'Enter the width you want to print at, in inches.',
    'The calculator instantly shows the resulting PPI at that print width, and the matching print height (kept proportional to the image\u2019s aspect ratio).',
    'Check the scaling reference table below to see the pixel dimensions the image would need at 50%, 100%, 150%, or 200% of the entered print width \u2014 useful for judging how much room you have to size an image up or down.',
  ],
  examples: [
    { title: 'Checking print readiness', body: 'Enter a photo\u2019s pixel dimensions (say 3000\u00d72000) and the print width you have in mind (say 10 inches) to see the resulting PPI, then compare it against the roughly 300 PPI most print work is judged against.' },
    { title: 'Planning how large you can print', body: 'Keep the pixel dimensions fixed and try a few different print widths to see at what size the PPI drops below what you\u2019re comfortable with.' },
  ],
  mistakes: [
    'Assuming a screen-quality image is automatically print-quality \u2014 web images are often exported at far lower pixel dimensions than print work needs.',
    'Entering the print width in the wrong unit \u2014 the field expects inches, not centimeters or pixels.',
    'Only checking pixel dimensions and ignoring PPI \u2014 a very large image printed very small will have a high, sometimes wastefully high, PPI, while the same image printed large will have a low one.',
  ],
  tips: [
    'For most quality prints, aim for a resulting PPI around 300 at your final print size; the dedicated DPI Calculator has more detailed guidance if you want to work from a DPI target instead of an image size.',
    'Use the 50/100/150/200% scaling table to quickly sanity-check how far an image can be sized up before it likely looks soft.',
    'If the calculated PPI is lower than you\u2019d like, either use a higher-resolution source image or reduce the print width.',
  ],
  faqs: [
    { question: 'What\u2019s the difference between PPI and DPI?', answer: 'PPI (pixels per inch) describes image or screen density; DPI (dots per inch) describes printer output density \u2014 they\u2019re often used interchangeably in casual contexts but technically refer to different stages of the imaging pipeline.' },
    { question: 'What PPI should I aim for when printing?', answer: 'Around 300 PPI at the final print size is a common standard for sharp, professional-quality prints. Large-format prints viewed from a distance (like posters) can look fine at a lower PPI.' },
    { question: 'Can I enter a target PPI or DPI directly and have it work out the print size?', answer: 'Not in this tool \u2014 it works in one direction: pixel dimensions and a print width in, resulting PPI and print height out. For DPI-focused planning, use the DPI Calculator instead.' },
    { question: 'Does this tool change or resize my actual image file?', answer: 'No \u2014 it\u2019s a calculator only. It shows you the numbers; resizing the actual file is a separate step using an image editor or the Image Resizer tool.' },
  ],
  related: [
    { label: 'DPI Calculator', href: '/creator-tools/dpi-calculator' },
    { label: 'Aspect Ratio Calculator', href: '/creator-tools/aspect-ratio-calculator' },
  ],
};

export default function ResolutionCalculatorPage() {
  const [pixelWidth, setPixelWidth] = useState(3000);
  const [pixelHeight, setPixelHeight] = useState(2000);
  const [printWidthIn, setPrintWidthIn] = useState(10);

  const ppi = useMemo(() => Math.round(pixelWidth / printWidthIn), [pixelWidth, printWidthIn]);
  const printHeightIn = useMemo(() => (pixelHeight / pixelWidth) * printWidthIn, [pixelHeight, pixelWidth, printWidthIn]);

  const scales = [50, 100, 150, 200];

  return (
    <CreatorToolLayout toolName={tool.name} tagline={tool.tagline} description={tool.description} path="/creator-tools/resolution-calculator" icon={Scan} breadcrumb={{ label: 'Resolution Calculator' }} article={article}>
      <Card>
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <label className="text-sm">Image width (px)
            <input type="number" min={1} value={pixelWidth} onChange={(e) => setPixelWidth(Number(e.target.value) || 1)} className="mt-1 w-full rounded-lg border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-3 py-2 outline-none focus:border-electric-500" />
          </label>
          <label className="text-sm">Image height (px)
            <input type="number" min={1} value={pixelHeight} onChange={(e) => setPixelHeight(Number(e.target.value) || 1)} className="mt-1 w-full rounded-lg border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-3 py-2 outline-none focus:border-electric-500" />
          </label>
          <label className="text-sm">Print width (inches)
            <input type="number" min={0.1} step={0.1} value={printWidthIn} onChange={(e) => setPrintWidthIn(Number(e.target.value) || 0.1)} className="mt-1 w-full rounded-lg border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-3 py-2 outline-none focus:border-electric-500" />
          </label>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <SoftCard>
            <p className="text-xs text-navy-500 dark:text-ink-500 mb-1">Resulting PPI</p>
            <p className="text-2xl font-display font-semibold text-gradient-brand">{ppi} PPI</p>
          </SoftCard>
          <SoftCard>
            <p className="text-xs text-navy-500 dark:text-ink-500 mb-1">Print size at this width</p>
            <p className="text-2xl font-display font-semibold">{printWidthIn}" × {printHeightIn.toFixed(1)}"</p>
          </SoftCard>
        </div>

        <h2 className="font-semibold mb-3">Image scaling reference</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {scales.map((scale) => (
            <SoftCard key={scale} className="text-center">
              <p className="text-xs text-navy-500 dark:text-ink-500">{scale}%</p>
              <p className="font-medium text-sm mt-1">{Math.round(pixelWidth * (scale / 100))}×{Math.round(pixelHeight * (scale / 100))}</p>
            </SoftCard>
          ))}
        </div>
      </Card>
    </CreatorToolLayout>
  );
}
