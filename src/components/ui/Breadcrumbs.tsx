import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={`flex items-center gap-1.5 text-sm text-navy-500 dark:text-ink-500 flex-wrap ${className ?? ''}`}>
      <Link to="/" className="flex items-center gap-1 hover:text-electric-500 transition-colors">
        <Home size={14} />
        <span className="sr-only">Home</span>
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <ChevronRight size={14} className="opacity-50" />
          {item.href ? (
            <Link to={item.href} className="hover:text-electric-500 transition-colors">
              {item.label}
            </Link>
          ) : (
            <span aria-current="page" className="text-navy-800 dark:text-ink-200 font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function breadcrumbJsonLd(items: Crumb[], siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      ...items.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 2,
        name: item.label,
        item: item.href ? `${siteUrl}${item.href}` : undefined,
      })),
    ],
  };
}
