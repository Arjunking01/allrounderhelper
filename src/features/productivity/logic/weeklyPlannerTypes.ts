export interface WeeklyItem {
  id: string;
  day: string; // 'Mon'..'Sun'
  title: string;
  label: 'subject' | 'task';
  color: string;
}

export const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const LABEL_COLORS = ['#3b6dfb', '#8b3ffb', '#17cf8f', '#fb923c', '#f43f5e', '#06b6d4'];
