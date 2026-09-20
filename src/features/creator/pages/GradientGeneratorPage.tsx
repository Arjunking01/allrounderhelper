import { useMemo, useState } from 'react';
import { Sparkles, Plus, Trash2, Copy, Star } from 'lucide-react';
import { CreatorToolLayout } from '@/components/CreatorToolLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getCreatorToolBySlug } from '@/data/creatorToolsRegistry';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useToast } from '@/components/ToastProvider';
import { copyToClipboard } from '@/lib/clipboard';
import type { ToolArticleContent } from '@/components/ToolArticle';

const tool = getCreatorToolBySlug('gradient-generator')!;

const article: ToolArticleContent = {
  intro: 'Gradient Generator builds multi-stop linear, radial, and conic gradients with a live preview, and outputs the result as ready-to-use CSS or Tailwind classes.',
  whyItMatters: 'Designing a gradient by guessing color-stop percentages in code is slow and hard to visualize. A live preview makes it possible to fine-tune a gradient by eye and copy working code directly into a project.',
  howItWorks: [
    'Choose a gradient type: linear, radial, or conic.',
    'For linear and conic gradients, drag the angle slider to set the direction; radial gradients radiate from the center and have no angle to set.',
    'Add or remove color stops, and drag each stop\u2019s position slider to adjust where its color sits along the gradient.',
    'Watch the preview update live at the top of the page as you edit.',
    'Click "Copy CSS" for a ready-to-paste CSS \u2018background\u2019 value, or "Copy Tailwind" for the equivalent arbitrary-value Tailwind utility class.',
    'Click "Save favorite" to keep a gradient in the Favorites panel \u2014 saved gradients persist on this device and can be copied again later with one click.',
  ],
  examples: [
    { title: 'Hero section background', body: 'Build a subtle two-color linear gradient for a website hero section and copy the CSS directly into your stylesheet.' },
    { title: 'Building a small palette of gradients', body: 'Save a few different gradients as favorites while experimenting, then compare them side by side before picking one for a project.' },
  ],
  mistakes: [
    'Using too many color stops with clashing hues, which can look muddy rather than smooth.',
    'Forgetting that radial gradients don\u2019t use the angle slider \u2014 it only appears for linear and conic types.',
    'Removing a stop and expecting fewer than two \u2014 the tool always keeps a minimum of two stops so the gradient stays valid.',
  ],
  tips: [
    'Two or three stops usually look cleaner than many \u2014 keep gradients simple unless you have a specific effect in mind.',
    'Save a gradient as a favorite before experimenting further, so you can always get back to a version you liked.',
    'Click a saved favorite\u2019s swatch to copy its CSS again without having to rebuild it.',
  ],
  faqs: [
    { question: 'Can I export this for Tailwind CSS specifically?', answer: 'Yes \u2014 alongside plain CSS, the "Copy Tailwind" button outputs the equivalent Tailwind arbitrary-value utility class for the current gradient.' },
    { question: 'What gradient types are supported?', answer: 'Linear, radial, and conic gradients, each with multiple adjustable color stops.' },
    { question: 'Can I adjust the angle of a linear gradient?', answer: 'Yes \u2014 the angle is adjustable via a slider and updates the live preview immediately. Conic gradients also use the angle slider; radial gradients don\u2019t have an angle.' },
    { question: 'Are my saved favorites shared with anyone else?', answer: 'No \u2014 favorites are stored locally on this device only, not uploaded or shared.' },
    { question: 'Is there a limit to how many favorites I can save?', answer: 'The favorites list keeps the 12 most recently saved gradients.' },
  ],
  related: [
    { label: 'Color Picker', href: '/creator-tools/color-picker' },
    { label: 'Palette Generator', href: '/creator-tools/palette-generator' },
  ],
};

type GradientType = 'linear' | 'radial' | 'conic';
interface Stop { id: string; color: string; position: number }

function makeStop(color: string, position: number): Stop {
  return { id: crypto.randomUUID(), color, position };
}

export default function GradientGeneratorPage() {
  const [type, setType] = useState<GradientType>('linear');
  const [angle, setAngle] = useState(135);
  const [stops, setStops] = useState<Stop[]>([makeStop('#3b6dfb', 0), makeStop('#8b3ffb', 100)]);
  const [favorites, setFavorites] = useLocalStorage<string[]>('ar-gradient-favorites', []);
  const { showToast } = useToast();

  const stopsCss = useMemo(() => [...stops].sort((a, b) => a.position - b.position).map((s) => `${s.color} ${s.position}%`).join(', '), [stops]);

  const cssValue = useMemo(() => {
    if (type === 'linear') return `linear-gradient(${angle}deg, ${stopsCss})`;
    if (type === 'radial') return `radial-gradient(circle, ${stopsCss})`;
    return `conic-gradient(from ${angle}deg, ${stopsCss})`;
  }, [type, angle, stopsCss]);

  function addStop() {
    setStops((prev) => [...prev, makeStop('#17cf8f', 50)]);
  }

  function updateStop(id: string, patch: Partial<Stop>) {
    setStops((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function removeStop(id: string) {
    setStops((prev) => (prev.length > 2 ? prev.filter((s) => s.id !== id) : prev));
  }

  function copyCss() {
    copyToClipboard(`background: ${cssValue};`).then((ok) => showToast(ok ? 'CSS copied to clipboard' : 'Could not copy'));
  }

  function copyTailwind() {
    const tw = type === 'linear'
      ? `bg-[image:linear-gradient(${angle}deg,${stops.map((s) => `${s.color.replace('#', '%23')}_${s.position}%`).join(',')})]`
      : `bg-[image:${cssValue.replace(/ /g, '_')}]`;
    copyToClipboard(tw).then((ok) => showToast(ok ? 'Tailwind class copied to clipboard' : 'Could not copy'));
  }

  function saveFavorite() {
    if (favorites.includes(cssValue)) return;
    setFavorites((prev) => [cssValue, ...prev].slice(0, 12));
    showToast('Saved to favorites');
  }

  return (
    <CreatorToolLayout toolName={tool.name} tagline={tool.tagline} description={tool.description} path="/creator-tools/gradient-generator" icon={Sparkles} breadcrumb={{ label: 'Gradient Generator' }} article={article}>
      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <Card>
          <div
            className="w-full rounded-2xl border border-navy-100 dark:border-white/10 mb-6"
            style={{ backgroundImage: cssValue, height: 220 }}
          />

          <div className="flex gap-2 mb-5">
            {(['linear', 'radial', 'conic'] as GradientType[]).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                aria-pressed={type === t}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium capitalize border transition-colors ${type === t ? 'border-electric-500 bg-electric-500/10 text-electric-500' : 'border-navy-200 dark:border-white/10 text-navy-500 dark:text-ink-400'}`}
              >
                {t}
              </button>
            ))}
          </div>

          {type !== 'radial' && (
            <label className="block text-sm mb-5">
              Angle — {angle}°
              <input type="range" min={0} max={360} value={angle} onChange={(e) => setAngle(Number(e.target.value))} className="mt-1 w-full accent-electric-500" />
            </label>
          )}

          <div className="space-y-2 mb-5">
            {stops.map((stop) => (
              <div key={stop.id} className="flex items-center gap-2">
                <input type="color" aria-label="Stop color" value={stop.color} onChange={(e) => updateStop(stop.id, { color: e.target.value })} className="h-9 w-9 rounded-lg border border-navy-200 dark:border-white/10" />
                <input type="range" aria-label={`Stop position, ${stop.position}%`} min={0} max={100} value={stop.position} onChange={(e) => updateStop(stop.id, { position: Number(e.target.value) })} className="flex-1 accent-electric-500" />
                <span className="text-xs w-10 text-navy-500 dark:text-ink-500">{stop.position}%</span>
                <button onClick={() => removeStop(stop.id)} disabled={stops.length <= 2} aria-label="Remove stop" className="p-1.5 rounded-lg text-navy-400 hover:text-red-500 disabled:opacity-30">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" icon={<Plus size={14} />} onClick={addStop}>Add stop</Button>
            <Button size="sm" icon={<Copy size={14} />} onClick={copyCss}>Copy CSS</Button>
            <Button size="sm" variant="outline" icon={<Copy size={14} />} onClick={copyTailwind}>Copy Tailwind</Button>
            <Button size="sm" variant="ghost" icon={<Star size={14} />} onClick={saveFavorite}>Save favorite</Button>
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold mb-4">Favorites</h2>
          {favorites.length === 0 ? (
            <p className="text-sm text-navy-400 dark:text-ink-500">Save a gradient to see it here.</p>
          ) : (
            <div className="space-y-2">
              {favorites.map((fav, i) => (
                <button
                  key={i}
                  onClick={() => {
                    copyToClipboard(`background: ${fav};`).then((ok) => showToast(ok ? 'Copied' : 'Could not copy'));
                  }}
                  className="w-full h-14 rounded-xl border border-navy-100 dark:border-white/10"
                  style={{ backgroundImage: fav }}
                  aria-label={`Copy favorite gradient ${i + 1}`}
                />
              ))}
            </div>
          )}
        </Card>
      </div>
    </CreatorToolLayout>
  );
}
