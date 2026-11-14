import type {
  AlertEvidence,
  AlertLevel,
  AstronautProfile,
  BaselineSnapshot,
  CommsStatus,
  CrewState,
  DetectionMetric,
  DetectionRule,
  EnvironmentalState,
  HealthAlert,
  HealthObservation,
  ScenarioId,
  ZoneId,
} from '../../types/domain';
import { METRIC_BY_KEY } from '../health/metrics';
import { formatMET } from '../../lib/format';
import {
  CO2_ELEVATED_PPM,
  CO2_REFERENCE_PPM,
  CO2_REVIEW_PPM,
  RADIATION_BANDS,
} from '../simulation/config';
import { round } from '../simulation/rng';
import { sleep24Hours } from '../simulation/healthModel';

const LEVEL_ORDER: Record<HealthAlert['level'], number> = {
  review: 0,
  elevated: 1,
  observation: 2,
};

export interface RuleEvaluation {
  rule: DetectionRule;
  triggered: boolean;
  latest: HealthObservation | null;
  current: number;
  baselineValue: number;
  pct: number;
  z: number | null;
  breachCount: number;
  evidence: AlertEvidence[];
  windowStartMinute: number;
  windowEndMinute: number;
}

function breachesRule(
  rule: DetectionRule,
  observation: HealthObservation,
  baselineValue: number,
  sd: number,
  n: number,
): boolean {
  const def = METRIC_BY_KEY[rule.metric];
  const value = def.get(observation);
  if (!Number.isFinite(value)) return false;

  if (rule.absoluteBelow !== undefined) {
    return value < rule.absoluteBelow;
  }

  const delta = value - baselineValue;
  const pct = baselineValue === 0 ? 0 : (delta / baselineValue) * 100;
  const sufficientZ = n >= 8 && sd > 0;
  const z = sufficientZ ? delta / sd : 0;
  const meetsPct = rule.direction === 'up' ? pct >= rule.pctThreshold : pct <= -rule.pctThreshold;
  const meetsZ = sufficientZ && (rule.direction === 'up' ? z >= rule.zThreshold : z <= -rule.zThreshold);
  return meetsPct || meetsZ;
}

export function evaluateRule(
  rule: DetectionRule,
  observations: HealthObservation[],
  baseline: BaselineSnapshot,
  nowMinute: number,
  windowHours = 24,
): RuleEvaluation {
  const windowStartMinute = nowMinute - windowHours * 60;
  const window = observations
    .filter((o) => o.missionMinute > windowStartMinute && o.missionMinute <= nowMinute)
    .sort((a, b) => a.missionMinute - b.missionMinute);

  const metric = baseline.metrics[rule.metric];
  const baselineValue = metric?.value ?? 0;
  const sd = metric?.sd ?? 0;
  const n = metric?.n ?? 0;
  const def = METRIC_BY_KEY[rule.metric];
  const latest = window[window.length - 1] ?? null;
  const current = latest ? def.get(latest) : 0;

  let breachCount = 0;
  for (let i = window.length - 1; i >= 0; i -= 1) {
    if (breachesRule(rule, window[i], baselineValue, sd, n)) breachCount += 1;
    else break;
  }

  const triggered = breachCount >= rule.consecutive && latest !== null;
  const evidence: AlertEvidence[] = triggered
    ? window
        .filter((o) =>
          breachesRule(rule, o, baselineValue, sd, n),
        )
        .slice(-8)
        .map((o) => ({
          missionMinute: o.missionMinute,
          label: `${formatMET(o.missionMinute)} · ${o.activity}`,
          value: round(def.get(o), def.digits),
          baseline: round(baselineValue, def.digits),
          unit: def.unit,
        }))
    : [];

  const pct = baselineValue === 0 ? 0 : ((current - baselineValue) / baselineValue) * 100;
  const z = sd > 0 && n >= 8 ? (current - baselineValue) / sd : null;

  return {
    rule,
    triggered,
    latest,
    current,
    baselineValue,
    pct,
    z,
    breachCount,
    evidence,
    windowStartMinute,
    windowEndMinute: nowMinute,
  };
}

interface WorkflowCopy {
  steps: string[];
}

const WORKFLOWS: Record<DetectionMetric, WorkflowCopy> = {
  restingHeartRate: {
    steps: [
      'Repeat a resting measurement after five minutes of seated rest, away from the exercise window.',
      'Review the sleep, workload and hydration context for the same period.',
      'Complete the ORBIT structured self-assessment.',
      'Escalate to the simulated mission medical review if the pattern persists after recovery.',
    ],
  },
  heartRate: {
    steps: [
      'Confirm the activity context at the time of the reading.',
      'Repeat the measurement at rest and compare with the personal baseline.',
      'Review recent workload and sleep.',
    ],
  },
  hrv: {
    steps: [
      'Review sleep duration and timing across the same window.',
      'Repeat the measurement at rest and compare with the personal baseline.',
      'Consider whether workload or an environmental event co-occurred.',
    ],
  },
  respiratoryRate: {
    steps: [
      'Check the cabin CO2 and oxygen readings with the environmental panel.',
      'Repeat the measurement at rest.',
      'Review recent activity and exertion.',
    ],
  },
  spo2: {
    steps: [
      'Verify sensor placement and repeat the measurement.',
      'Inspect the environmental control readings; a single simulated SpO2 value is not evidence of cabin safety.',
      'Escalate to the simulated mission medical review if the value persists.',
    ],
  },
  systolic: {
    steps: ['Repeat the measurement at rest.', 'Review activity, stress and sleep context.'],
  },
  diastolic: {
    steps: ['Repeat the measurement at rest.', 'Review activity, stress and sleep context.'],
  },
  sleepHours: {
    steps: [
      'Review the last 72 hours of sleep scheduling and sleep consistency.',
      'Complete the ORBIT self-assessment for perceived sleep quality and fatigue.',
      'Consider a protected rest period in the operational schedule.',
    ],
  },
  sleepConsistency: {
    steps: [
      'Review the timing of recent sleep windows.',
      'Discuss schedule stability with the crew.',
      'Track the pattern across the next three sleep periods.',
    ],
  },
  fatigue: {
    steps: [
      'Repeat the structured fatigue self-assessment.',
      'Review sleep debt, workload and recent EVA or exercise exposure.',
      'Consider a rest period or task reassignment as an operational decision.',
      'Request a simulated mission medical review if fatigue persists after recovery.',
    ],
  },
  stress: {
    steps: [
      'Complete the structured self-assessment to add subjective context.',
      'Review workload and communication availability.',
      'Consider a rest period or a crew check-in.',
    ],
  },
  mood: {
    steps: [
      'Complete the structured self-assessment.',
      'Review sleep, workload and communication context.',
      'Consider a crew check-in or behavioural-health review.',
    ],
  },
  reactionTime: {
    steps: [
      'Repeat the reaction-time assessment when rested.',
      'Review sleep debt and workload for the same period.',
      'Treat browser timing limitations as a source of measurement uncertainty.',
    ],
  },
  cognitiveScore: {
    steps: [
      'Repeat the cognitive assessment after a rest period.',
      'Review sleep and workload context.',
      'Discuss task allocation with the crew if the pattern persists.',
    ],
  },
};

function contextFactors(input: DetectionInput): string[] {
  const factors: string[] = [];
  const crew = input.crew;
  const baselineSleep = input.profile.baseline.sleepHours;
  const sleep = sleep24Hours(input.crewState);
  if (sleep < baselineSleep - 0.8) {
    factors.push(
      `Trailing-24-hour sleep (${sleep.toFixed(1)} h) is below this astronaut's simulated baseline (${baselineSleep.toFixed(1)} h).`,
    );
  }
  if (crew.workload >= 65) {
    factors.push(`Scheduled workload is elevated at ${Math.round(crew.workload)}/100.`);
  }
  if (crew.recentExercise) {
    factors.push('Exercise occurred within the last 3 hours and can raise heart rate and respiratory rate.');
  }
  if (crew.recentEva) {
    factors.push('External activity (EVA) occurred within the last 4 hours.');
  }
  if (input.env.co2 > CO2_REFERENCE_PPM) {
    factors.push(
      `Habitat CO2 is ${Math.round(input.env.co2)} ppm, above the approximate 3 mmHg reference conversion (${CO2_REFERENCE_PPM} ppm at 101.3 kPa).`,
    );
  }
  if (input.env.spe?.active) {
    factors.push('A simulated solar particle event is in progress.');
  }
  if (input.comms !== 'nominal') {
    factors.push(
      input.comms === 'loss'
        ? 'Communication with Earth is unavailable; monitoring is running locally.'
        : 'Communication with Earth carries a one-way light-time delay.',
    );
  }
  if (input.crewState.subjective) {
    factors.push('A recent self-assessment provides subjective context for this window.');
  }
  if (input.scenarioId === 'fatigue') {
    factors.push('The active scenario includes an extended work period with restricted sleep.');
  }
  if (input.scenarioId === 'eclss' && input.env.eclssStatus !== 'nominal') {
    factors.push('A life-support fault is affecting the simulated cabin environment.');
  }
  if (factors.length === 0) {
    factors.push('No obvious operational or environmental co-factor was present in this window.');
  }
  return factors;
}

function ruleSummary(rule: DetectionRule, evaluation: RuleEvaluation): string {
  const unit = METRIC_BY_KEY[rule.metric].unit;
  const value = round(evaluation.current, METRIC_BY_KEY[rule.metric].digits);
  const baseline = round(evaluation.baselineValue, METRIC_BY_KEY[rule.metric].digits);
  const pct = round(evaluation.pct, 1);
  const direction = evaluation.pct >= 0 ? 'above' : 'below';
  return `${evaluation.breachCount} consecutive readings met the prototype rule. Latest simulated value: ${value} ${unit} versus a personal baseline of ${baseline} ${unit} (${Math.abs(pct).toFixed(1)}% ${direction} baseline).`;
}

const DEFAULT_LIMITATIONS = [
  'Prototype detection rule, not a validated clinical threshold or diagnosis.',
  'All values are synthetic and generated by a deterministic educational model.',
  'The personal baseline uses a rolling 72-hour mean when at least eight nominal observations exist.',
  'Correlation in a time window does not establish causation.',
];

function limitationWithQuality(base: string[], observation: HealthObservation | null): string[] {
  const limitations = [...base];
  if (observation?.dataQuality === 'degraded') {
    limitations.push('The latest observation is flagged as degraded data quality; verify the sensor source.');
  }
  return limitations;
}

export interface CrewContext {
  activity: CrewState['activity'];
  location: ZoneId;
  dailyDose: number;
  recentExercise: boolean;
  recentEva: boolean;
  workload: number;
}

export interface DetectionInput {
  profile: AstronautProfile;
  observations: HealthObservation[];
  baseline: BaselineSnapshot;
  nowMinute: number;
  rules: DetectionRule[];
  env: EnvironmentalState;
  comms: CommsStatus;
  scenarioId: ScenarioId | null;
  crew: CrewContext;
  crewState: CrewState;
}

const ALERT_TITLES: Record<string, string> = {
  'rhr-elevated': 'Resting heart rate above personal baseline',
  'hrv-suppressed': 'Heart-rate variability below personal baseline',
  'sleep-reduced': 'Sleep duration below personal baseline',
  'fatigue-elevated': 'Fatigue indicator above personal baseline',
  'reaction-slower': 'Reaction time slower than personal baseline',
  'stress-elevated': 'Stress indicator above personal baseline',
  'spo2-low': 'Oxygen saturation below prototype review band',
  'cognitive-decline': 'Cognitive index below personal baseline',
};

function makeAlert(
  input: DetectionInput,
  rule: DetectionRule,
  evaluation: RuleEvaluation,
  level: HealthAlert['level'],
  extraFactors: string[] = [],
): HealthAlert {
  const def = METRIC_BY_KEY[rule.metric];
  return {
    id: `${input.profile.id}-${rule.id}-${evaluation.windowEndMinute}`,
    astronautId: input.profile.id,
    level,
    title: ALERT_TITLES[rule.id] ?? rule.label,
    summary: ruleSummary(rule, evaluation),
    ruleId: rule.id,
    ruleLabel: rule.label,
    metric: rule.metric,
    currentValue: round(evaluation.current, def.digits),
    baselineValue: round(evaluation.baselineValue, def.digits),
    unit: def.unit,
    deltaPct: round(evaluation.pct, 1),
    zScore: evaluation.z === null ? null : round(evaluation.z, 2),
    windowStartMinute: evaluation.windowStartMinute,
    windowEndMinute: evaluation.windowEndMinute,
    evidence: evaluation.evidence,
    contributingFactors: [...contextFactors(input), ...extraFactors],
    limitations: limitationWithQuality(DEFAULT_LIMITATIONS, evaluation.latest),
    recommendedWorkflow: WORKFLOWS[rule.metric].steps,
    createdAtMinute: input.nowMinute,
    acknowledged: false,
    acknowledgedAtMinute: null,
    source: 'deterministic_rule',
    context: {
      activity: input.crew.activity,
      location: input.crew.location,
      comms: input.comms,
      scenarioId: input.scenarioId,
      baselineMethod: input.baseline.metrics[rule.metric]?.method ?? 'profile',
      sampleCount: input.baseline.metrics[rule.metric]?.n ?? 0,
    },
  };
}

function environmentalAlerts(input: DetectionInput): HealthAlert[] {
  const alerts: HealthAlert[] = [];
  const env = input.env;
  const crew = input.crew;

  if (env.co2 > CO2_REFERENCE_PPM) {
    const level: HealthAlert['level'] =
      env.co2 >= CO2_REVIEW_PPM ? 'review' : env.co2 >= CO2_ELEVATED_PPM ? 'elevated' : 'observation';
    alerts.push({
      id: `${input.profile.id}-co2-${input.nowMinute}`,
      astronautId: input.profile.id,
      level,
      title: 'Habitat CO2 above configured reference band',
      summary: `The simulated cabin CO2 reading is ${Math.round(env.co2)} ppm. NASA's current 1-hour reference standard is an average partial pressure of 3 mmHg, approximately ${CO2_REFERENCE_PPM} ppm at 101.3 kPa. This is an environmental flag, not a measurement of an individual's exposure or a diagnosis.`,
      ruleId: 'co2-reference',
      ruleLabel: 'Environmental CO2 reference band',
      metric: 'cumulativeDose',
      currentValue: Math.round(env.co2),
      baselineValue: CO2_REFERENCE_PPM,
      unit: 'ppm',
      deltaPct: round(((env.co2 - CO2_REFERENCE_PPM) / CO2_REFERENCE_PPM) * 100, 1),
      zScore: null,
      windowStartMinute: input.nowMinute - 60,
      windowEndMinute: input.nowMinute,
      evidence: [
        {
          missionMinute: input.nowMinute,
          label: `${formatMET(input.nowMinute)} · cabin sensor`,
          value: Math.round(env.co2),
          baseline: CO2_REFERENCE_PPM,
          unit: 'ppm',
        },
      ],
      contributingFactors: [
        env.eclssStatus === 'nominal'
          ? 'Life-support status is nominally reported, so the rise may reflect modelling assumptions or a transient cabin load.'
          : 'The simulated life-support system is reporting a degraded state.',
        'CO2 partial pressure depends on total pressure, scrubbing performance and cabin load.',
      ],
      limitations: [
        'This model reports a CO2 concentration proxy in ppm, not a calibrated ppCO2 measurement.',
        'The 3 mmHg reference is a 1-hour average standard; the simulation does not resolve that measurement precisely.',
        'A cabin reading alone is not an individual medical assessment.',
      ],
      recommendedWorkflow: [
        'Inspect the life-support module and the CO2 removal system status.',
        'Reduce non-essential activity if the trend continues.',
        'Follow the simulated emergency workflow if the reading keeps rising.',
      ],
      createdAtMinute: input.nowMinute,
      acknowledged: false,
      acknowledgedAtMinute: null,
      source: 'environment_rule',
      context: {
        activity: crew.activity,
        location: crew.location,
        comms: input.comms,
        scenarioId: input.scenarioId,
        baselineMethod: 'configured_reference',
        sampleCount: 1,
      },
    });
  }

  const dailyDose = crew.dailyDose;
  if (dailyDose >= RADIATION_BANDS.observationDaily || input.env.spe?.active) {
    const level: HealthAlert['level'] =
      dailyDose >= RADIATION_BANDS.reviewDaily
        ? 'review'
        : dailyDose >= RADIATION_BANDS.elevatedDaily || input.env.spe?.active
          ? 'elevated'
          : 'observation';
    alerts.push({
      id: `${input.profile.id}-radiation-${input.nowMinute}`,
      astronautId: input.profile.id,
      level,
      title: 'Radiation exposure estimate above configured review band',
      summary: `The modelled radiation exposure over the last 24 hours is ${dailyDose.toFixed(2)} mSv (cumulative ${crewStateDose(input)} mSv). This is an educational estimate derived from location, shielding assumptions and event intensity; it is not an individual health-risk prediction.`,
      ruleId: 'radiation-review',
      ruleLabel: 'Radiation exposure review band',
      metric: 'cumulativeDose',
      currentValue: round(dailyDose, 2),
      baselineValue: RADIATION_BANDS.observationDaily,
      unit: 'mSv/24h',
      deltaPct: round(
        ((dailyDose - RADIATION_BANDS.observationDaily) / RADIATION_BANDS.observationDaily) * 100,
        1,
      ),
      zScore: null,
      windowStartMinute: input.nowMinute - 1440,
      windowEndMinute: input.nowMinute,
      evidence: [
        {
          missionMinute: input.nowMinute,
          label: `${formatMET(input.nowMinute)} · ${crew.location}`,
          value: round(dailyDose, 2),
          baseline: RADIATION_BANDS.observationDaily,
          unit: 'mSv/24h',
        },
      ],
      contributingFactors: [
        `Current simulated location: ${crew.location}.`,
        input.env.spe?.active
          ? `Solar particle event in progress (intensity index ${input.env.spe.intensity}).`
          : 'No solar particle event is active; galactic cosmic ray exposure dominates the estimate.',
        'Shielding assumptions differ by habitat module and are illustrative.',
      ],
      limitations: [
        'The dose model is a simplified educational approximation, not a validated shielding or dosimetry analysis.',
        'Thresholds are prototype review bands, not NASA crew exposure limits.',
        'Exposure estimates do not predict an individual health outcome.',
      ],
      recommendedWorkflow: [
        'Review the EVA and shelter log for this period.',
        'Consider moving to the radiation shelter during an active event.',
        'Record the operational decision for the simulated medical review.',
      ],
      createdAtMinute: input.nowMinute,
      acknowledged: false,
      acknowledgedAtMinute: null,
      source: 'environment_rule',
      context: {
        activity: crew.activity,
        location: crew.location,
        comms: input.comms,
        scenarioId: input.scenarioId,
        baselineMethod: 'configured_reference',
        sampleCount: 1,
      },
    });
  }

  return alerts;
}

function crewStateDose(input: DetectionInput): number {
  return round(input.crewState.cumulativeDose, 2);
}

function multiFactorAlert(
  input: DetectionInput,
  evaluations: RuleEvaluation[],
): HealthAlert | null {
  const triggered = evaluations.filter((e) => e.triggered);
  const distinctMetrics = new Set(triggered.map((e) => e.rule.metric));
  if (distinctMetrics.size < 3) return null;

  const def = METRIC_BY_KEY.fatigue;
  const evidence: AlertEvidence[] = triggered.slice(0, 6).map((evaluation) => {
    const metricDef = METRIC_BY_KEY[evaluation.rule.metric];
    return {
      missionMinute: evaluation.windowEndMinute,
      label: `${metricDef.label}`,
      value: round(evaluation.current, metricDef.digits),
      baseline: round(evaluation.baselineValue, metricDef.digits),
      unit: metricDef.unit,
    };
  });

  // Multi-indicator co-occurrence is contextual: it prompts assessment rather
  // than escalating to the review band, which is reserved for explicit
  // physiological or environmental rules.
  const level: HealthAlert['level'] = 'elevated';
  return {
    id: `${input.profile.id}-multi-${input.nowMinute}`,
    astronautId: input.profile.id,
    level,
    title: 'Multiple health indicators changed together',
    summary: `${distinctMetrics.size} indicators changed relative to this astronaut's simulated baseline in the same 24-hour window. ORBIT reports the co-occurrence as context for assessment; it does not infer a cause or a diagnosis.`,
    ruleId: 'multi-factor',
    ruleLabel: 'Multi-indicator contextual rule',
    metric: 'fatigue',
    currentValue: round(input.crewState.fatigue, def.digits),
    baselineValue: round(input.baseline.metrics.fatigue?.value ?? input.profile.baseline.fatigue, def.digits),
    unit: def.unit,
    deltaPct: round(
      ((input.crewState.fatigue -
        (input.baseline.metrics.fatigue?.value ?? input.profile.baseline.fatigue)) /
        Math.max(1, input.baseline.metrics.fatigue?.value ?? input.profile.baseline.fatigue)) *
        100,
      1,
    ),
    zScore: null,
    windowStartMinute: input.nowMinute - 1440,
    windowEndMinute: input.nowMinute,
    evidence,
    contributingFactors: contextFactors(input),
    limitations: [
      ...DEFAULT_LIMITATIONS,
      'Co-occurring changes can share a common operational cause, or be unrelated; the display does not assert causation.',
    ],
    recommendedWorkflow: [
      'Repeat the structured self-assessment and cognitive check while rested.',
      'Review the recent sleep, workload and environmental log together.',
      'Consider a rest period or task reassignment as an operational response.',
      'Request a simulated mission medical review if the pattern persists.',
    ],
    createdAtMinute: input.nowMinute,
    acknowledged: false,
    acknowledgedAtMinute: null,
    source: 'multi_factor_rule',
    context: {
      activity: input.crew.activity,
      location: input.crew.location,
      comms: input.comms,
      scenarioId: input.scenarioId,
      baselineMethod: 'rolling_multi_metric',
      sampleCount: input.baseline.sampleCount,
    },
  };
}

/**
 * Deterministic anomaly detection. Runs entirely in the browser; no network or
 * language model participates in deciding whether an alert exists.
 */
export function detectAnomalies(input: DetectionInput): HealthAlert[] {
  const evaluations = input.rules.map((rule) =>
    evaluateRule(rule, input.observations, input.baseline, input.nowMinute),
  );

  const alerts: HealthAlert[] = [];
  for (const evaluation of evaluations) {
    if (!evaluation.triggered) continue;
    let level = evaluation.rule.level;
    let extraFactors: string[] = [];

    if (evaluation.rule.metric === 'restingHeartRate' && input.crew.recentExercise) {
      level = level === 'review' ? 'elevated' : 'observation';
      extraFactors = [
        'Exercise within the last 3 hours is a plausible activity-related contributor; the flag is downgraded in this prototype.',
      ];
    }

    alerts.push(makeAlert(input, evaluation.rule, evaluation, level, extraFactors));
  }

  const multi = multiFactorAlert(input, evaluations);
  if (multi) alerts.push(multi);
  alerts.push(...environmentalAlerts(input));

  return alerts.sort((a, b) => {
    const levelDiff = LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level];
    if (levelDiff !== 0) return levelDiff;
    return b.createdAtMinute - a.createdAtMinute;
  });
}

export function computeDailyDose(crew: CrewState): number {
  return crew.doseSamples.reduce((sum, sample) => sum + sample.mSv, 0);
}

export function detectionSummary(alerts: HealthAlert[]): {
  total: number;
  review: number;
  elevated: number;
  observation: number;
} {
  return {
    total: alerts.length,
    review: alerts.filter((a) => a.level === 'review').length,
    elevated: alerts.filter((a) => a.level === 'elevated').length,
    observation: alerts.filter((a) => a.level === 'observation').length,
  };
}

export function clampAlertLevel(level: HealthAlert['level']): HealthAlert['level'] {
  return level;
}

export const ALERT_LEVEL_LABEL: Record<AlertLevel, string> = {
  normal: 'Normal',
  observation: 'Observation',
  elevated: 'Elevated concern',
  review: 'Requires review',
};

export const ALERT_LEVEL_COLOR: Record<AlertLevel, string> = {
  normal: '#65D6A5',
  observation: '#94A5B5',
  elevated: '#F2BA68',
  review: '#F27676',
};
