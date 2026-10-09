import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Sparkles, Calculator, ListTodo, FileText, LayoutDashboard, Star, ArrowRight } from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Button } from './ui/Button';
import { Logo } from './ui/Logo';

const STORAGE_KEY = 'ar-onboarding-seen';

const SLIDES = [
  {
    icon: Sparkles,
    brand: true,
    title: 'Welcome to ALLROUNDER HELPER',
    body: 'One place to calculate, plan, organize, and study smarter — free academic calculators, productivity tools, document utilities, and an AI study assistant.',
  },
  {
    icon: Calculator,
    title: 'Academic Tools',
    body: 'CGPA, SGPA, attendance, percentage, and more — calculators built specifically for coursework and grading.',
  },
  {
    icon: ListTodo,
    title: 'Productivity Tools',
    body: 'Pomodoro timer, habit tracker, planners, and a calendar to keep your study routine on track.',
  },
  {
    icon: FileText,
    title: 'Document & Creator Tools',
    body: 'Merge, split, and compress PDFs, convert images, and use color/design tools — all processed on-device.',
  },
  {
    icon: Sparkles,
    title: 'AI Study Assistant',
    body: 'Ask questions, get concept explanations, or get tool recommendations. Look for the floating "Ask AI" button on any page.',
  },
  {
    icon: LayoutDashboard,
    title: 'Your Dashboard',
    body: 'Recently used tools, favorites, and study progress are all saved locally and shown on your personal dashboard.',
  },
];

export function OnboardingTour() {
  const [seen, setSeen] = useLocalStorage(STORAGE_KEY, false);
  const [step, setStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(true);
  const dialogRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const active = !seen;

  useFocusTrap(dialogRef, active);

  // Lock body scroll while the onboarding dialog is open so background content can't be
  // scrolled behind it via touch on mobile.
  useEffect(() => {
    if (!active) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [active]);

  if (!active) return null;

  function close(navigateTo?: string) {
    if (dontShowAgain) setSeen(true);
    if (navigateTo) navigate(navigateTo);
  }

  const slide = SLIDES[step];
  const isLast = step === SLIDES.length - 1;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-navy-950/60 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      onKeyDown={(e) => { if (e.key === 'Escape') close(); }}
    >
      <div
        ref={dialogRef}
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white dark:bg-navy-900 border border-navy-100 dark:border-white/10 shadow-2xl p-6 sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          {'brand' in slide && slide.brand ? (
            // Welcome slide: the official emblem, not a generic icon. Transparent PNG, so no tile behind it.
            <Logo size={56} className="shrink-0" />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl gradient-brand text-white shrink-0">
              <slide.icon size={20} />
            </div>
          )}
          <button
            onClick={() => close()}
            aria-label="Skip onboarding"
            className="flex h-8 w-8 items-center justify-center rounded-full text-navy-400 hover:bg-navy-100 dark:hover:bg-white/10"
          >
            <X size={16} />
          </button>
        </div>

        <h2 id="onboarding-title" className="mt-4 text-lg font-semibold text-navy-900 dark:text-ink-100">
          {slide.title}
        </h2>
        <p className="mt-2 text-sm text-navy-500 dark:text-ink-500 leading-relaxed">{slide.body}</p>

        <div className="mt-5 flex items-center justify-center gap-1.5">
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-electric-500' : 'w-1.5 bg-navy-200 dark:bg-white/15'}`}
            />
          ))}
        </div>

        <label className="mt-5 flex items-center gap-2 text-xs text-navy-500 dark:text-ink-500">
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            className="rounded border-navy-300"
          />
          Don't show this again
        </label>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={() => close()}>
            Skip
          </Button>
          {isLast ? (
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" size="sm" icon={<Star size={14} />} onClick={() => close('/dashboard')}>
                View Dashboard
              </Button>
              <Button size="sm" onClick={() => close()}>Finish</Button>
            </div>
          ) : (
            <Button size="sm" icon={<ArrowRight size={14} />} onClick={() => setStep((s) => s + 1)}>
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
