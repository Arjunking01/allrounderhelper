import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface RevealProps {
  children: ReactNode;
  /** Stagger index — multiplied by a small per-item delay. Capped so long lists never feel slow. */
  index?: number;
  className?: string;
  /** Vertical offset in px before entrance. Kept small — this is a settle-in, not a slide. */
  y?: number;
}

/**
 * Shared "settle in" entrance used for section/widget-grid content — the same restrained
 * opacity + small-translate pattern already used on the homepage (HomePage.tsx), extracted
 * here so pages like the dashboard can reuse it consistently instead of inventing new timing.
 * Plays once when scrolled into view; respects the app-wide MotionConfig reducedMotion setting
 * (see App.tsx), so no extra reduced-motion handling is needed here.
 */
export function Reveal({ children, index = 0, className, y = 12 }: RevealProps) {
  const delay = Math.min(index, 6) * 0.04;
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.3, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
