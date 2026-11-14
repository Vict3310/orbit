import type { AstronautBaseline, DetectionMetric, HealthObservation } from '../../types/domain';

export interface MetricDefinition {
  key: DetectionMetric;
  label: string;
  short: string;
  unit: string;
  digits: number;
  direction: 'up' | 'down' | 'either';
  baselineKey: keyof AstronautBaseline;
  description: string;
  get: (obs: HealthObservation) => number;
}

export const METRIC_DEFS: MetricDefinition[] = [
  {
    key: 'restingHeartRate',
    label: 'Resting heart rate',
    short: 'RHR',
    unit: 'bpm',
    digits: 0,
    direction: 'up',
    baselineKey: 'restingHeartRate',
    description: 'Heart rate at rest, derived from the synthetic cardiovascular model.',
    get: (o) => o.restingHeartRate,
  },
  {
    key: 'heartRate',
    label: 'Heart rate',
    short: 'HR',
    unit: 'bpm',
    digits: 0,
    direction: 'either',
    baselineKey: 'heartRate',
    description: 'Instantaneous heart rate including activity context.',
    get: (o) => o.heartRate,
  },
  {
    key: 'hrv',
    label: 'Heart-rate variability',
    short: 'HRV',
    unit: 'ms',
    digits: 0,
    direction: 'down',
    baselineKey: 'hrv',
    description: 'Beat-to-beat variability proxy. Lower values are treated as the deviation direction.',
    get: (o) => o.hrv,
  },
  {
    key: 'respiratoryRate',
    label: 'Respiratory rate',
    short: 'RR',
    unit: 'br/min',
    digits: 1,
    direction: 'up',
    baselineKey: 'respiratoryRate',
    description: 'Breaths per minute, with an activity-linked component.',
    get: (o) => o.respiratoryRate,
  },
  {
    key: 'spo2',
    label: 'Peripheral oxygen saturation',
    short: 'SpO2',
    unit: '%',
    digits: 1,
    direction: 'down',
    baselineKey: 'spo2',
    description: 'Simulated pulse-oximetry estimate, not a validated cabin-safety measurement.',
    get: (o) => o.spo2,
  },
  {
    key: 'systolic',
    label: 'Systolic pressure',
    short: 'SBP',
    unit: 'mmHg',
    digits: 0,
    direction: 'up',
    baselineKey: 'systolic',
    description: 'Synthetic systolic pressure estimate.',
    get: (o) => o.systolic,
  },
  {
    key: 'diastolic',
    label: 'Diastolic pressure',
    short: 'DBP',
    unit: 'mmHg',
    digits: 0,
    direction: 'up',
    baselineKey: 'diastolic',
    description: 'Synthetic diastolic pressure estimate.',
    get: (o) => o.diastolic,
  },
  {
    key: 'sleepHours',
    label: 'Sleep duration (trailing 24 h)',
    short: 'SLEEP',
    unit: 'h',
    digits: 1,
    direction: 'down',
    baselineKey: 'sleepHours',
    description: 'Total modelled sleep in the trailing 24 hours.',
    get: (o) => o.sleepHours,
  },
  {
    key: 'sleepConsistency',
    label: 'Sleep consistency',
    short: 'CONS',
    unit: 'index',
    digits: 0,
    direction: 'down',
    baselineKey: 'sleepConsistency',
    description: 'Illustrative 0–100 index of sleep timing regularity.',
    get: (o) => o.sleepConsistency,
  },
  {
    key: 'fatigue',
    label: 'Fatigue indicator',
    short: 'FATIGUE',
    unit: '/100',
    digits: 0,
    direction: 'up',
    baselineKey: 'fatigue',
    description: 'Deterministic composite of modelled sleep debt, workload and self-report.',
    get: (o) => o.fatigue,
  },
  {
    key: 'stress',
    label: 'Stress indicator',
    short: 'STRESS',
    unit: '/100',
    digits: 0,
    direction: 'up',
    baselineKey: 'stress',
    description: 'Illustrative composite of workload and context, not a clinical measure.',
    get: (o) => o.stress,
  },
  {
    key: 'mood',
    label: 'Mood indicator',
    short: 'MOOD',
    unit: '/100',
    digits: 0,
    direction: 'down',
    baselineKey: 'mood',
    description: 'Synthetic behavioural-health indicator for trend exploration.',
    get: (o) => o.mood,
  },
  {
    key: 'reactionTime',
    label: 'Reaction time',
    short: 'RT',
    unit: 'ms',
    digits: 0,
    direction: 'up',
    baselineKey: 'reactionTime',
    description: 'Modelled simple reaction time; browser timing limits apply.',
    get: (o) => o.reactionTime,
  },
  {
    key: 'cognitiveScore',
    label: 'Cognitive performance index',
    short: 'COG',
    unit: '/100',
    digits: 0,
    direction: 'down',
    baselineKey: 'cognitiveScore',
    description: 'Illustrative composite, not a neurocognitive test result.',
    get: (o) => o.cognitiveScore,
  },
];

export const METRIC_BY_KEY: Record<DetectionMetric, MetricDefinition> = METRIC_DEFS.reduce(
  (acc, def) => {
    acc[def.key] = def;
    return acc;
  },
  {} as Record<DetectionMetric, MetricDefinition>,
);

export const BASELINE_TABLE_ORDER: DetectionMetric[] = [
  'restingHeartRate',
  'hrv',
  'respiratoryRate',
  'spo2',
  'sleepHours',
  'sleepConsistency',
  'fatigue',
  'stress',
  'reactionTime',
];

export function formatMetricValue(metric: DetectionMetric, value: number): string {
  const def = METRIC_BY_KEY[metric];
  return value.toFixed(def.digits);
}
