import { useId, type ReactNode } from 'react';
import { clsx } from '@/lib/utils/clsx';

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  label?: string;
}

export function ProgressBar({ value, className, label }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const generatedId = useId();
  const labelId = label ? generatedId : undefined;
  return (
    <div className={className}>
      {label && <p id={labelId} className="text-xs text-navy-500 dark:text-ink-500 mb-1">{label}</p>}
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ? undefined : 'Progress'}
        aria-labelledby={labelId}
        className="h-1.5 w-full rounded-full bg-navy-100 dark:bg-white/10 overflow-hidden"
      >
        <div className="h-full gradient-brand transition-all duration-500" style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}

interface SeriesPoint { label: string; value: number }

function buildPath(points: SeriesPoint[], width: number, height: number, padding: number) {
  const max = Math.max(...points.map((p) => p.value), 1);
  const min = Math.min(...points.map((p) => p.value), 0);
  const range = max - min || 1;
  const step = (width - padding * 2) / Math.max(1, points.length - 1);
  const coords = points.map((p, i) => ({
    x: padding + i * step,
    y: padding + (1 - (p.value - min) / range) * (height - padding * 2),
  }));
  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
  return { coords, linePath };
}

interface LineChartProps {
  data: SeriesPoint[];
  width?: number;
  height?: number;
  className?: string;
  unit?: string;
  label?: string;
}

/** A labeled line chart for trend data (e.g. productivity score or focus minutes over time). */
export function LineChart({ data, width = 480, height = 160, className, unit = '', label = 'Line chart' }: LineChartProps) {
  if (data.length === 0) return null;
  const padding = 24;
  const { coords, linePath } = buildPath(data, width, height, padding);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={clsx('w-full h-auto', className)} role="img" aria-label={label}>
      <path d={linePath} fill="none" stroke="var(--accent-from)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {coords.map((c, i) => (
        <g key={i}>
          <circle cx={c.x} cy={c.y} r={3} fill="var(--accent-to)" />
          <title>{data[i].label}: {data[i].value}{unit}</title>
        </g>
      ))}
    </svg>
  );
}

interface AreaChartProps {
  data: SeriesPoint[];
  width?: number;
  height?: number;
  className?: string;
  label?: string;
}

/** Filled area variant of LineChart, for cumulative-feeling metrics (e.g. weekly focus minutes). */
export function AreaChart({ data, width = 480, height = 160, className, label = 'Area chart' }: AreaChartProps) {
  const gradientId = useId();
  if (data.length === 0) return null;
  const padding = 24;
  const { coords, linePath } = buildPath(data, width, height, padding);
  const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${height - padding} L ${coords[0].x} ${height - padding} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={clsx('w-full h-auto', className)} role="img" aria-label={label}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent-from)" stopOpacity={0.35} />
          <stop offset="100%" stopColor="var(--accent-from)" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
      <path d={linePath} fill="none" stroke="var(--accent-from)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface PieChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
  className?: string;
  label?: string;
}

/** A simple SVG pie/donut chart for proportional breakdowns (e.g. task status split). */
export function PieChart({ data, size = 140, className, label = 'Pie chart' }: PieChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return null;

  const radius = size / 2;
  const innerRadius = radius * 0.6;
  let cumulativeAngle = -90;

  function arcPath(startAngle: number, endAngle: number) {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const x1 = radius + radius * Math.cos(toRad(startAngle));
    const y1 = radius + radius * Math.sin(toRad(startAngle));
    const x2 = radius + radius * Math.cos(toRad(endAngle));
    const y2 = radius + radius * Math.sin(toRad(endAngle));
    const ix1 = radius + innerRadius * Math.cos(toRad(endAngle));
    const iy1 = radius + innerRadius * Math.sin(toRad(endAngle));
    const ix2 = radius + innerRadius * Math.cos(toRad(startAngle));
    const iy2 = radius + innerRadius * Math.sin(toRad(startAngle));
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix2} ${iy2} Z`;
  }

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className={className} role="img" aria-label={label}>
      {data.map((d, i) => {
        const angle = (d.value / total) * 360;
        const path = arcPath(cumulativeAngle, cumulativeAngle + angle);
        cumulativeAngle += angle;
        return (
          <path key={i} d={path} fill={d.color}>
            <title>{d.label}: {d.value}</title>
          </path>
        );
      })}
    </svg>
  );
}

interface ProgressRingProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
  children?: ReactNode;
}

/** A circular progress indicator, reusable anywhere a ring visual is needed. */
export function ProgressRing({ value, size = 96, strokeWidth = 8, className, children }: ProgressRingProps) {
  const gradientId = useId();
  const clamped = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className={clsx('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-navy-100 dark:text-white/10" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={`url(#${gradientId})`} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={circumference * (1 - clamped / 100)}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--accent-from)" />
            <stop offset="100%" stopColor="var(--accent-to)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}
interface SparklineProps {
  values: number[];
  className?: string;
  width?: number;
  height?: number;
  label?: string;
}

/** A minimal inline trend line — no charting library needed for simple "last N days" visuals. */
export function Sparkline({ values, className, width = 120, height = 32, label = 'Trend chart' }: SparklineProps) {
  if (values.length === 0) return null;
  const max = Math.max(...values, 1);
  const step = width / Math.max(1, values.length - 1);
  const points = values.map((v, i) => `${i * step},${height - (v / max) * height}`).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className={clsx('overflow-visible', className)} role="img" aria-label={label}>
      <polyline points={points} fill="none" stroke="var(--accent-from)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
