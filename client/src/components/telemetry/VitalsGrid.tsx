import type { BaselineSnapshot, HealthObservation } from '../../types/domain';
import { MetricDelta, deviationPct } from './MetricDelta';
import { cn } from '../ui';

interface Vital {
  label: string;
  value: string;
  unit: string;
  baseline?: number;
  pct?: number;
  worseWhen: 'up' | 'down' | 'either';
  context?: string;
}

export function VitalsGrid({
  observation,
  baseline,
  columns = 4,
}: {
  observation: HealthObservation;
  baseline: BaselineSnapshot;
  columns?: number;
}) {
  const b = (key: string) => baseline.metrics[key]?.value;

  const vitals: Vital[] = [
    {
      label: 'Heart rate',
      value: observation.heartRate.toFixed(0),
      unit: 'bpm',
      baseline: b('heartRate'),
      pct: deviationPct(observation.heartRate, b('heartRate') ?? 0),
      worseWhen: 'up',
      context: observation.activity,
    },
    {
      label: 'Resting HR',
      value: observation.restingHeartRate.toFixed(0),
      unit: 'bpm',
      baseline: b('restingHeartRate'),
      pct: deviationPct(observation.restingHeartRate, b('restingHeartRate') ?? 0),
      worseWhen: 'up',
    },
    {
      label: 'HRV',
      value: observation.hrv.toFixed(0),
      unit: 'ms',
      baseline: b('hrv'),
      pct: deviationPct(observation.hrv, b('hrv') ?? 0),
      worseWhen: 'down',
    },
    {
      label: 'Respiratory',
      value: observation.respiratoryRate.toFixed(1),
      unit: 'br/min',
      baseline: b('respiratoryRate'),
      pct: deviationPct(observation.respiratoryRate, b('respiratoryRate') ?? 0),
      worseWhen: 'up',
    },
    {
      label: 'SpO2',
      value: observation.spo2.toFixed(1),
      unit: '%',
      baseline: b('spo2'),
      pct: deviationPct(observation.spo2, b('spo2') ?? 0),
      worseWhen: 'down',
    },
    {
      label: 'Blood pressure',
      value: `${observation.systolic.toFixed(0)}/${observation.diastolic.toFixed(0)}`,
      unit: 'mmHg',
      baseline: b('systolic'),
      pct: deviationPct(observation.systolic, b('systolic') ?? 0),
      worseWhen: 'up',
    },
    {
      label: 'Sleep / 24 h',
      value: observation.sleepHours.toFixed(1),
      unit: 'h',
      baseline: b('sleepHours'),
      pct: deviationPct(observation.sleepHours, b('sleepHours') ?? 0),
      worseWhen: 'down',
    },
    {
      label: 'Fatigue',
      value: observation.fatigue.toFixed(0),
      unit: '/100',
      baseline: b('fatigue'),
      pct: deviationPct(observation.fatigue, b('fatigue') ?? 0),
      worseWhen: 'up',
    },
  ];

  return (
    <dl
      className={cn(
        'grid grid-cols-2 gap-px border border-line bg-line',
        columns === 4 ? 'sm:grid-cols-4' : 'sm:grid-cols-3',
      )}
    >
      {vitals.map((vital) => (
        <div key={vital.label} className="bg-surface px-3 py-3">
          <dt className="label mb-2 truncate">{vital.label}</dt>
          <dd className="flex items-baseline gap-1.5">
            <span className="font-mono text-[20px] leading-none tracking-tight text-ink numeric">
              {vital.value}
            </span>
            <span className="font-mono text-[9px] uppercase text-muted">{vital.unit}</span>
          </dd>
          <div className="mt-2 flex items-center justify-between gap-2">
            <MetricDelta pct={vital.pct ?? 0} worseWhen={vital.worseWhen} />
            {vital.context && (
              <span className="truncate font-mono text-[8px] uppercase tracking-[0.06em] text-muted/70">
                {vital.context}
              </span>
            )}
          </div>
        </div>
      ))}
    </dl>
  );
}
