import type { LucideIcon } from 'lucide-react';
import { FileQuestion, Home, Info, Mail, BarChart3, Sparkles } from 'lucide-react';
import { academicTools } from './toolsRegistry';
import { productivityTools } from './productivityRegistry';
import { documentTools } from './documentToolsRegistry';
import { creatorTools } from './creatorToolsRegistry';

export interface SearchableItem {
  id: string;
  title: string;
  subtitle: string;
  path: string;
  icon: LucideIcon;
  section: 'Academic Tools' | 'Productivity' | 'Document Tools' | 'Creator Tools' | 'Pages';
}

export function getAllSearchableItems(): SearchableItem[] {
  const academic: SearchableItem[] = academicTools.map((t) => ({
    id: `academic-${t.slug}`, title: t.name, subtitle: t.tagline, path: `/academic-tools/${t.slug}`, icon: t.icon, section: 'Academic Tools',
  }));
  const productivity: SearchableItem[] = productivityTools.map((t) => ({
    id: `productivity-${t.slug}`, title: t.name, subtitle: t.tagline, path: `/productivity/${t.slug}`, icon: t.icon, section: 'Productivity',
  }));
  const document: SearchableItem[] = documentTools.map((t) => ({
    id: `document-${t.slug}`, title: t.name, subtitle: t.tagline, path: `/document-tools/${t.slug}`, icon: t.icon, section: 'Document Tools',
  }));
  const creator: SearchableItem[] = creatorTools.map((t) => ({
    id: `creator-${t.slug}`, title: t.name, subtitle: t.tagline, path: `/creator-tools/${t.slug}`, icon: t.icon, section: 'Creator Tools',
  }));
  const pages: SearchableItem[] = [
    { id: 'page-home', title: 'Home', subtitle: 'Back to the homepage', path: '/', icon: Home, section: 'Pages' },
    { id: 'page-dashboard', title: 'Dashboard', subtitle: 'Your personal overview', path: '/dashboard', icon: Home, section: 'Pages' },
    { id: 'page-analytics', title: 'Analytics', subtitle: 'Academic performance and productivity trends', path: '/analytics', icon: BarChart3, section: 'Pages' },
    { id: 'page-ai-assistant', title: 'AI Study Assistant', subtitle: 'Chat interface — homework help, study plans, and more', path: '/ai-assistant', icon: Sparkles, section: 'Pages' },
    { id: 'page-about', title: 'About', subtitle: 'About ALLROUNDER HELPER', path: '/about', icon: Info, section: 'Pages' },
    { id: 'page-contact', title: 'Contact', subtitle: 'Get in touch', path: '/contact', icon: Mail, section: 'Pages' },
    { id: 'page-settings', title: 'Settings', subtitle: 'Appearance, accessibility, data', path: '/settings', icon: FileQuestion, section: 'Pages' },
  ];
  return [...academic, ...productivity, ...document, ...creator, ...pages];
}
