import markSrc from '@/assets/brand/logo-mark.png';
import { clsx } from '@/lib/utils/clsx';

interface LogoProps {
  /** Rendered width and height in CSS px (the emblem is square). */
  size?: number;
  className?: string;
  alt?: string;
}

/**
 * The single source of truth for the ALLROUNDER HELPER emblem in the UI.
 * The PNG is a transparent RGBA emblem (no wordmark) generated from one master by
 * brand-source/generate_brand_assets.py - never hand-edit it or swap in a redrawn substitute.
 * The full lockup with the wordmark (brand-source/logo-full.png) is only legible at ~200px+ and
 * is used for the social preview image, not here.
 * Do NOT put this in an `overflow-hidden` / opaque-background wrapper: the emblem is a triangle,
 * so a clipped or filled square around it is exactly what makes it look broken.
 */
export function Logo({ size = 32, className, alt = 'ALLROUNDER HELPER' }: LogoProps) {
  return (
    <img
      src={markSrc}
      alt={alt}
      width={size}
      height={size}
      decoding="async"
      className={clsx('object-contain select-none', className)}
      style={{ width: size, height: size }}
    />
  );
}
