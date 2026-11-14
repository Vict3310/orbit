import { cn } from '../ui';

export function metricTone(pct: number, worseWhen: 'up' | 'down' | 'either' = 'either'): string {
  const magnitude = Math.abs(pct);
  if (magnitude < 5) return 'text-muted';
  const isBad =
    worseWhen === 'either'
      ? false
      : (pct > 0 && worseWhen === 'up') || (pct < 0 && worseWhen === 'down');
  if (!isBad) return 'text-ok';
  return magnitude >= 20 ? 'text-critical' : 'text-caution';
}

export function MetricDelta({
  pct,
  worseWhen = 'either',
  digits = 1,
  prefix = '',
  className,
}: {
  pct: number;
  worseWhen?: 'up' | 'down' | 'either';
  digits?: number;
  prefix?: string;
  className?: string;
}) {
  const label = `${pct > 0 ? '+' : ''}${pct.toFixed(digits)}%`;
  const direction = Math.abs(pct) < 0.05 ? 'no deviation' : pct > 0 ? 'above baseline' : 'below baseline';
  return (
    <span
      className={cn('font-mono text-[10px] leading-none', metricTone(pct, worseWhen), className)}
      title={`${prefix}${label} ${direction}`}
    >
      {prefix}
      {label}
    </span>
  );
}

export function deviationPct(current: number, baseline: number): number {
  if (!Number.isFinite(current) || !Number.isFinite(baseline) || baseline === 0) return 0;
  return ((current - baseline) / baseline) * 100;
}
