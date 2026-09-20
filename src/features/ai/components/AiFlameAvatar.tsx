import { useEffect, useRef, useState } from 'react';
import { clsx } from '@/lib/utils/clsx';
import { usePreferencesStore } from '@/lib/store/preferences';

/**
 * AI Assistant header avatar: idle mascot that transforms into a real animated
 * CSS/SVG flame while the AI is thinking/generating, then extinguishes back
 * into the mascot when it finishes. Driven entirely by the `active` prop
 * (== isThinking || isGenerating in AiAssistantPage) — never a timer, never
 * connected to the separate Habit Tracker / dashboard productivity streak.
 *
 * Phase sequence (skipped in favor of a plain crossfade under reduced motion):
 *   idle -> drop (650ms, mascot sinks/squashes) -> transform (150ms, flame
 *   fades in) -> flame (holds for the entire active duration) -> extinguish
 *   (620ms, flame shrinks out while mascot fades back in) -> idle
 */

type FlamePhase = 'idle' | 'drop' | 'transform' | 'flame' | 'extinguish';

const DROP_MS = 650;
const APPEAR_MS = 150;
const EXTINGUISH_MS = 620;

function osPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

interface AiFlameAvatarProps {
  active: boolean;
  idleSrc: string;
  size?: number;
  className?: string;
  /** true (default) = full energetic living-flame motion, for actively streaming text.
   *  false = the same flame but calmer/slower with sparks suppressed, for the "thinking"
   *  gap before the first token arrives — active is still true (it's lit, not idle), it
   *  just shouldn't look as if it's already generating. */
  energetic?: boolean;
}

export function AiFlameAvatar({ active, idleSrc, size = 40, className, energetic = true }: AiFlameAvatarProps) {
  const appReduceMotion = usePreferencesStore((s) => s.reduceMotion);
  const [phase, setPhaseState] = useState<FlamePhase>('idle');
  const phaseRef = useRef<FlamePhase>('idle');
  const timers = useRef<number[]>([]);

  const setPhase = (p: FlamePhase) => {
    phaseRef.current = p;
    setPhaseState(p);
  };

  useEffect(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];

    const reduced = appReduceMotion || osPrefersReducedMotion();

    if (active) {
      if (phaseRef.current !== 'flame' && phaseRef.current !== 'transform' && phaseRef.current !== 'drop') {
        if (reduced) {
          setPhase('flame');
        } else {
          setPhase('drop');
          timers.current.push(window.setTimeout(() => setPhase('transform'), DROP_MS));
          timers.current.push(window.setTimeout(() => setPhase('flame'), DROP_MS + APPEAR_MS));
        }
      }
    } else if (phaseRef.current !== 'idle' && phaseRef.current !== 'extinguish') {
      if (reduced) {
        setPhase('idle');
      } else {
        setPhase('extinguish');
        timers.current.push(window.setTimeout(() => setPhase('idle'), EXTINGUISH_MS));
      }
    }

    return () => {
      timers.current.forEach((id) => window.clearTimeout(id));
      timers.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, appReduceMotion]);

  const showMascot = phase === 'idle' || phase === 'drop' || phase === 'extinguish';
  const showFlame = phase === 'transform' || phase === 'flame' || phase === 'extinguish';

  return (
    <div
      className={clsx('ai-flame2-wrap', `ai-flame2-phase-${phase}`, !energetic && phase === 'flame' && 'ai-flame2-calm', className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <div className="ai-flame2-chip flex h-full w-full items-center justify-center rounded-2xl gradient-brand p-1 text-white">
        {showMascot && (
          <img src={idleSrc} alt="" className={clsx('ai-flame2-mascot', `ai-flame2-mascot-${phase}`)} />
        )}
      </div>

      {showFlame && (
        <svg
          className={clsx('ai-flame2-svg', `ai-flame2-svg-${phase}`)}
          viewBox="0 0 64 64"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="ai-flame2-aura-grad" cx="50%" cy="62%" r="55%">
              <stop offset="0%" stopColor="#ffb454" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#ff7a1a" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="ai-flame2-body-grad" x1="0%" y1="100%" x2="10%" y2="0%">
              <stop offset="0%" stopColor="#ff5f0a" />
              <stop offset="55%" stopColor="#ff9d2e" />
              <stop offset="100%" stopColor="#ffd166" />
            </linearGradient>
            <linearGradient id="ai-flame2-back-grad" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#e0501a" />
              <stop offset="100%" stopColor="#ff8a3d" />
            </linearGradient>
            <linearGradient id="ai-flame2-core-grad" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#ffa93f" />
              <stop offset="100%" stopColor="#fff2c8" />
            </linearGradient>
          </defs>

          <circle className="ai-flame2-aura" cx="32" cy="38" r="20" fill="url(#ai-flame2-aura-grad)" />

          {/* A second, muted lobe peeking from behind the main body's left side — this is
              what makes the flame read as several licks of fire rather than one shape, and
              it sways on its own timing (see .ai-flame2-back-flicker) so it never moves in
              sync with the body. Purely decorative/asymmetric, drawn first so it sits behind. */}
          <path
            className="ai-flame2-back"
            fill="url(#ai-flame2-back-grad)"
            opacity="0.55"
            d="M25 49
               C 17 42 14 33 18 24
               C 16.5 32 18.5 39 23.5 45
               C 24 46.5 24.5 48 25 49 Z"
          />

          <circle className="ai-flame2-spark ai-flame2-spark-1" cx="23" cy="30" r="1.3" fill="#ffd166" />
          <circle className="ai-flame2-spark ai-flame2-spark-2" cx="39" cy="27" r="1" fill="#ffb454" />
          <circle className="ai-flame2-spark ai-flame2-spark-3" cx="31" cy="34" r="1.1" fill="#ffe0a3" />

          {/* Outer silhouette: deliberately asymmetric — left and right edges use different
              curve control points (not a mirrored teardrop), the tip is off-center, and the
              back lick above gives it a second, independently-swaying lobe. This shape was
              rendered and visually checked (not just described) before landing. */}
          <path
            className="ai-flame2-body"
            fill="url(#ai-flame2-body-grad)"
            d="M35 6
               C 25 15 18 24.5 18 34
               C 18 41 22 46.5 28 49
               C 32 50.5 37 50 41 47.5
               C 47 44 49.5 37 47 29.5
               C 44.5 22 39 15 35 6 Z"
          />

          {/* Small independent flicker near the tip — the fastest-moving, shortest-lived
              part of the shape, standing in for the "licking upward" tip motion instead of
              trying to fake it by deforming the whole outer path. Drawn as an additive
              overlay near the tip rather than carved into the outer contour, so it can
              never create a self-intersecting notch in the silhouette. */}
          <path
            className="ai-flame2-tip"
            fill="url(#ai-flame2-body-grad)"
            d="M35 6 C 33 10 32.8 14 34.5 17.5 C 36.5 13.5 36.8 9.5 35 6 Z"
          />

          <path
            className="ai-flame2-inner"
            fill="url(#ai-flame2-core-grad)"
            d="M30.5 22
               C 26.5 27.5 24.7 32.5 26 37.5
               C 26.9 41 28.8 43.5 31 45
               C 33.5 43.5 35.5 41 36.3 37
               C 37.5 31.5 35 26.5 30.5 22 Z"
          />
        </svg>
      )}
    </div>
  );
}
