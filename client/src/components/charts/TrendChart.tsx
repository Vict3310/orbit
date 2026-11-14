import { useId, useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  type TooltipProps,
  XAxis,
  YAxis,
} from 'recharts';
import { useReducedMotion } from 'framer-motion';
import { formatClock, formatMET } from '../../lib/format';
import { cn } from '../ui';

export interface ChartSeries {
  key: string;
  label: string;
  color: string;
  unit?: string;
  dashed?: boolean;
}

export interface ChartMarker {
  minute: number;
  label: string;
  tone: 'info' | 'caution' | 'critical';
}

export interface ChartPoint {
  minute: number;
  [key: string]: number | string | null;
}

const MARKER_COLOR: Record<ChartMarker['tone'], string> = {
  info: '#94A5B5',
  caution: '#F2BA68',
  critical: '#F27676',
};

function ChartTooltip({
  active,
  payload,
  label,
  series,
}: TooltipProps<number, string> & { series: ChartSeries[] }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="border border-line bg-surface2 px-3 py-2 shadow-none">
      <div className="label mb-1.5">{formatMET(Number(label))}</div>
      <div className="space-y-1">
        {payload.map((entry) => {
          const def = series.find((item) => item.key === entry.dataKey);
          return (
            <div
              key={String(entry.dataKey)}
              className="flex items-center justify-between gap-6 font-mono text-[11px]"
            >
              <span className="flex items-center gap-1.5 text-muted">
                <span
                  aria-hidden
                  className="inline-block h-[2px] w-3"
                  style={{ background: entry.color ?? def?.color }}
                />
                {def?.label ?? entry.name}
              </span>
              <span className="text-ink">
                {typeof entry.value === 'number' ? entry.value.toFixed(def?.unit === 'h' ? 1 : 0) : entry.value}
                {def?.unit ? ` ${def.unit}` : ''}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TrendChart({
  data,
  series,
  baseline,
  baselineLabel = 'Personal baseline',
  markers = [],
  height = 220,
  ariaLabel,
  unitLabel,
  xTickFormatter = (value: number) => formatClock(value),
  yDomain,
}: {
  data: ChartPoint[];
  series: ChartSeries[];
  baseline?: number;
  baselineLabel?: string;
  markers?: ChartMarker[];
  height?: number;
  ariaLabel: string;
  unitLabel?: string;
  xTickFormatter?: (value: number) => string;
  yDomain?: [number | 'auto', number | 'auto'];
}) {
  const reduceMotion = useReducedMotion();
  const gradientId = useId();
  void gradientId;
  const latest = data[data.length - 1];
  const first = data[0];
  const summary = useMemo(() => {
    const values = series
      .map((definition) => {
        const value = latest?.[definition.key];
        return typeof value === 'number'
          ? `${definition.label} ${value.toFixed(definition.unit === 'h' ? 1 : 0)}${definition.unit ? ` ${definition.unit}` : ''}`
          : null;
      })
      .filter(Boolean);
    return `Chart from ${first ? formatMET(Number(first.minute)) : 'no data'} to ${
      latest ? formatMET(Number(latest.minute)) : 'no data'
    }. ${values.join(', ')}.${baseline !== undefined ? ` ${baselineLabel}: ${baseline.toFixed(1)}${unitLabel ? ` ${unitLabel}` : ''}.` : ''}`;
  }, [data, latest, first, series, baseline, baselineLabel, unitLabel]);

  if (data.length < 2) {
    return (
      <div
        className="flex items-center justify-center border border-dashed border-line text-[11px] text-muted"
        style={{ height }}
      >
        Not enough observations in this window.
      </div>
    );
  }

  return (
    <figure className="min-w-0">
      <div style={{ height }} aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 10, left: -12, bottom: 0 }}>
            <CartesianGrid stroke="#1e2a36" vertical={false} />
            <XAxis
              dataKey="minute"
              tick={{ fill: '#94A5B5', fontSize: 9, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={{ stroke: '#293744' }}
              minTickGap={34}
              tickFormatter={xTickFormatter}
            />
            <YAxis
              domain={yDomain}
              tick={{ fill: '#94A5B5', fontSize: 9, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={false}
              width={42}
              allowDecimals={false}
            />
            {baseline !== undefined && (
              <ReferenceLine
                y={baseline}
                stroke="#94A5B5"
                strokeDasharray="3 4"
                strokeOpacity={0.55}
              />
            )}
            {markers.slice(0, 4).map((marker) => (
              <ReferenceLine
                key={`${marker.minute}-${marker.label}`}
                x={marker.minute}
                stroke={MARKER_COLOR[marker.tone]}
                strokeDasharray="2 4"
                strokeOpacity={0.5}
              />
            ))}
            {series.map((definition) => (
              <Line
                key={definition.key}
                type="monotone"
                dataKey={definition.key}
                name={definition.label}
                stroke={definition.color}
                strokeWidth={1.6}
                strokeDasharray={definition.dashed ? '4 4' : undefined}
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0 }}
                isAnimationActive={!reduceMotion}
                animationDuration={300}
                connectNulls
              />
            ))}
            <Tooltip
              content={<ChartTooltip series={series} />}
              cursor={{ stroke: '#3b4d5f', strokeDasharray: '2 3' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">{ariaLabel}. {summary}</figcaption>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {series.map((definition) => (
          <span
            key={definition.key}
            className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.08em] text-muted"
          >
            <span
              aria-hidden
              style={{ background: definition.color }}
              className="inline-block h-[2px] w-4"
            />
            {definition.label}
          </span>
        ))}
        {baseline !== undefined && (
          <span className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
            <span aria-hidden className="inline-block h-[2px] w-4 border-t border-dashed border-muted" />
            {baselineLabel}
          </span>
        )}
        {markers.slice(0, 4).map((marker) => (
          <span
            key={`legend-${marker.minute}-${marker.label}`}
            className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.08em]"
            style={{ color: MARKER_COLOR[marker.tone] }}
          >
            <span
              aria-hidden
              className="inline-block h-2 w-[2px]"
              style={{ background: MARKER_COLOR[marker.tone] }}
            />
            {marker.label} · {formatClock(marker.minute)}
          </span>
        ))}
      </div>
    </figure>
  );
}

export function SleepBarChart({
  data,
  baseline,
  height = 200,
  ariaLabel,
}: {
  data: { minute: number; sleepHours: number; label: string }[];
  baseline: number;
  height?: number;
  ariaLabel: string;
}) {
  const reduceMotion = useReducedMotion();
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center border border-dashed border-line text-[11px] text-muted"
        style={{ height }}
      >
        No sleep observations available yet.
      </div>
    );
  }
  return (
    <figure>
      <div style={{ height }} aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 10, left: -14, bottom: 0 }}>
            <CartesianGrid stroke="#1e2a36" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: '#94A5B5', fontSize: 9, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={{ stroke: '#293744' }}
              interval={0}
            />
            <YAxis
              domain={[0, 10]}
              tick={{ fill: '#94A5B5', fontSize: 9, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={false}
              width={36}
            />
            <ReferenceLine y={baseline} stroke="#94A5B5" strokeDasharray="3 4" strokeOpacity={0.6} />
            <Tooltip
              cursor={{ fill: '#22303C' }}
              content={
                <ChartTooltip
                  series={[{ key: 'sleepHours', label: 'Sleep / 24 h', color: '#D9F26A', unit: 'h' }]}
                />
              }
            />
            <Bar
              dataKey="sleepHours"
              fill="#D9F26A"
              maxBarSize={22}
              isAnimationActive={!reduceMotion}
              animationDuration={300}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">
        {ariaLabel}. Bars show trailing-24-hour sleep at the daily reference time, against a personal
        baseline of {baseline.toFixed(1)} hours.
      </figcaption>
      <div className="mt-2 flex items-center gap-4 font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="inline-block h-3 w-2 bg-accent" /> Sleep / 24 h
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="inline-block h-[2px] w-4 border-t border-dashed border-muted" />
          Baseline {baseline.toFixed(1)} h
        </span>
      </div>
    </figure>
  );
}

export function Sparkline({
  data,
  dataKey,
  baseline,
  color = '#D9F26A',
  height = 34,
  label,
}: {
  data: ChartPoint[];
  dataKey: string;
  baseline?: number;
  color?: string;
  height?: number;
  label: string;
}) {
  if (data.length < 2) return <div style={{ height }} aria-hidden="true" />;
  return (
    <div style={{ height }} role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 3, right: 2, left: 2, bottom: 1 }}>
          {baseline !== undefined && (
            <ReferenceLine y={baseline} stroke="#3b4d5f" strokeDasharray="2 3" />
          )}
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={1.2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ComparisonChart({
  data,
  height = 210,
}: {
  data: { minute: number; withDecision: number; withoutDecision: number }[];
  height?: number;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <div style={{ height }} aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 10, left: -14, bottom: 0 }}>
          <CartesianGrid stroke="#1e2a36" vertical={false} />
          <XAxis
            dataKey="minute"
            tick={{ fill: '#94A5B5', fontSize: 9, fontFamily: 'JetBrains Mono' }}
            tickLine={false}
            axisLine={{ stroke: '#293744' }}
            minTickGap={40}
            tickFormatter={(value: number) => formatClock(value)}
          />
          <YAxis
            tick={{ fill: '#94A5B5', fontSize: 9, fontFamily: 'JetBrains Mono' }}
            tickLine={false}
            axisLine={false}
            width={40}
            domain={[0, 100]}
          />
          <ReferenceLine y={50} stroke="#293744" strokeDasharray="2 4" />
          <Tooltip
            content={
              <ChartTooltip
                series={[
                  { key: 'withDecision', label: 'With decision', color: '#D9F26A', unit: '/100' },
                  { key: 'withoutDecision', label: 'As planned', color: '#94A5B5', unit: '/100' },
                ]}
              />
            }
            cursor={{ stroke: '#3b4d5f', strokeDasharray: '2 3' }}
          />
          <Line
            type="monotone"
            dataKey="withoutDecision"
            name="As planned"
            stroke="#94A5B5"
            strokeWidth={1.4}
            strokeDasharray="4 4"
            dot={false}
            isAnimationActive={!reduceMotion}
            animationDuration={300}
          />
          <Line
            type="monotone"
            dataKey="withDecision"
            name="With decision"
            stroke="#D9F26A"
            strokeWidth={1.7}
            dot={false}
            isAnimationActive={!reduceMotion}
            animationDuration={300}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-2 flex items-center gap-4 font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="inline-block h-[2px] w-4 bg-accent" /> With decision
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="inline-block h-[2px] w-4 border-t border-dashed border-muted" />
          As planned
        </span>
        <span className="text-muted/70">Model projection · 12 h</span>
      </div>
    </div>
  );
}

export function chartLegendClassNames(): string {
  return cn('font-mono text-[9px] uppercase tracking-[0.08em] text-muted');
}
