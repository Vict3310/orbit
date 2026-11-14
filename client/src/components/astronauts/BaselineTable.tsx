import type { BaselineSnapshot, DetectionMetric, HealthObservation } from '../../types/domain';
import { METRIC_BY_KEY } from '../../engines/health/metrics';
import { MetricDelta, deviationPct, metricTone } from '../telemetry/MetricDelta';
import { cn } from '../ui';

const DEFAULT_KEYS: DetectionMetric[] = [
  'restingHeartRate',
  'hrv',
  'respiratoryRate',
  'sleepHours',
  'fatigue',
  'reactionTime',
];

export function BaselineTable({
  baseline,
  observation,
  keys = DEFAULT_KEYS,
  showMethod = false,
  className,
}: {
  baseline: BaselineSnapshot;
  observation: HealthObservation;
  keys?: DetectionMetric[];
  showMethod?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full min-w-[420px] border-collapse text-left">
        <caption className="sr-only">
          Current simulated values compared with the personal baseline for this crew member.
        </caption>
        <thead>
          <tr className="border-b border-line">
            <th scope="col" className="label py-2 pr-2 font-normal">
              Indicator
            </th>
            <th scope="col" className="label py-2 pr-2 text-right font-normal">
              Baseline
            </th>
            <th scope="col" className="label py-2 pr-2 text-right font-normal">
              Current
            </th>
            <th scope="col" className="label py-2 text-right font-normal">
              Δ
            </th>
          </tr>
        </thead>
        <tbody>
          {keys.map((key) => {
            const def = METRIC_BY_KEY[key];
            const metric = baseline.metrics[key];
            if (!def || !metric) return null;
            const current = def.get(observation);
            const pct = deviationPct(current, metric.value);
            const worseWhen = def.direction === 'either' ? 'either' : def.direction;
            const tone = metricTone(pct, worseWhen);
            const width = Math.min(100, Math.abs(pct) * 3);
            return (
              <tr key={key} className="border-b border-line/60 align-middle last:border-0">
                <th scope="row" className="py-2 pr-2 text-left font-normal">
                  <span className="block text-[11px] leading-4 text-ink">{def.short}</span>
                  <span className="block font-mono text-[8px] uppercase tracking-[0.05em] text-muted/70">
                    {def.unit}
                    {showMethod ? ` · ${metric.method === 'rolling' ? `72h n=${metric.n}` : 'profile'}` : ''}
                  </span>
                  <span className="mt-1 block h-[2px] w-full max-w-[64px] bg-surface2">
                    <span
                      className={cn(
                        'block h-full',
                        tone === 'text-caution' && 'bg-caution',
                        tone === 'text-critical' && 'bg-critical',
                        tone === 'text-ok' && 'bg-ok',
                        tone === 'text-muted' && 'bg-muted',
                      )}
                      style={{ width: `${width}%` }}
                    />
                  </span>
                </th>
                <td className="py-2 pr-2 text-right font-mono text-[11px] text-muted">
                  {metric.value.toFixed(def.digits)}
                </td>
                <td className="py-2 pr-2 text-right font-mono text-[11px] text-ink">
                  {current.toFixed(def.digits)}
                </td>
                <td className="py-2 text-right">
                  <MetricDelta pct={pct} worseWhen={worseWhen} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
