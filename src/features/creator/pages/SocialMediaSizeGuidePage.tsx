import { useMemo, useState } from 'react';
import { Ruler, Search, Star, Copy } from 'lucide-react';
import { CreatorToolLayout } from '@/components/CreatorToolLayout';
import { Card } from '@/components/ui/Card';
import { getCreatorToolBySlug } from '@/data/creatorToolsRegistry';
import { useFavoriteTools } from '@/hooks/useFavoriteTools';
import { useToast } from '@/components/ToastProvider';
import { copyToClipboard } from '@/lib/clipboard';
import type { ToolArticleContent } from '@/components/ToolArticle';

const tool = getCreatorToolBySlug('social-media-size-guide')!;

const article: ToolArticleContent = {
  intro: 'Social Media Size Guide is a searchable, favoritable reference of image and video dimensions across major social platforms, so you don\u2019t have to search for the numbers every time you design something new.',
  whyItMatters: 'Platforms update recommended sizes periodically, and keeping track of every format \u2014 post, story, cover photo, profile picture \u2014 across multiple platforms from memory is impractical. A single reference saves time and avoids designing at the wrong size.',
  howItWorks: [
    'Search or browse by platform.',
    'View dimensions for each content type on that platform.',
    'Favorite the sizes you use often for quick access later.',
  ],
  examples: [
    { title: 'Planning a multi-platform post', body: 'Look up the correct dimensions for an Instagram post, a Pinterest pin, and a YouTube thumbnail before designing each version of the same content.' },
  ],
  mistakes: [
    'Reusing one image size across every platform without checking each one\u2019s specific requirements.',
    'Treating any size reference \u2014 this one included \u2014 as guaranteed current without a quick cross-check, since platforms change their recommended dimensions without much notice and a static reference can lag behind by nature.',
  ],
  tips: [
    'Favorite the handful of formats you use regularly so you don\u2019t need to search for them each time.',
    'For anything high-stakes (a paid ad, an official channel asset), do a quick search on the platform\u2019s own current help page before finalizing \u2014 treat this guide as a fast starting reference, not the final word.',
  ],
  faqs: [
    { question: 'How often are these dimensions updated?', answer: 'This is a static reference maintained in the site\u2019s data, not a live feed pulled from each platform\u2019s API \u2014 it reflects commonly published dimensions as of when it was last reviewed. For anything where being exactly current really matters, do a quick check against the platform\u2019s own current guidance.' },
    { question: 'Can I save the sizes I use most?', answer: 'Yes \u2014 favorite any size entry for quick access without searching for it again.' },
    { question: 'Does it cover video dimensions too, not just images?', answer: 'Yes \u2014 the guide includes both image and video dimensions where a platform has separate specs for each.' },
  ],
  related: [
    { label: 'Aspect Ratio Calculator', href: '/creator-tools/aspect-ratio-calculator' },
    { label: 'Thumbnail Safe Zone Checker', href: '/creator-tools/thumbnail-safe-zone-checker' },
  ],
};

interface SizeEntry { platform: string; type: string; dimensions: string }

const SIZES: SizeEntry[] = [
  { platform: 'YouTube', type: 'Thumbnail', dimensions: '1280×720' },
  { platform: 'YouTube', type: 'Channel banner', dimensions: '2560×1440' },
  { platform: 'YouTube', type: 'Shorts', dimensions: '1080×1920' },
  { platform: 'Instagram', type: 'Feed post (square)', dimensions: '1080×1080' },
  { platform: 'Instagram', type: 'Feed post (portrait)', dimensions: '1080×1350' },
  { platform: 'Instagram', type: 'Story / Reel', dimensions: '1080×1920' },
  { platform: 'Instagram', type: 'Profile picture', dimensions: '320×320' },
  { platform: 'Pinterest', type: 'Standard Pin', dimensions: '1000×1500' },
  { platform: 'Pinterest', type: 'Square Pin', dimensions: '1000×1000' },
  { platform: 'Facebook', type: 'Shared post image', dimensions: '1200×630' },
  { platform: 'Facebook', type: 'Cover photo', dimensions: '820×312' },
  { platform: 'LinkedIn', type: 'Shared post image', dimensions: '1200×627' },
  { platform: 'LinkedIn', type: 'Company banner', dimensions: '1128×191' },
  { platform: 'TikTok', type: 'Video', dimensions: '1080×1920' },
  { platform: 'TikTok', type: 'Profile picture', dimensions: '200×200' },
  { platform: 'X (Twitter)', type: 'Shared post image', dimensions: '1200×675' },
  { platform: 'X (Twitter)', type: 'Header photo', dimensions: '1500×500' },
];

export default function SocialMediaSizeGuidePage() {
  const [query, setQuery] = useState('');
  const { favorites, isFavorite, toggleFavorite } = useFavoriteTools();
  const { showToast } = useToast();

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return SIZES.filter((s) => s.platform.toLowerCase().includes(q) || s.type.toLowerCase().includes(q));
  }, [query]);

  function entryPath(entry: SizeEntry) {
    return `/creator-tools/social-media-size-guide#${entry.platform}-${entry.type}`.replace(/\s+/g, '-');
  }

  function copy(entry: SizeEntry) {
    copyToClipboard(entry.dimensions).then((ok) => showToast(ok ? `Copied ${entry.dimensions}` : 'Could not copy'));
  }

  return (
    <CreatorToolLayout toolName={tool.name} tagline={tool.tagline} description={tool.description} path="/creator-tools/social-media-size-guide" icon={Ruler} breadcrumb={{ label: 'Social Media Size Guide' }} article={article}>
      <Card>
        <div className="relative mb-5">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" />
          <input
            type="text"
            placeholder="Search platform or content type..."
            aria-label="Search platform or content type"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 pl-9 pr-4 py-2.5 text-sm outline-none focus:border-electric-500 focus:ring-2 focus:ring-electric-500/20"
          />
        </div>

        <div className="space-y-2">
          {filtered.map((entry) => {
            const path = entryPath(entry);
            const favorite = isFavorite(path);
            return (
              <div key={path} className="flex items-center justify-between gap-3 rounded-xl border border-navy-100 dark:border-white/10 px-4 py-3">
                <div>
                  <p className="font-medium text-sm">{entry.platform} · {entry.type}</p>
                  <p className="text-xs text-navy-500 dark:text-ink-500 font-mono">{entry.dimensions}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => copy(entry)} aria-label={`Copy ${entry.platform} ${entry.type} dimensions`} className="p-1.5 rounded-lg text-navy-400 hover:text-electric-500 hover:bg-electric-500/10">
                    <Copy size={14} />
                  </button>
                  <button onClick={() => toggleFavorite(path)} aria-label={favorite ? `Remove ${entry.platform} ${entry.type} from favorites` : `Add ${entry.platform} ${entry.type} to favorites`} aria-pressed={favorite} className={favorite ? 'p-1.5 rounded-lg text-amber-500' : 'p-1.5 rounded-lg text-navy-400 hover:text-amber-500'}>
                    <Star size={14} fill={favorite ? 'currentColor' : 'none'} />
                  </button>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <p className="text-sm text-navy-400 text-center py-8">No matches for "{query}"</p>}
        </div>

        {favorites.some((f) => f.startsWith('/creator-tools/social-media-size-guide#')) && (
          <p className="text-xs text-navy-400 dark:text-ink-500 mt-4">⭐ {favorites.filter((f) => f.startsWith('/creator-tools/social-media-size-guide#')).length} favorited</p>
        )}
      </Card>
    </CreatorToolLayout>
  );
}
