import { useEffect, useRef, useState } from 'react';
import { ImageIcon, Download } from 'lucide-react';
import { CreatorToolLayout } from '@/components/CreatorToolLayout';
import { Card } from '@/components/ui/Card';
import { FileDropzone } from '@/components/document/FileDropzone';
import { Button } from '@/components/ui/Button';
import { getCreatorToolBySlug } from '@/data/creatorToolsRegistry';
import { downloadBlob, loadImage } from '@/features/document/logic/fileUtils';
import type { ToolArticleContent } from '@/components/ToolArticle';

const tool = getCreatorToolBySlug('thumbnail-safe-zone-checker')!;

const article: ToolArticleContent = {
  intro: 'Thumbnail Safe Zone Checker previews your thumbnail against YouTube, Pinterest, and Instagram UI overlay guides, so you can see how it will look once platform UI elements \u2014 like duration badges or profile icons \u2014 sit on top of it.',
  whyItMatters: 'Platform interfaces cover parts of a thumbnail with their own UI \u2014 a duration timestamp, play button, or username overlay. Text or key details placed in those zones can end up hidden once the thumbnail actually goes live.',
  howItWorks: [
    'Upload your thumbnail image.',
    'Select the platform to preview against.',
    'See the safe-zone overlay guide applied on top of your thumbnail before publishing.',
  ],
  examples: [
    { title: 'Checking a YouTube thumbnail', body: 'Upload a finished thumbnail and preview it with YouTube\u2019s duration badge overlay to confirm important text isn\u2019t covered in the bottom-right corner.' },
    { title: 'Comparing platforms side by side', body: 'The same thumbnail can look fine on YouTube but have a face partially covered by Instagram\u2019s profile-icon overlay position \u2014 checking against each platform separately catches platform-specific issues a single generic preview would miss.' },
  ],
  mistakes: [
    'Placing key text or faces right at the edges where platform UI elements typically sit.',
    'Designing once and assuming it works everywhere \u2014 checking against only one platform\u2019s overlay guide can miss a problem specific to a different platform\u2019s UI placement.',
  ],
  tips: [
    'Keep important text and focal points closer to the center of the frame, away from corners where overlays usually appear.',
  ],
  faqs: [
    { question: 'Is my thumbnail uploaded anywhere?', answer: 'No \u2014 the preview is rendered locally in your browser against the overlay guide.' },
    { question: 'Which platforms are supported?', answer: 'YouTube, Pinterest, and Instagram overlay guides are available, covering the most common UI elements that cover part of a thumbnail.' },
    { question: 'What should I avoid placing near the edges?', answer: 'Key text, faces, or important details \u2014 corners and edges are where platform UI like duration badges or profile icons typically sit.' },
  ],
  related: [
    { label: 'Social Media Size Guide', href: '/creator-tools/social-media-size-guide' },
    { label: 'Aspect Ratio Calculator', href: '/creator-tools/aspect-ratio-calculator' },
  ],
};

type Platform = 'youtube' | 'pinterest' | 'instagram';

const OVERLAYS: Record<Platform, { label: string; insetPercent: number; note: string }> = {
  youtube: { label: 'YouTube', insetPercent: 8, note: 'Keep key text/faces inside this zone — the timestamp badge covers the bottom-right corner.' },
  pinterest: { label: 'Pinterest', insetPercent: 6, note: 'Pinterest overlays a save button top-right and profile info at the bottom.' },
  instagram: { label: 'Instagram', insetPercent: 10, note: 'Instagram crops feed thumbnails to square — keep subjects centered.' },
};

export default function ThumbnailSafeZoneCheckerPage() {
  const [imgUrl, setImgUrl] = useState('');
  const [platform, setPlatform] = useState<Platform>('youtube');
  const containerRef = useRef<HTMLDivElement>(null);
  const imgUrlRef = useRef('');

  useEffect(() => () => {
    if (imgUrlRef.current) URL.revokeObjectURL(imgUrlRef.current);
  }, []);

  async function handleFile(files: File[]) {
    const file = files[0];
    if (!file || !file.type.startsWith('image/')) return;
    if (imgUrlRef.current) URL.revokeObjectURL(imgUrlRef.current);
    const url = URL.createObjectURL(file);
    imgUrlRef.current = url;
    setImgUrl(url);
  }

  async function exportPreview() {
    if (!imgUrl) return;
    const img = await loadImage(imgUrl);
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);

    const inset = (OVERLAYS[platform].insetPercent / 100) * Math.min(img.width, img.height);
    ctx.strokeStyle = '#3b6dfb';
    ctx.lineWidth = Math.max(2, img.width * 0.004);
    ctx.setLineDash([img.width * 0.01, img.width * 0.008]);
    ctx.strokeRect(inset, inset, img.width - inset * 2, img.height - inset * 2);

    canvas.toBlob((blob) => blob && downloadBlob(blob, 'thumbnail-safe-zone-preview.png'));
  }

  const overlay = OVERLAYS[platform];

  return (
    <CreatorToolLayout toolName={tool.name} tagline={tool.tagline} description={tool.description} path="/creator-tools/thumbnail-safe-zone-checker" icon={ImageIcon} breadcrumb={{ label: 'Thumbnail Safe Zone Checker' }} article={article}>
      <Card>
        {!imgUrl ? (
          <FileDropzone accept="image/*" label="Drop a thumbnail image here" hint="1280×720 recommended for YouTube" onFiles={handleFile} />
        ) : (
          <div>
            <div className="flex gap-2 mb-5">
              {(Object.keys(OVERLAYS) as Platform[]).map((p) => (
                <button key={p} onClick={() => setPlatform(p)} aria-pressed={platform === p} className={`px-3.5 py-1.5 rounded-lg text-sm font-medium border transition-colors ${platform === p ? 'border-electric-500 bg-electric-500/10 text-electric-500' : 'border-navy-200 dark:border-white/10 text-navy-500 dark:text-ink-400'}`}>
                  {OVERLAYS[p].label}
                </button>
              ))}
            </div>

            <div ref={containerRef} className="relative inline-block max-w-full rounded-xl overflow-hidden border border-navy-100 dark:border-white/10">
              <img src={imgUrl} alt="Thumbnail preview" className="max-w-full block" />
              <div
                className="absolute border-2 border-dashed border-electric-500 pointer-events-none"
                style={{ inset: `${overlay.insetPercent}%` }}
              />
            </div>

            <p className="text-sm text-navy-500 dark:text-ink-400 mt-4">{overlay.note}</p>

            <div className="flex gap-2 mt-5">
              <Button icon={<Download size={15} />} onClick={exportPreview}>Export preview PNG</Button>
              <Button variant="ghost" onClick={() => setImgUrl('')}>Choose another image</Button>
            </div>
          </div>
        )}
      </Card>
    </CreatorToolLayout>
  );
}
