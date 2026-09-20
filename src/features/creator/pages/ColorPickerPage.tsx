import { useMemo, useState } from 'react';
import { Palette, Copy, Trash2, Download } from 'lucide-react';
import { CreatorToolLayout } from '@/components/CreatorToolLayout';
import { Card, SoftCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getCreatorToolBySlug } from '@/data/creatorToolsRegistry';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useToast } from '@/components/ToastProvider';
import { downloadBlob } from '@/features/document/logic/fileUtils';
import { copyToClipboard } from '@/lib/clipboard';
import { hexToRgb, rgbToHsl, rgbToHsv, rgbToCmykApprox, contrastRatio, contrastLabel } from '../logic/colorUtils';
import type { ToolArticleContent } from '@/components/ToolArticle';

const tool = getCreatorToolBySlug('color-picker')!;

const article: ToolArticleContent = {
  intro: 'Color Picker lets you pick, convert, and save colors across HEX, RGB, HSL, and HSV formats, with a built-in contrast checker for accessibility.',
  whyItMatters: 'Design work usually needs the same color expressed in different formats depending on the tool \u2014 HEX for CSS, RGB for some editors, HSL for adjusting lightness. A contrast checker also helps catch text/background combinations that are hard to read before they ship.',
  howItWorks: [
    'Pick a color using the picker, or paste in a HEX, RGB, HSL, or HSV value.',
    'View the same color instantly converted across all formats.',
    'Check contrast against a background color for accessibility scoring.',
    'Save colors to recent history or a named palette for later use.',
  ],
  examples: [
    { title: 'Matching a brand color', body: 'Paste a brand HEX code to instantly get the RGB and HSL equivalents needed for different design tools.' },
    { title: 'Checking text readability', body: 'Use the contrast checker to confirm a text color meets accessibility contrast guidelines against its background before finalizing a design.' },
  ],
  mistakes: [
    'Picking colors purely by eye without checking contrast, which can make text hard to read for some users.',
  ],
  tips: [
    'Save frequently used brand colors to a palette so you don\u2019t have to re-enter the same HEX values repeatedly.',
  ],
  faqs: [
    { question: 'What contrast standard does the checker use?', answer: 'It calculates the actual WCAG contrast ratio between foreground and background and shows pass/fail against the WCAG AA and AAA thresholds for normal text, so you can see exactly which accessibility level a color combination meets.' },
    { question: 'Can I convert a color between formats without picking it visually?', answer: 'Yes \u2014 paste any HEX, RGB, HSL, or HSV value directly and it converts instantly across all formats.' },
    { question: 'Are saved colors stored anywhere besides this device?', answer: 'No \u2014 recent colors and palettes are saved locally in your browser, not on a server.' },
  ],
  related: [
    { label: 'Palette Generator', href: '/creator-tools/palette-generator' },
    { label: 'Gradient Generator', href: '/creator-tools/gradient-generator' },
  ],
};

function ValueRow({ label, value }: { label: string; value: string }) {
  const { showToast } = useToast();
  return (
    <div className="flex items-center justify-between rounded-lg border border-navy-100 dark:border-white/10 px-3 py-2">
      <div>
        <p className="text-[11px] uppercase tracking-wide text-navy-400 dark:text-ink-500">{label}</p>
        <p className="text-sm font-medium font-mono">{value}</p>
      </div>
      <button
        onClick={() => { copyToClipboard(value).then((ok) => showToast(ok ? `Copied ${label}` : `Could not copy ${label}`)); }}
        aria-label={`Copy ${label}`}
        className="p-1.5 rounded-lg text-navy-400 hover:text-electric-500 hover:bg-electric-500/10"
      >
        <Copy size={14} />
      </button>
    </div>
  );
}

export default function ColorPickerPage() {
  const [hex, setHex] = useState('#3b6dfb');
  const [bgHex, setBgHex] = useState('#ffffff');
  const [recent, setRecent] = useLocalStorage<string[]>('ar-color-recent', []);
  const [saved, setSaved] = useLocalStorage<string[]>('ar-color-saved', []);
  const { showToast } = useToast();

  const rgb = useMemo(() => hexToRgb(hex), [hex]);
  const hsl = useMemo(() => (rgb ? rgbToHsl(rgb) : null), [rgb]);
  const hsv = useMemo(() => (rgb ? rgbToHsv(rgb) : null), [rgb]);
  const cmyk = useMemo(() => (rgb ? rgbToCmykApprox(rgb) : null), [rgb]);
  const ratio = useMemo(() => contrastRatio(hex, bgHex), [hex, bgHex]);
  const contrast = ratio ? contrastLabel(ratio) : null;

  function commitColor(next: string) {
    setHex(next);
    setRecent((prev) => [next, ...prev.filter((c) => c !== next)].slice(0, 12));
  }

  function saveColor() {
    if (!rgb || saved.includes(hex)) return;
    setSaved((prev) => [...prev, hex]);
    showToast('Added to saved palette');
  }

  function exportPalette() {
    downloadBlob(new Blob([JSON.stringify({ colors: saved }, null, 2)], { type: 'application/json' }), 'palette.json');
  }

  return (
    <CreatorToolLayout toolName={tool.name} tagline={tool.tagline} description={tool.description} path="/creator-tools/color-picker" icon={Palette} breadcrumb={{ label: 'Color Picker' }} article={article}>
      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        <Card className="flex flex-col items-center gap-4">
          <input type="color" aria-label="Pick color" value={rgb ? hex : '#3b6dfb'} onChange={(e) => commitColor(e.target.value)} className="h-32 w-32 rounded-2xl border-4 border-white dark:border-navy-800 shadow-lg cursor-pointer" />
          <input
            type="text"
            aria-label="Hex color value"
            value={hex}
            onChange={(e) => setHex(e.target.value)}
            onBlur={(e) => hexToRgb(e.target.value) && commitColor(e.target.value)}
            className="w-full text-center rounded-xl border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-4 py-2 font-mono outline-none focus:border-electric-500"
          />
          <Button size="sm" fullWidth onClick={saveColor}>Save to palette</Button>
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="font-semibold mb-4">Values</h2>
            {rgb && hsl && hsv && cmyk ? (
              <div className="grid sm:grid-cols-2 gap-2">
                <ValueRow label="HEX" value={hex.toUpperCase()} />
                <ValueRow label="RGB" value={`rgb(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)})`} />
                <ValueRow label="HSL" value={`hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`} />
                <ValueRow label="HSV" value={`hsv(${Math.round(hsv.h)}, ${Math.round(hsv.s)}%, ${Math.round(hsv.v)}%)`} />
                <ValueRow label="CMYK (approx.)" value={`${Math.round(cmyk.c)}, ${Math.round(cmyk.m)}, ${Math.round(cmyk.y)}, ${Math.round(cmyk.k)}`} />
              </div>
            ) : (
              <p role="alert" className="text-sm text-red-500">Enter a valid hex color (e.g. #3b6dfb).</p>
            )}
            <p className="text-xs text-navy-400 dark:text-ink-500 mt-3">CMYK is a screen-based approximation — real print output depends on your printer's ICC color profile.</p>
          </Card>

          <Card>
            <h2 className="font-semibold mb-4">Contrast & accessibility</h2>
            <div className="flex items-center gap-4 mb-4">
              <label className="text-sm flex items-center gap-2">
                Background
                <input type="color" value={bgHex} onChange={(e) => setBgHex(e.target.value)} className="h-9 w-9 rounded-lg border border-navy-200 dark:border-white/10" />
              </label>
              <div className="flex-1 rounded-xl p-4 text-center font-medium" style={{ backgroundColor: bgHex, color: hex }}>
                Sample text
              </div>
            </div>
            {ratio && contrast ? (
              <div className="grid grid-cols-3 gap-2 text-sm">
                <SoftCard className="text-center py-2"><p className="font-semibold">{ratio.toFixed(2)}:1</p><p className="text-xs text-navy-500">Contrast ratio</p></SoftCard>
                <SoftCard className={`text-center py-2 ${contrast.normalAA ? 'border border-emerald-500/30' : ''}`}><p className="font-semibold">{contrast.normalAA ? 'Pass' : 'Fail'}</p><p className="text-xs text-navy-500">AA (normal text)</p></SoftCard>
                <SoftCard className={`text-center py-2 ${contrast.normalAAA ? 'border border-emerald-500/30' : ''}`}><p className="font-semibold">{contrast.normalAAA ? 'Pass' : 'Fail'}</p><p className="text-xs text-navy-500">AAA (normal text)</p></SoftCard>
              </div>
            ) : <p role="alert" className="text-sm text-red-500">Enter valid colors to check contrast.</p>}
          </Card>

          {recent.length > 0 && (
            <Card>
              <h2 className="font-semibold mb-3">Recent colors</h2>
              <div className="flex flex-wrap gap-2">
                {recent.map((c) => (
                  <button key={c} onClick={() => setHex(c)} aria-label={`Use color ${c}`} className="h-8 w-8 rounded-lg border border-navy-200 dark:border-white/10" style={{ backgroundColor: c }} />
                ))}
              </div>
            </Card>
          )}

          <Card>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h2 className="font-semibold">Saved palette</h2>
              {saved.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" icon={<Download size={13} />} onClick={exportPalette}>Export JSON</Button>
                  <Button size="sm" variant="ghost" icon={<Trash2 size={13} />} onClick={() => setSaved([])}>Clear</Button>
                </div>
              )}
            </div>
            {saved.length === 0 ? (
              <p className="text-sm text-navy-400 dark:text-ink-500">No colors saved yet — use "Save to palette" above.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {saved.map((c) => (
                  <button key={c} onClick={() => setHex(c)} aria-label={`Use color ${c}`} className="h-10 w-10 rounded-xl border border-navy-200 dark:border-white/10" style={{ backgroundColor: c }} />
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </CreatorToolLayout>
  );
}
