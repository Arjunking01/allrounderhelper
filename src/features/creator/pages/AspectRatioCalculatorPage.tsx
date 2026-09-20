import { useMemo, useState } from 'react';
import { RectangleHorizontal } from 'lucide-react';
import { CreatorToolLayout } from '@/components/CreatorToolLayout';
import { Card, SoftCard } from '@/components/ui/Card';
import { getCreatorToolBySlug } from '@/data/creatorToolsRegistry';
import type { ToolArticleContent } from '@/components/ToolArticle';

const tool = getCreatorToolBySlug('aspect-ratio-calculator')!;

const article: ToolArticleContent = {
  intro: 'Aspect Ratio Calculator gives exact pixel dimensions for YouTube, Instagram, Pinterest, Facebook, LinkedIn, TikTok, and custom aspect ratios, so your image or video fits without unexpected cropping.',
  whyItMatters: 'Each platform crops or resizes uploads to fit its expected dimensions. Designing at the correct aspect ratio from the start avoids important content being cut off after upload.',
  howItWorks: [
    'Select a platform and content type (e.g. Instagram post, YouTube thumbnail).',
    'Get the exact recommended pixel dimensions.',
    'Or enter a custom ratio to calculate matching dimensions at any size.',
  ],
  examples: [
    { title: 'Designing a YouTube thumbnail', body: 'Look up YouTube\u2019s exact thumbnail dimensions before designing, so nothing important sits near edges that get cropped in previews.' },
    { title: 'Reusing one video across platforms', body: 'A 16:9 landscape video doesn\u2019t fit Instagram Story\u2019s 9:16 vertical space \u2014 calculating the target dimensions in advance shows exactly how much would be cropped from the sides (or how much letterboxing would appear) if the same clip were exported for both without adjustment.' },
  ],
  mistakes: [
    'Designing at a rough guess of the aspect ratio and resizing after the fact, which can crop out important content.',
  ],
  tips: [
    'Check dimensions before starting a design, not after \u2014 it\u2019s much easier than reworking a finished piece to fit.',
  ],
  faqs: [
    { question: 'Do these dimensions change over time?', answer: 'Platforms occasionally update recommended sizes \u2014 cross-check against the Social Media Size Guide, and for anything high-stakes, the platform\u2019s own current help page.' },
    { question: 'Can I calculate a ratio not listed for a platform?', answer: 'Yes \u2014 enter a custom ratio and target size to get matching dimensions for any aspect ratio, not just the preset platform options.' },
    { question: 'What happens if my image doesn\u2019t match the platform\u2019s ratio?', answer: 'The platform will typically crop or letterbox it to fit \u2014 designing at the exact recommended dimensions from the start avoids that.' },
  ],
  related: [
    { label: 'Social Media Size Guide', href: '/creator-tools/social-media-size-guide' },
    { label: 'Resolution Calculator', href: '/creator-tools/resolution-calculator' },
  ],
};

interface Preset { label: string; ratioW: number; ratioH: number; note: string }

const PRESETS: Preset[] = [
  { label: 'YouTube Thumbnail', ratioW: 16, ratioH: 9, note: '1280×720 recommended' },
  { label: 'YouTube Shorts', ratioW: 9, ratioH: 16, note: '1080×1920 recommended' },
  { label: 'Instagram Post', ratioW: 1, ratioH: 1, note: '1080×1080 recommended' },
  { label: 'Instagram Story/Reel', ratioW: 9, ratioH: 16, note: '1080×1920 recommended' },
  { label: 'Instagram Portrait', ratioW: 4, ratioH: 5, note: '1080×1350 recommended' },
  { label: 'Pinterest Pin', ratioW: 2, ratioH: 3, note: '1000×1500 recommended' },
  { label: 'Facebook Post', ratioW: 1.91, ratioH: 1, note: '1200×630 recommended' },
  { label: 'LinkedIn Post', ratioW: 1.91, ratioH: 1, note: '1200×627 recommended' },
  { label: 'TikTok Video', ratioW: 9, ratioH: 16, note: '1080×1920 recommended' },
  { label: 'Custom', ratioW: 1, ratioH: 1, note: 'Enter your own ratio below' },
];

export default function AspectRatioCalculatorPage() {
  const [presetIndex, setPresetIndex] = useState(0);
  const [customW, setCustomW] = useState(1);
  const [customH, setCustomH] = useState(1);
  const [width, setWidth] = useState(1920);

  const preset = PRESETS[presetIndex];
  const isCustom = preset.label === 'Custom';
  const ratioW = isCustom ? customW : preset.ratioW;
  const ratioH = isCustom ? customH : preset.ratioH;

  const height = useMemo(() => Math.round((width * ratioH) / ratioW), [width, ratioH, ratioW]);
  const previewAspect = ratioW / ratioH;

  return (
    <CreatorToolLayout toolName={tool.name} tagline={tool.tagline} description={tool.description} path="/creator-tools/aspect-ratio-calculator" icon={RectangleHorizontal} breadcrumb={{ label: 'Aspect Ratio Calculator' }} article={article}>
      <Card>
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-medium text-navy-700 dark:text-ink-300 mb-2">Platform</p>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {PRESETS.map((p, i) => (
                <button
                  key={p.label}
                  onClick={() => setPresetIndex(i)}
                  aria-pressed={presetIndex === i}
                  className={`rounded-xl border px-3 py-2 text-sm text-left transition-colors ${presetIndex === i ? 'border-electric-500 bg-electric-500/10 text-electric-500' : 'border-navy-200 dark:border-white/10 text-navy-600 dark:text-ink-300'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {isCustom && (
              <div className="grid grid-cols-2 gap-3 mb-5">
                <label className="text-sm">Ratio width
                  <input type="number" min={1} value={customW} onChange={(e) => setCustomW(Number(e.target.value) || 1)} className="mt-1 w-full rounded-lg border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-3 py-2 outline-none focus:border-electric-500" />
                </label>
                <label className="text-sm">Ratio height
                  <input type="number" min={1} value={customH} onChange={(e) => setCustomH(Number(e.target.value) || 1)} className="mt-1 w-full rounded-lg border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-3 py-2 outline-none focus:border-electric-500" />
                </label>
              </div>
            )}

            <label className="block text-sm">
              Width (px)
              <input type="number" min={1} value={width} onChange={(e) => setWidth(Number(e.target.value) || 1)} className="mt-1 w-full rounded-lg border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-3 py-2 outline-none focus:border-electric-500" />
            </label>

            <SoftCard className="mt-4">
              <p className="text-sm text-navy-600 dark:text-ink-300">
                At a ratio of <span className="font-semibold">{ratioW}:{ratioH}</span>, width {width}px needs a height of <span className="font-semibold text-electric-500">{height}px</span>.
              </p>
              {!isCustom && <p className="text-xs text-navy-400 dark:text-ink-500 mt-1">{preset.note}</p>}
            </SoftCard>
          </div>

          <div className="flex items-center justify-center rounded-2xl border border-navy-100 dark:border-white/10 p-6 bg-navy-50/50 dark:bg-white/[0.02]">
            <div className="gradient-brand rounded-lg" style={{ width: previewAspect >= 1 ? 220 : 220 * previewAspect, height: previewAspect >= 1 ? 220 / previewAspect : 220, maxWidth: '100%', maxHeight: 280 }} />
          </div>
        </div>
      </Card>
    </CreatorToolLayout>
  );
}
