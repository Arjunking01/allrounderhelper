interface WeeklyBarChartProps {
  data: { label: string; value: number }[];
  unit?: string;
}

export function WeeklyBarChart({ data, unit = '' }: WeeklyBarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="flex items-end gap-2 h-32">
      {data.map((d) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1.5 group">
          <span className="text-[10px] text-navy-400 dark:text-ink-500 opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">
            {d.value}{unit}
          </span>
          <div
            title={`${d.value}${unit}`}
            role="img"
            aria-label={`${d.label}: ${d.value}${unit}`}
            className="w-full rounded-t-md gradient-brand transition-all duration-500"
            style={{ height: `${Math.max(4, (d.value / max) * 100)}%` }}
          />
          <span className="text-[10px] text-navy-400 dark:text-ink-500">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
