import markSrc from '@/assets/brand/logo-mark.png';
import fullSrc from '@/assets/brand/logo-full.png';
import { clsx } from '@/lib/utils/clsx';

interface LogoProps {
  /** Rendered height in CSS px. The mark is square; the full lockup keeps its own aspect ratio. */
  size?: number;
  className?: string;
  /**
   * `mark` (default): the emblem - triangle, A, laptop, document/gear and tablet glyphs - without the
   * wordmark. Use up to ~100px.
   * `full`: the complete original lockup including the "Allrounder Helper" wordmark. Only use it at
   * roughly 160px tall or more; below that the wordmark is unreadable.
   */
  variant?: 'mark' | 'full';
  alt?: string;
}

/** Aspect ratio (w/h) of the full lockup asset: 560 x 541. */
const FULL_RATIO = 560 / 541;

/**
 * Single source of truth for the ALLROUNDER HELPER logo in the UI.
 * Both PNGs are transparent RGBA and are generated from one master by
 * brand-source/generate_brand_assets.py - never hand-edit them or swap in a redrawn substitute.
 * Sizing scale used across the app: 40 nav (header/footer), 48 page title (dashboard), 56 onboarding /
 * static pages, 56-88 hero, 160+ full lockup.
 * Do NOT put this in an `overflow-hidden` / opaque-background wrapper: the emblem is a triangle, so a
 * clipped or filled square around it is exactly what makes it look broken.
 */
export function Logo({ size = 32, className, variant = 'mark', alt = 'ALLROUNDER HELPER' }: LogoProps) {
  const isFull = variant === 'full';
  const width = isFull ? Math.round(size * FULL_RATIO) : size;
  return (
    <img
      src={isFull ? fullSrc : markSrc}
      alt={alt}
      width={width}
      height={size}
      decoding="async"
      className={clsx('object-contain select-none', className)}
      style={{ width, height: size }}
    />
  );
}
