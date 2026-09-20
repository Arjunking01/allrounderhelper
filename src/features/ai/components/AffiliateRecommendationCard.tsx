import { GraduationCap, ExternalLink } from 'lucide-react';
import { AFFILIATE_DESTINATION_URL } from '../logic/affiliateDetection';

/** Shown below an AI response only when that turn was detected as product-recommendation-related. */
export function AffiliateRecommendationCard() {
  return (
    <a
      href={AFFILIATE_DESTINATION_URL}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-electric-500/20 bg-electric-500/5 px-4 py-3 transition-colors hover:border-electric-500/40 hover:bg-electric-500/10"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-electric-500/10 text-electric-600 dark:text-electric-400">
          <GraduationCap size={16} />
        </span>
        <span>
          <span className="flex items-center gap-1.5">
            <span className="block text-sm font-medium text-navy-900 dark:text-ink-100">Recommended Student &amp; Creator Products</span>
            <span className="rounded border border-navy-300 dark:border-ink-600 px-1 py-px text-[10px] font-semibold uppercase tracking-wide text-navy-500 dark:text-ink-500">Ad</span>
          </span>
          <span className="block text-xs text-navy-500 dark:text-ink-500 mt-0.5">Affiliate link — we may earn a commission at no extra cost to you.</span>
        </span>
      </div>
      <ExternalLink size={14} className="shrink-0 text-electric-600 dark:text-electric-400" />
    </a>
  );
}
