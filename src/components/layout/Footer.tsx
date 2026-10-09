import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

const RELATED_PROJECTS = [
  { name: 'ALLROUNDER CALCULATOR', tagline: 'Professional calculators for students and everyday use.', href: 'https://allroundercalculator.pages.dev', logo: '/icons/allrounder-calculator-logo.png' },
  { name: 'ARTISTIC AURA', tagline: 'Creative design portfolio and digital artwork.', href: 'https://artisticaura001.vercel.app', logo: '/icons/artistic-aura-logo.jpg' },
];

// Real brand glyphs (not generic Lucide stand-ins) so the marks are actually recognizable.
function YouTubeIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.5 6.2a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.56A3.02 3.02 0 0 0 .5 6.2 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.8 3.02 3.02 0 0 0 2.12 2.14C4.5 20.5 12 20.5 12 20.5s7.5 0 9.38-.56a3.02 3.02 0 0 0 2.12-2.14A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.4 3.6-6.4 3.6Z" />
    </svg>
  );
}
function InstagramIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
      <circle cx="12" cy="12" r="4.3" />
      <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

const SOCIAL_LINKS = [
  { label: 'YouTube', icon: YouTubeIcon, href: 'https://youtube.com/@artistic.aura.001?si=dEPdR7heOCdll8gG' },
  { label: 'Instagram', icon: InstagramIcon, href: 'https://www.instagram.com/artistic.aura.001?igsh=aXJrd3htOWNxZzB5' },
];

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Tools',
    links: [
      { label: 'Academic Tools', href: '/academic-tools' },
      { label: 'Productivity', href: '/productivity' },
      { label: 'Document Tools', href: '/document-tools' },
      { label: 'Creator Tools', href: '/creator-tools' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy-policy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Disclaimer', href: '/disclaimer' },
      { label: 'Cookie Policy', href: '/cookie-policy' },
    ],
  },
];

export function Footer() {
  // pb on phones keeps the last footer row clear of the fixed "Ask AI" button when scrolled to the end.
  return (
    <footer className="border-t border-navy-100 dark:border-white/10 mt-24 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] sm:pb-0">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14 grid grid-cols-2 sm:grid-cols-4 gap-10">
        <div className="col-span-2 sm:col-span-1">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold">
            <Logo size={40} className="shrink-0" />
            ALLROUNDER HELPER
          </Link>
          <p className="mt-3 text-sm text-navy-500 dark:text-ink-500 max-w-xs">
            The everyday platform for students to calculate, plan, organize, and study smarter.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h3 className="text-sm font-semibold text-navy-900 dark:text-ink-100 mb-3">{col.title}</h3>
            <ul className="space-y-2">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-navy-500 dark:text-ink-500 hover:text-electric-500 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-navy-100 dark:border-white/10 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="text-sm text-navy-500 dark:text-ink-500 mb-4">More from the team behind ALLROUNDER HELPER:</p>
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            {RELATED_PROJECTS.map((p) => (
              <a key={p.href} href={p.href} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 rounded-xl border border-navy-100 dark:border-white/10 p-4 hover:border-electric-500 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <img src={p.logo} alt={`${p.name} logo`} className="h-9 w-9 rounded-lg object-cover shrink-0" loading="lazy" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-navy-900 dark:text-ink-100">{p.name}</p>
                    <p className="text-xs text-navy-500 dark:text-ink-500 mt-0.5">{p.tagline}</p>
                  </div>
                </div>
                <ExternalLink size={14} className="text-navy-400 shrink-0" />
              </a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {SOCIAL_LINKS.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="flex h-9 w-9 items-center justify-center rounded-full border border-navy-100 dark:border-white/10 text-navy-500 dark:text-ink-500 hover:text-electric-500 hover:border-electric-500 transition-colors">
                <s.icon size={16} />
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-navy-100 dark:border-white/10 py-6">
        <p className="text-center text-xs text-navy-400 dark:text-ink-500">
          © {new Date().getFullYear()} ALLROUNDER HELPER. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
