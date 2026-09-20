import { useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';
import { clsx } from '@/lib/utils/clsx';

interface TiltCardProps {
  to: string;
  className?: string;
  children: ReactNode;
  /** Max rotation in degrees. Kept small (default 5°) — this is meant to read as the
   *  card gently acknowledging the cursor, not a showpiece 3D effect. */
  maxTilt?: number;
}

/** Detects a coarse (touch) primary pointer once, synchronously, so the very first
 *  pointermove on a touch device never applies a tilt that would then feel "stuck"
 *  until the next pointerleave. Touch devices get the plain hover/elevation styling
 *  already on the wrapped content — no tilt physics, no mouse-follow math. */
function isCoarsePointer(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  try {
    return window.matchMedia('(pointer: coarse)').matches;
  } catch {
    return false;
  }
}

/**
 * Restrained 3D tilt wrapper for a small, curated set of cards (homepage category
 * cards) — deliberately NOT applied to dense tool grids, where static cards with a
 * simple hover elevation scan faster and feel more appropriate. Renders a real
 * react-router `<Link>` (not a plain `<a>`) so navigation stays client-side.
 */
export function TiltCard({ to, className, children, maxTilt = 5 }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const coarse = useRef(isCoarsePointer());

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springConfig = { stiffness: 300, damping: 30, mass: 0.6 };
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [maxTilt, -maxTilt]), springConfig);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-maxTilt, maxTilt]), springConfig);

  const skip = reduced || coarse.current;

  function handlePointerMove(e: React.PointerEvent) {
    if (skip || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handlePointerLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={skip ? undefined : { rotateX, rotateY, transformPerspective: 800 }}
      className="h-full will-change-transform"
    >
      <Link to={to} className={clsx('h-full', className)}>
        {children}
      </Link>
    </motion.div>
  );
}
