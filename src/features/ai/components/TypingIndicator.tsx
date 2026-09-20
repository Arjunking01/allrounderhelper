import { useEffect, useState } from 'react';
import { AiFlameAvatar } from './AiFlameAvatar';
import aiAvatar from '@/assets/ai-character/allrounder-ai-avatar.png';

/** Honest, time-based progression — not fabricated pipeline stages (this app makes a single
 *  direct request to the provider, no retrieval/tool steps happen), so the copy only ever
 *  claims what's actually true: that a request is in flight and roughly how long it's taken. */
const STAGES = [
  { afterMs: 0, label: 'Thinking...' },
  { afterMs: 2500, label: 'Still working on it...' },
  { afterMs: 6000, label: 'Almost there...' },
];

export function TypingIndicator({ providerName }: { providerName?: string }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => setElapsed(Date.now() - start), 400);
    return () => clearInterval(timer);
  }, []);

  const stage = [...STAGES].reverse().find((s) => elapsed >= s.afterMs) ?? STAGES[0];

  return (
    <div className="flex items-center gap-3 max-w-2xl" aria-live="polite" aria-label={`${stage.label}${providerName ? ` — ${providerName}` : ''}`}>
      {/* Same flame identity as the header and every AI message avatar (AiFlameAvatar) —
       *  one visual character for the AI across the whole conversation, not a separate
       *  generic icon just for this loading state. `active` is always true here since
       *  this component only ever renders while a response is in flight. */}
      <AiFlameAvatar active idleSrc={aiAvatar} size={32} className="shrink-0" />
      
      <div className="glass-panel rounded-2xl px-4 py-3 flex items-center gap-2.5">
        <span className="text-sm text-navy-500 dark:text-ink-400 transition-opacity">{stage.label}</span>
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-navy-400 dark:bg-ink-400 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
