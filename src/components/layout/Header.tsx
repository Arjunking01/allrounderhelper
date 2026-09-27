import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, Search, Settings } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from './ThemeToggle';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { useCommandPaletteStore } from '@/lib/store/commandPalette';
import { clsx } from '@/lib/utils/clsx';

const NAV_LINKS = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'AI Assistant', href: '/ai-assistant' },
  { label: 'Academic Tools', href: '/academic-tools' },
  { label: 'Productivity', href: '/productivity' },
  { label: 'Document Tools', href: '/document-tools' },
  { label: 'Creator Tools', href: '/creator-tools' },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const openCommandPalette = useCommandPaletteStore((s) => s.open);

  // Every other overlay in the app (Command Palette, dialogs, onboarding) closes on Escape —
  // the mobile nav panel didn't, which was an inconsistent keyboard trap for anyone using a
  // physical keyboard (Android tablets, Chromebooks, desktop-width testing of the mobile nav).
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-navy-100/80 dark:border-white/10 glass">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 gap-3">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold shrink-0">
          <Logo size={40} className="shrink-0" />
          <span className="hidden sm:inline">
            ALLROUNDER<span className="text-gradient-brand"> HELPER</span>
          </span>
        </Link>

        <nav className="hidden xl:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.href}
              to={link.href}
              className={({ isActive }) =>
                clsx(
                  'relative whitespace-nowrap rounded-full px-3 2xl:px-3.5 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'text-electric-500'
                    : 'text-navy-600 dark:text-ink-300 hover:text-electric-500'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="header-nav-active"
                      className="absolute inset-0 rounded-full bg-electric-500/10"
                      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                    />
                  )}
                  <span className="relative">{link.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <OfflineIndicator />
          <button
            onClick={openCommandPalette}
            className="hidden sm:flex items-center gap-2 rounded-full border border-navy-200 dark:border-white/10 px-3 py-1.5 text-sm text-navy-500 dark:text-ink-400 hover:border-electric-500 hover:text-electric-500 transition-colors"
            aria-label="Open search (Ctrl+K)"
          >
            <Search size={14} />
            <span className="hidden md:inline">Search</span>
            <kbd className="hidden md:inline whitespace-nowrap text-[10px] font-semibold border border-navy-200 dark:border-white/10 rounded px-1">Ctrl K</kbd>
          </button>
          <button
            onClick={openCommandPalette}
            className="sm:hidden flex h-9 w-9 items-center justify-center rounded-full border border-navy-200 dark:border-white/10 text-navy-500 dark:text-ink-400"
            aria-label="Open search"
          >
            <Search size={16} />
          </button>
          <Link to="/settings" aria-label="Settings" className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full border border-navy-200 dark:border-white/10 text-navy-500 dark:text-ink-400 hover:border-electric-500 hover:text-electric-500 transition-colors">
            <Settings size={16} />
          </Link>
          <ThemeToggle />
          <button
            className="xl:hidden flex h-9 w-9 items-center justify-center rounded-full border border-navy-200 dark:border-white/10"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
            aria-controls="mobile-nav"
          >
            {open ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.nav
            id="mobile-nav"
            key="mobile-nav"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="xl:hidden border-t border-navy-100 dark:border-white/10 px-4 py-3 flex flex-col gap-1 overflow-hidden"
          >
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.href}
                to={link.href}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  clsx(
                    'rounded-xl px-3 py-2.5 text-sm font-medium',
                    isActive ? 'text-electric-500 bg-electric-500/10' : 'text-navy-600 dark:text-ink-300'
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
            <NavLink
              to="/settings"
              onClick={() => setOpen(false)}
              className={({ isActive }) => clsx('rounded-xl px-3 py-2.5 text-sm font-medium flex items-center gap-2', isActive ? 'text-electric-500 bg-electric-500/10' : 'text-navy-600 dark:text-ink-300')}
            >
              <Settings size={14} /> Settings
            </NavLink>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
