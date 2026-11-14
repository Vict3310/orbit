import type {
  AstronautProfile,
  BaselineMetric,
  BaselineSnapshot,
  HealthObservation,
  MetricKey,
} from '../../types/domain';
import { METRIC_DEFS, METRIC_BY_KEY } from './metrics';

export const BASELINE_WINDOW_HOURS = 72;

/**
 * Builds a transparent personal baseline from the trailing window of
 * observations. When fewer than eight observations are available the profile
 * baseline is used unchanged. No model is fitted and no clinical norm is
 * assumed.
 */
export function computeBaseline(
  profile: AstronautProfile,
  observations: HealthObservation[],
  nowMinute: number,
  windowHours = BASELINE_WINDOW_HOURS,
): BaselineSnapshot {
  const windowStart = nowMinute - windowHours * 60;
  const recent = observations.filter(
    (o) =>
      o.astronautId === profile.id &&
      o.missionMinute > windowStart &&
      o.missionMinute <= nowMinute,
  );
  const degraded = recent.filter((o) => o.dataQuality === 'degraded').length;

  const metrics: Record<string, BaselineMetric> = {};
  for (const def of METRIC_DEFS) {
    const values = recent.map(def.get).filter((v) => Number.isFinite(v));
    const profileValue = profile.baseline[def.baselineKey];
    let value = profileValue;
    let sd = 0;
    let n = values.length;
    let method: BaselineMetric['method'] = 'profile';

    if (values.length >= 8) {
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance =
        values.reduce((acc, v) => acc + (v - mean) * (v - mean), 0) / Math.max(1, values.length - 1);
      value = mean;
      sd = Math.sqrt(Math.max(0, variance));
      method = 'rolling';
    } else {
      n = values.length;
    }

    metrics[def.key] = {
      key: def.key,
      label: def.label,
      short: def.short,
      unit: def.unit,
      value,
      sd,
      n,
      direction: def.direction,
      method,
      digits: def.digits,
    };
  }

  return {
    astronautId: profile.id,
    computedAtMinute: nowMinute,
    windowHours,
    sampleCount: recent.length,
    metrics,
    note: `Personal baseline = trailing ${windowHours} h mean when at least 8 synthetic observations exist; otherwise the profile baseline. ${degraded} sample${degraded === 1 ? '' : 's'} flagged degraded quality. This is a demonstration baseline, not a clinical reference range.`,
  };
}

export interface Deviation {
  metric: MetricKey;
  delta: number;
  pct: number;
  z: number | null;
  band: 'within' | 'mild' | 'marked' | 'large';
}

export function deviation(
  value: number,
  baselineValue: number,
  sd: number | null,
): { delta: number; pct: number; z: number | null; band: Deviation['band'] } {
  const delta = value - baselineValue;
  const pct = baselineValue === 0 ? 0 : (delta / baselineValue) * 100;
  const z = sd && sd > 0 ? delta / sd : null;
  const magnitude = Math.abs(pct);
  const band = magnitude < 5 ? 'within' : magnitude < 12 ? 'mild' : magnitude < 25 ? 'marked' : 'large';
  return { delta, pct, z, band };
}

export function deviationFor(key: MetricKey, value: number, snapshot: BaselineSnapshot) {
  if (key === 'cumulativeDose') {
    return { delta: 0, pct: 0, z: null as number | null, band: 'within' as const };
  }
  const metric = snapshot.metrics[key] ?? METRIC_BY_KEY[key];
  if (!metric) {
    return { delta: 0, pct: 0, z: null as number | null, band: 'within' as const };
  }
  return deviation(value, metric.value, metric.sd || null);
}

export function bandLabel(band: Deviation['band']): string {
  switch (band) {
    case 'within':
      return 'Within baseline band';
    case 'mild':
      return 'Mild deviation';
    case 'marked':
      return 'Marked deviation';
    default:
      return 'Large deviation';
  }
}

export function baselineFor(snapshot: BaselineSnapshot, key: MetricKey): BaselineMetric | undefined {
  return snapshot.metrics[key];
}
