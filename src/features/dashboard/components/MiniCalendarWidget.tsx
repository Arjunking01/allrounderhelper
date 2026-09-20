interface MiniCalendarWidgetProps {
  /** ISO date strings ('YYYY-MM-DD') that should be highlighted as having a deadline */
  highlightedDates: Set<string>;
}

function toKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function MiniCalendarWidget({ highlightedDates }: MiniCalendarWidgetProps) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = toKey(year, month, today.getDate());

  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <div>
      <p className="text-sm font-medium text-navy-700 dark:text-ink-300 mb-3">
        {today.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
      </p>
      <div className="grid grid-cols-7 gap-1 text-center">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <span key={i} className="text-[10px] font-semibold text-navy-400 dark:text-ink-500">{d}</span>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <span key={`empty-${i}`} />;
          const key = toKey(year, month, day);
          const isToday = key === todayKey;
          const hasDeadline = highlightedDates.has(key);
          return (
            <div
              key={key}
              title={hasDeadline ? `${day} — has a deadline` : undefined}
              aria-label={`${day}${isToday ? ', today' : ''}${hasDeadline ? ', has a deadline' : ''}`}
              className={`relative flex h-7 items-center justify-center rounded-lg text-xs ${
                isToday ? 'gradient-brand text-white font-semibold' : 'text-navy-600 dark:text-ink-300'
              }`}
            >
              {day}
              {hasDeadline && !isToday && <span aria-hidden="true" className="absolute bottom-0.5 h-1 w-1 rounded-full bg-red-500" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
