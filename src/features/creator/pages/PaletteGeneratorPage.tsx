import { useState } from 'react';
import { Shuffle, Lock, Unlock, Download, RefreshCw } from 'lucide-react';
import { CreatorToolLayout } from '@/components/CreatorToolLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getCreatorToolBySlug } from '@/data/creatorToolsRegistry';
import { useToast } from '@/components/ToastProvider';
import { downloadBlob } from '@/features/document/logic/fileUtils';
import { copyToClipboard } from '@/lib/clipboard';
import { hexToRgb, hslToRgb, rgbToHex, rgbToHsl } from '../logic/colorUtils';
import type { ToolArticleContent } from '@/components/ToolArticle';

const tool = getCreatorToolBySlug('palette-generator')!;

const article: ToolArticleContent = {
  intro: 'Palette Generator creates harmonious color palettes \u2014 complementary, analogous, triadic, and monochromatic \u2014 with the option to lock colors you like and export as JSON, CSS, or a PNG swatch.',
  whyItMatters: 'Choosing colors that work well together by eye alone is hard without some color theory behind it. Generating palettes based on established color harmony rules gives a reliable starting point instead of guesswork.',
  howItWorks: [
    'Pick a base color or generate a random one.',
    'Choose a harmony type: complementary, analogous, triadic, or monochromatic.',
    'Lock any colors you want to keep, then regenerate the rest.',
    'Export the finished palette as JSON, CSS variables, or a PNG image.',
  ],
  examples: [
    { title: 'Building a brand palette', body: 'Start from your main brand color, generate an analogous palette around it, and lock the colors that feel right before exporting.' },
    { title: 'Exploring options before committing', body: 'Generate a triadic palette from a base color, lock the one accent you like most, and regenerate the rest a few times \u2014 comparing several regenerated sets around a fixed anchor color is often faster than manually tweaking hex values one at a time.' },
  ],
  mistakes: [
    'Using every generated color at equal weight in a design \u2014 harmonious palettes usually work best with one dominant color and others as accents.',
    'Exporting immediately after the first generation without trying a couple of regenerations \u2014 locking a color you like and regenerating the rest a few times often surfaces a noticeably better combination.',
  ],
  tips: [
    'Lock a color you\u2019re committed to before regenerating, so new options build around it instead of replacing it.',
  ],
  faqs: [
    { question: 'What\u2019s the difference between the harmony types?', answer: 'Complementary uses opposite hues for contrast, analogous uses neighboring hues for a cohesive look, triadic spreads three evenly across the color wheel, and monochromatic varies lightness/saturation of a single hue.' },
    { question: 'Can I start from a specific brand color?', answer: 'Yes \u2014 enter your base color directly instead of generating a random one, and the palette will build around it.' },
    { question: 'What export formats are available?', answer: 'You can export a finished palette as JSON, CSS custom properties, or a PNG swatch image.' },
  ],
  related: [
    { label: 'Color Picker', href: '/creator-tools/color-picker' },
    { label: 'Gradient Generator', href: '/creator-tools/gradient-generator' },
  ],
};

type Harmony = 'complementary' | 'analogous' | 'triadic' | 'monochromatic' | 'random';

interface Swatch { id: string; hex: string; locked: boolean }

function generateHarmony(baseHex: string, harmony: Harmony): string[] {
  const rgb = hexToRgb(baseHex) ?? { r: 59, g: 109, b: 251 };
  const { h, s, l } = rgbToHsl(rgb);

  const hueOffsets: Record<Harmony, number[]> = {
    complementary: [0, 180, 30, 210, 60],
    analogous: [0, 30, 60, -30, -60],
    triadic: [0, 120, 240, 60, 180],
    monochromatic: [0, 0, 0, 0, 0],
    random: [0, 0, 0, 0, 0],
  };

  if (harmony === 'random') {
    return Array.from({ length: 5 }, () => rgbToHex(hslToRgb({ h: Math.random() * 360, s: 55 + Math.random() * 35, l: 35 + Math.random() * 35 })));
  }

  if (harmony === 'monochromatic') {
    return [20, 35, 50, 65, 80].map((lightness) => rgbToHex(hslToRgb({ h, s, l: lightness })));
  }

  return hueOffsets[harmony].map((offset) => {
    const newHue = ((h + offset) % 360 + 360) % 360;
    return rgbToHex(hslToRgb({ h: newHue, s, l }));
  });
}

export default function PaletteGeneratorPage() {
  const [baseHex, setBaseHex] = useState('#3b6dfb');
  const [harmony, setHarmony] = useState<Harmony>('complementary');
  const [swatches, setSwatches] = useState<Swatch[]>(() => generateHarmony('#3b6dfb', 'complementary').map((hex) => ({ id: crypto.randomUUID(), hex, locked: false })));
  const { showToast } = useToast();

  function regenerate() {
    const fresh = generateHarmony(baseHex, harmony);
    setSwatches((prev) => prev.map((s, i) => (s.locked ? s : { ...s, hex: fresh[i] ?? s.hex })));
  }

  function toggleLock(id: string) {
    setSwatches((prev) => prev.map((s) => (s.id === id ? { ...s, locked: !s.locked } : s)));
  }

  function copyHex(hex: string) {
    copyToClipboard(hex).then((ok) => showToast(ok ? `Copied ${hex}` : `Could not copy ${hex}`));
  }

  function exportJson() {
    downloadBlob(new Blob([JSON.stringify({ colors: swatches.map((s) => s.hex) }, null, 2)], { type: 'application/json' }), 'palette.json');
  }

  function exportCss() {
    const css = `:root {\n${swatches.map((s, i) => `  --color-${i + 1}: ${s.hex};`).join('\n')}\n}`;
    downloadBlob(new Blob([css], { type: 'text/css' }), 'palette.css');
  }

  function exportPng() {
    const canvas = document.createElement('canvas');
    const swatchWidth = 160;
    canvas.width = swatchWidth * swatches.length;
    canvas.height = 200;
    const ctx = canvas.getContext('2d')!;
    swatches.forEach((s, i) => {
      ctx.fillStyle = s.hex;
      ctx.fillRect(i * swatchWidth, 0, swatchWidth, 160);
      ctx.fillStyle = '#0a0e1a';
      ctx.font = '16px monospace';
      ctx.fillText(s.hex.toUpperCase(), i * swatchWidth + 12, 184);
    });
    canvas.toBlob((blob) => blob && downloadBlob(blob, 'palette.png'));
  }

  return (
    <CreatorToolLayout toolName={tool.name} tagline={tool.tagline} description={tool.description} path="/creator-tools/palette-generator" icon={Shuffle} breadcrumb={{ label: 'Palette Generator' }} article={article}>
      <Card>
        <div className="flex flex-wrap items-end gap-4 mb-6">
          <label className="text-sm">
            Base color
            <input type="color" value={baseHex} onChange={(e) => setBaseHex(e.target.value)} className="mt-1 h-10 w-16 rounded-lg border border-navy-200 dark:border-white/10 block" />
          </label>
          <div className="flex-1 min-w-[220px]">
            <p className="text-sm font-medium text-navy-700 dark:text-ink-300 mb-1.5">Harmony</p>
            <div className="flex flex-wrap gap-2">
              {(['complementary', 'analogous', 'triadic', 'monochromatic', 'random'] as Harmony[]).map((h) => (
                <button key={h} onClick={() => setHarmony(h)} aria-pressed={harmony === h} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize border transition-colors ${harmony === h ? 'border-electric-500 bg-electric-500/10 text-electric-500' : 'border-navy-200 dark:border-white/10 text-navy-500 dark:text-ink-400'}`}>
                  {h}
                </button>
              ))}
            </div>
          </div>
          <Button icon={<RefreshCw size={15} />} onClick={regenerate}>Generate</Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {swatches.map((s) => (
            <div key={s.id} className="rounded-xl overflow-hidden border border-navy-100 dark:border-white/10">
              <button className="w-full h-24" style={{ backgroundColor: s.hex }} onClick={() => copyHex(s.hex)} aria-label={`Copy ${s.hex}`} />
              <div className="flex items-center justify-between px-2.5 py-2">
                <span className="text-xs font-mono">{s.hex.toUpperCase()}</span>
                <button onClick={() => toggleLock(s.id)} aria-label={s.locked ? 'Unlock color' : 'Lock color'} className={s.locked ? 'text-electric-500' : 'text-navy-400'}>
                  {s.locked ? <Lock size={13} /> : <Unlock size={13} />}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" icon={<Download size={14} />} onClick={exportJson}>Export JSON</Button>
          <Button size="sm" variant="outline" icon={<Download size={14} />} onClick={exportCss}>Export CSS</Button>
          <Button size="sm" variant="outline" icon={<Download size={14} />} onClick={exportPng}>Export PNG</Button>
        </div>
      </Card>
    </CreatorToolLayout>
  );
}
