import { Moon, Sun, Monitor } from 'lucide-react';
import { useThemeStore } from '@/lib/store/theme';

const LABEL: Record<string, string> = { light: 'Light theme active — switch to dark', dark: 'Dark theme active — switch to system', system: 'Following system theme — switch to light' };

export function ThemeToggle() {
  const { theme, toggle } = useThemeStore();
  return (
    <button
      onClick={toggle}
      aria-label={LABEL[theme]}
      className="relative flex h-9 w-9 items-center justify-center rounded-full border border-navy-200 dark:border-white/10 text-navy-600 dark:text-ink-300 hover:border-electric-500 hover:text-electric-500 transition-colors"
    >
      {theme === 'dark' ? <Moon size={16} /> : theme === 'light' ? <Sun size={16} /> : <Monitor size={16} />}
    </button>
  );
}
