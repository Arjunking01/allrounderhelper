import { useEffect, useRef, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { usePreferencesStore } from '@/lib/store/preferences';
import { useProductivityInsights } from '@/hooks/useProductivityInsights';
import { useDailyRoutine } from '@/features/productivity/logic/useDailyRoutine';
import type { CountdownExam } from '@/features/productivity/logic/examCountdownTypes';
import { daysRemaining } from '@/features/productivity/logic/examCountdownTypes';
import type { Goal } from '@/features/productivity/logic/goalTypes';

const LAST_VISIT_KEY = 'ar-last-visit';
// A "genuine return" is several hours away, not a page reload or a route change during the
// same sitting \u2014 see the read-then-update-once pattern below for how repeats within one
// visit are avoided without a separate session flag.
const RETURN_THRESHOLD_MS = 6 * 60 * 60 * 1000;
const IMMINENT_EXAM_DAYS = 14;

export interface WelcomeBackState {
  show: boolean;
  message: string;
  actionLabel?: string;
  actionHref?: string;
  reduceMotion: boolean;
  dismiss: () => void;
}

function osPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/**
 * Detects a meaningful return visit (several hours away, not a reload or route change during
 * the same sitting) and picks one honest, context-aware greeting from real existing local data
 * \u2014 never fabricated. Read-only against every source except its own last-visit timestamp.
 *
 * Return detection: reads the previous `ar-last-visit` value once per mount (guarded by a ref
 * so effect re-invocation, e.g. React StrictMode's dev double-invoke, can't double-fire it),
 * compares it to now, then immediately overwrites it with now. That overwrite is what keeps a
 * second page during the same visit \u2014 or a reload a minute later \u2014 from re-triggering: the
 * stored timestamp is already "recent" by the time anything re-mounts. No separate session
 * flag needed for the cooldown.
 */
export function useWelcomeBack(): WelcomeBackState {
  // '' (not null) is the "never visited before" sentinel \u2014 useLocalStorage's stored-value type
  // guard compares typeof against the initial value, and typeof null is 'object', which would
  // mismatch against a persisted string and silently discard it on every read. See
  // useLocalStorage.ts's readValue().
  const [lastVisit, setLastVisit] = useLocalStorage<string>(LAST_VISIT_KEY, '');
  const reduceMotionPref = usePreferencesStore((s) => s.reduceMotion);
  const reduceMotion = reduceMotionPref || osPrefersReducedMotion();

  const { streak } = useProductivityInsights();
  const { items: routineItems } = useDailyRoutine();
  const [exams] = useLocalStorage<CountdownExam[]>('ar-exam-countdowns', []);
  const [goals] = useLocalStorage<Goal[]>('ar-goals', []);

  const evaluatedRef = useRef(false);
  const [isGenuineReturn, setIsGenuineReturn] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (evaluatedRef.current) return;
    evaluatedRef.current = true;

    const now = Date.now();
    const previous = lastVisit ? new Date(lastVisit).getTime() : NaN;
    const genuineReturn = Number.isFinite(previous) && now - previous >= RETURN_THRESHOLD_MS;

    setIsGenuineReturn(genuineReturn);
    setLastVisit(new Date(now).toISOString());
    // First-ever visit (lastVisit === '') intentionally never counts as a return \u2014 there is
    // nothing to have missed yet.
  }, [lastVisit, setLastVisit]);

  const nextExam = exams
    .filter((e) => daysRemaining(e.date) >= 0)
    .sort((a, b) => daysRemaining(a.date) - daysRemaining(b.date))[0];
  const activeGoal = goals.find((g) => !g.completed && g.progress > 0 && g.progress < 100) ?? goals.find((g) => !g.completed);
  const hasRoutine = routineItems.some((it) => it.enabled);

  let message = 'Welcome back.';
  let actionLabel: string | undefined;
  let actionHref: string | undefined;

  // Deterministic priority: imminent exam > active goal > Daily Routine > streak/progress > generic.
  // Each branch only fires when its own data actually exists \u2014 nothing here is guessed.
  if (nextExam && daysRemaining(nextExam.date) <= IMMINENT_EXAM_DAYS) {
    const days = daysRemaining(nextExam.date);
    message = days === 0
      ? `Welcome back \u2014 ${nextExam.subject} is today. Ready to go?`
      : `Welcome back \u2014 ${nextExam.subject} is coming up in ${days} day${days === 1 ? '' : 's'}.`;
    actionLabel = 'View exam countdown';
    actionHref = '/productivity/exam-countdown';
  } else if (activeGoal) {
    message = `Good to see you again. Your goal "${activeGoal.title}" is still waiting for you.`;
    actionLabel = 'Open Goal Tracker';
    actionHref = '/productivity/goal-tracker';
  } else if (hasRoutine) {
    message = "Welcome back. Your routine is ready when you are.";
    actionLabel = 'View routine';
    actionHref = '/productivity/daily-routine';
  } else if (streak > 0) {
    message = `Good to see you again \u2014 you're on a ${streak}-day streak. Keep it going.`;
    actionLabel = 'Open Plan My Day';
    actionHref = '/productivity/plan-my-day';
  } else {
    message = 'I missed you. Ready to get started?';
  }

  return {
    show: isGenuineReturn && !dismissed,
    message,
    actionLabel,
    actionHref,
    reduceMotion,
    dismiss: () => setDismissed(true),
  };
}
