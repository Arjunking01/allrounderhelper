import {
  Palette, Sparkles, Shuffle, RectangleHorizontal, Scan, Printer, ImageIcon, Ruler,
  type LucideIcon,
} from 'lucide-react';

export interface CreatorToolMeta {
  slug: string;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
}

export const creatorTools: CreatorToolMeta[] = [
  { slug: 'color-picker', name: 'Color Picker', shortName: 'Color Picker', tagline: 'Pick, convert, and save colors with a contrast checker.', description: 'A professional color picker with HEX, RGB, HSL, and HSV conversion, contrast/accessibility scoring, recent colors, and saved palettes.', icon: Palette },
  { slug: 'gradient-generator', name: 'Gradient Generator', shortName: 'Gradient Generator', tagline: 'Design linear, radial, and conic gradients visually.', description: 'Build multi-stop linear, radial, and conic gradients with live preview, and copy the result as CSS or Tailwind classes.', icon: Sparkles },
  { slug: 'palette-generator', name: 'Palette Generator', shortName: 'Palette Generator', tagline: 'Generate harmonious color palettes instantly.', description: 'Generate complementary, analogous, triadic, and monochromatic palettes, lock colors you like, and export as JSON, CSS, or PNG.', icon: Shuffle },
  { slug: 'aspect-ratio-calculator', name: 'Aspect Ratio Calculator', shortName: 'Aspect Ratio', tagline: 'Get exact dimensions for every social platform.', description: 'Calculate exact pixel dimensions for YouTube, Instagram, Pinterest, Facebook, LinkedIn, TikTok, and custom aspect ratios.', icon: RectangleHorizontal },
  { slug: 'resolution-calculator', name: 'Resolution Calculator', shortName: 'Resolution Calculator', tagline: 'Convert between pixels, PPI, DPI, and print size.', description: 'Convert between pixel dimensions, PPI/DPI, screen size, and print size for accurate image scaling.', icon: Scan },
  { slug: 'dpi-calculator', name: 'DPI Calculator', shortName: 'DPI Calculator', tagline: 'Find the right DPI for sharp printed results.', description: 'Calculate the recommended print DPI for an image and get quality guidance before you print.', icon: Printer },
  { slug: 'thumbnail-safe-zone-checker', name: 'Thumbnail Safe Zone Checker', shortName: 'Safe Zone Checker', tagline: 'Preview thumbnails against platform UI overlays.', description: 'Upload a thumbnail and preview it against YouTube, Pinterest, and Instagram safe-zone overlay guides before publishing.', icon: ImageIcon },
  { slug: 'social-media-size-guide', name: 'Social Media Size Guide', shortName: 'Size Guide', tagline: 'Look up the latest dimensions for every platform.', description: 'A searchable, favoritable reference of current image and video dimensions across major social platforms.', icon: Ruler },
];

export function getCreatorToolBySlug(slug: string): CreatorToolMeta | undefined {
  return creatorTools.find((t) => t.slug === slug);
}
