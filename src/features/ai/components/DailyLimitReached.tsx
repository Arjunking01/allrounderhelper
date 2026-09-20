import { Link } from 'react-router-dom';
import { Calculator, ListTodo, FileText, Palette, Sparkles } from 'lucide-react';

const SUGGESTIONS = [
  { label: 'Academic Calculators', description: 'CGPA, attendance, percentage & more', href: '/academic-tools', icon: Calculator },
  { label: 'Productivity Tools', description: 'Planner, Pomodoro, habit tracker', href: '/productivity', icon: ListTodo },
  { label: 'PDF & Document Tools', description: 'Merge, compress, convert files', href: '/document-tools', icon: FileText },
  { label: 'Creator Tools', description: 'Color picker, palettes, gradients', href: '/creator-tools', icon: Palette },
];

export function DailyLimitReached({ limit }: { limit: number }) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl gradient-brand text-white">
          <Sparkles size={20} />
        </div>
        <h2 className="text-lg font-semibold text-navy-900 dark:text-ink-100">
          You've used today's free chats
        </h2>
        <p className="mt-2 text-sm text-navy-500 dark:text-ink-500">
          Please come back tomorrow — your {limit} free daily chats reset at midnight.
          In the meantime, here's the rest of ALLROUNDER HELPER.
        </p>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          {SUGGESTIONS.map((s) => (
            <Link
              key={s.href}
              to={s.href}
              className="flex items-start gap-3 rounded-xl border border-navy-100 dark:border-white/10 p-3.5 hover:border-electric-500 hover:bg-electric-500/5 transition-colors"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-electric-500/10 text-electric-600 dark:text-electric-400">
                <s.icon size={16} />
              </span>
              <span>
                <span className="block text-sm font-medium text-navy-900 dark:text-ink-100">{s.label}</span>
                <span className="block text-xs text-navy-500 dark:text-ink-500 mt-0.5">{s.description}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
