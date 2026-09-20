export type Quadrant = 'urgent-important' | 'not-urgent-important' | 'urgent-not-important' | 'not-urgent-not-important';

export interface MatrixItem {
  id: string;
  text: string;
  quadrant: Quadrant;
  done: boolean;
}

export const QUADRANTS: { key: Quadrant; title: string; subtitle: string; tone: string }[] = [
  { key: 'urgent-important', title: 'Do first', subtitle: 'Urgent & important', tone: 'border-red-400/40 bg-red-400/5' },
  { key: 'not-urgent-important', title: 'Schedule', subtitle: 'Important, not urgent', tone: 'border-electric-400/40 bg-electric-400/5' },
  { key: 'urgent-not-important', title: 'Delegate', subtitle: 'Urgent, not important', tone: 'border-amber-400/40 bg-amber-400/5' },
  { key: 'not-urgent-not-important', title: 'Eliminate', subtitle: 'Neither urgent nor important', tone: 'border-navy-300/40 bg-navy-100/30 dark:bg-white/5' },
];
