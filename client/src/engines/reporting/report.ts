import type {
  Assessment,
  AstronautProfile,
  BaselineSnapshot,
  CognitiveTestResult,
  HealthAlert,
  HealthObservation,
  HealthReport,
  Mission,
  MissionEvent,
  OperationalDecision,
  ReportBaselineRow,
} from '../../types/domain';
import { BASELINE_TABLE_ORDER, METRIC_BY_KEY } from '../health/metrics';
import { formatMET, missionDate } from '../../lib/format';
import { RADIATION_BANDS } from '../simulation/config';
import { round } from '../simulation/rng';

export interface ReportInput {
  mission: Mission;
  profile: AstronautProfile;
  baseline: BaselineSnapshot;
  observations: HealthObservation[];
  alerts: HealthAlert[];
  assessments: Assessment[];
  cognitiveTests: CognitiveTestResult[];
  decisions: OperationalDecision[];
  events: MissionEvent[];
  nowMinute: number;
  periodDays: number;
}

const mean = (values: number[]) =>
  values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;

const median = (values: number[]) => {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
};

/**
 * Builds a stable, self-contained report snapshot. Only data present in the
 * local store is used; nothing is invented to fill a section.
 */
export function buildHealthReport(input: ReportInput): HealthReport {
  const periodStartMinute = Math.max(0, input.nowMinute - input.periodDays * 1440);
  const periodEndMinute = input.nowMinute;
  const inPeriod = (minute: number) => minute >= periodStartMinute && minute <= periodEndMinute;

  const observations = input.observations
    .filter((o) => o.astronautId === input.profile.id && inPeriod(o.missionMinute))
    .sort((a, b) => a.missionMinute - b.missionMinute);
  const alerts = input.alerts
    .filter((a) => a.astronautId === input.profile.id && inPeriod(a.createdAtMinute))
    .sort((a, b) => a.createdAtMinute - b.createdAtMinute);
  const assessments = input.assessments
    .filter((a) => a.astronautId === input.profile.id && inPeriod(a.missionMinute))
    .sort((a, b) => a.missionMinute - b.missionMinute);
  const cognitiveTests = input.cognitiveTests
    .filter((t) => t.astronautId === input.profile.id && inPeriod(t.missionMinute))
    .sort((a, b) => a.missionMinute - b.missionMinute);
  const decisions = input.decisions
    .filter((d) => d.astronautId === input.profile.id && inPeriod(d.missionMinute))
    .sort((a, b) => a.missionMinute - b.missionMinute);
  const events = input.events
    .filter((e) => inPeriod(e.minute) && (e.astronautIds.includes(input.profile.id) || e.astronautIds.length === 0))
    .sort((a, b) => a.minute - b.minute);

  const meanSleep = mean(observations.map((o) => o.sleepHours));
  const meanFatigue = mean(observations.map((o) => o.fatigue));
  const meanRhr = mean(observations.map((o) => o.restingHeartRate));
  const medianReaction = median(observations.map((o) => o.reactionTime));
  const doseDelta =
    observations.length >= 2
      ? observations[observations.length - 1].cumulativeDose - observations[0].cumulativeDose
      : 0;

  const baselineRows: ReportBaselineRow[] = BASELINE_TABLE_ORDER.map((key) => {
    const def = METRIC_BY_KEY[key];
    const metric = input.baseline.metrics[key];
    const observed = mean(observations.map((o) => def.get(o)));
    const baselineValue = metric?.value ?? input.profile.baseline[def.baselineKey];
    return {
      label: def.label,
      unit: def.unit,
      baseline: round(baselineValue, def.digits),
      observed: round(observed, def.digits),
      deltaPct: round(baselineValue === 0 ? 0 : ((observed - baselineValue) / baselineValue) * 100, 1),
    };
  });

  const unresolved = alerts.filter(
    (a) => !a.acknowledged && (a.level === 'review' || a.level === 'elevated'),
  );
  const followUps: string[] = [
    ...unresolved.slice(0, 3).map(
      (a) => `Review the unresolved ${a.level === 'review' ? 'review-level' : 'elevated'} alert: ${a.title} (${formatMET(a.createdAtMinute)}).`,
    ),
  ];
  if (observations.length > 0 && meanSleep < input.profile.baseline.sleepHours - 0.5) {
    followUps.push(
      `Mean sleep over the reporting period (${meanSleep.toFixed(1)} h) is below the personal baseline (${input.profile.baseline.sleepHours.toFixed(1)} h). Review sleep scheduling and recovery opportunities.`,
    );
  }
  if (doseDelta > RADIATION_BANDS.observationDaily * input.periodDays) {
    followUps.push(
      'Review the EVA and shelter log against the configured radiation review bands. The dose estimate is an educational approximation, not an individual risk prediction.',
    );
  }
  if (assessments.length === 0) {
    followUps.push(
      'No structured self-assessment was completed in this period. Complete one to add subjective context to the telemetry trends.',
    );
  }
  followUps.push(
    'Repeat the relevant structured assessment and compare the result with the personal baseline before drawing operational conclusions.',
  );

  const reviewCount = alerts.filter((a) => a.level === 'review').length;
  const elevatedCount = alerts.filter((a) => a.level === 'elevated').length;

  const summary = [
    `${input.profile.name} (${input.profile.role}) was monitored across ${input.periodDays} simulated mission day${input.periodDays === 1 ? '' : 's'} ending ${formatMET(periodEndMinute)} (${missionDate(periodEndMinute)}).`,
    `${observations.length} hourly synthetic observations were available in this period. Mean resting heart rate was ${meanRhr.toFixed(0)} bpm against a personal baseline of ${(input.baseline.metrics.restingHeartRate?.value ?? input.profile.baseline.restingHeartRate).toFixed(0)} bpm; mean trailing-24-hour sleep was ${meanSleep.toFixed(1)} h against a baseline of ${input.profile.baseline.sleepHours.toFixed(1)} h.`,
    `${alerts.length} prototype alert${alerts.length === 1 ? '' : 's'} were generated (${elevatedCount} elevated, ${reviewCount} requiring review). ${
      alerts.length === 0
        ? 'No rule-based deviations were detected in the period.'
        : 'Each alert contains its triggering observations, rule and limitations in the alert history.'
    }`,
    'This report is an educational prototype. It contains simulated data and is not intended for clinical decision-making.',
  ];

  const provenance = [
    `Mission: ${input.mission.name} (${input.mission.designation}), synthetic seed ${input.mission.seed}.`,
    'Telemetry source: deterministic ORBIT simulator with 15-minute internal ticks and hourly observation records. No NASA astronaut medical records or real physiological sensor data were used.',
    `Baseline: ${input.baseline.note}`,
    'Alerts: deterministic rule engine running locally in the browser; no language model participates in alert generation.',
    `Records reviewed: ${observations.length} observations, ${alerts.length} alerts, ${assessments.length} self-assessments, ${cognitiveTests.length} reaction-time checks, ${decisions.length} operational decisions.`,
    'Storage: browser IndexedDB (Dexie). Reports can be printed or saved to PDF locally.',
  ];

  const limitations = [
    'All physiological values are synthetic and generated by a simplified educational model.',
    'Prototype detection thresholds are configurable assumptions, not validated clinical thresholds.',
    'The simulation does not model microgravity physiology, pharmacokinetics, or individual medical history.',
    'Reaction-time measurements made in a browser are affected by device latency, input hardware and attention.',
    'Radiation estimates use illustrative location and shielding assumptions and are not a validated dosimetry analysis.',
    'Correlation between indicators does not establish causation, and no alert constitutes a diagnosis.',
  ];

  return {
    id: `rpt-${input.profile.id}-${periodEndMinute}-${input.periodDays}`,
    astronautId: input.profile.id,
    missionId: input.mission.id,
    missionName: input.mission.name,
    generatedAtIso: new Date().toISOString(),
    periodStartMinute,
    periodEndMinute,
    title: `Mission Health Report — ${input.profile.name}`,
    summary,
    stats: {
      observations: observations.length,
      meanRestingHeartRate: round(meanRhr, 0),
      meanSleepHours: round(meanSleep, 1),
      meanFatigue: round(meanFatigue, 0),
      medianReactionTime: medianReaction === null ? null : round(medianReaction, 0),
      doseDelta: round(doseDelta, 2),
      alertCount: alerts.length,
    },
    baselineRows,
    alerts: alerts.map((a) => ({
      id: a.id,
      title: a.title,
      level: a.level,
      createdAtMinute: a.createdAtMinute,
      acknowledged: a.acknowledged,
    })),
    events: events.map((e) => ({ minute: e.minute, title: e.title, severity: e.severity })),
    assessments: assessments.map((a) => ({
      id: a.id,
      missionMinute: a.missionMinute,
      fatigue: a.scores.fatigue,
      stress: a.scores.stress,
      note: a.note,
    })),
    cognitiveTests: cognitiveTests.map((t) => ({
      id: t.id,
      missionMinute: t.missionMinute,
      medianMs: t.medianMs,
      changePct: t.changePct,
    })),
    decisions: decisions.map((d) => ({
      id: d.id,
      missionMinute: d.missionMinute,
      label: d.label,
      projected: d.projected,
      alternative: d.alternative,
    })),
    followUps,
    provenance,
    limitations,
  };
}
