/**
 * ORBIT domain model.
 *
 * Every physiological value in this application is synthetic. The types carry
 * an explicit `SYNTHETIC` provenance tag so that UI copy and reports cannot
 * accidentally present simulated telemetry as real astronaut data.
 */

export type AlertLevel = 'normal' | 'observation' | 'elevated' | 'review';
export type ActivityKind = 'sleep' | 'rest' | 'work' | 'exercise' | 'eva' | 'medical';
export type ZoneId =
  | 'quarters'
  | 'medbay'
  | 'exercise'
  | 'shelter'
  | 'lab'
  | 'solar'
  | 'life-support'
  | 'eva';
export type CommsStatus = 'nominal' | 'delay' | 'loss';
export type ScenarioId = 'fatigue' | 'radiation' | 'eclss';
export type DetectionMetric =
  | 'heartRate'
  | 'restingHeartRate'
  | 'hrv'
  | 'respiratoryRate'
  | 'spo2'
  | 'systolic'
  | 'diastolic'
  | 'sleepHours'
  | 'sleepConsistency'
  | 'fatigue'
  | 'stress'
  | 'mood'
  | 'reactionTime'
  | 'cognitiveScore';
export type MetricKey = DetectionMetric | 'cumulativeDose';
export type DataQuality = 'nominal' | 'degraded';
export type RoleKey = 'commander' | 'engineer' | 'science';

/* ------------------------------------------------------------------ */
/* Astronauts                                                          */
/* ------------------------------------------------------------------ */

export interface AstronautBaseline {
  heartRate: number;
  restingHeartRate: number;
  hrv: number;
  respiratoryRate: number;
  spo2: number;
  systolic: number;
  diastolic: number;
  sleepHours: number;
  sleepConsistency: number;
  fatigue: number;
  stress: number;
  mood: number;
  reactionTime: number;
  cognitiveScore: number;
}

export interface AstronautProfile {
  id: string;
  name: string;
  callSign: string;
  role: string;
  roleKey: RoleKey;
  age: number;
  origin: string;
  bio: string;
  specialty: string;
  baseline: AstronautBaseline;
  baselineNote: string;
  avatar: {
    suit: string;
    visor: string;
    strap: string;
    patch: string;
  };
  assignments: string[];
}

export interface Mission {
  id: string;
  name: string;
  designation: string;
  seed: number;
  epochIso: string;
  createdAtIso: string;
  location: string;
}

/* ------------------------------------------------------------------ */
/* Telemetry                                                           */
/* ------------------------------------------------------------------ */

export interface HealthObservation {
  id: string;
  astronautId: string;
  missionMinute: number;
  iso: string;
  heartRate: number;
  restingHeartRate: number;
  hrv: number;
  respiratoryRate: number;
  spo2: number;
  systolic: number;
  diastolic: number;
  sleepHours: number;
  sleepConsistency: number;
  fatigue: number;
  stress: number;
  mood: number;
  reactionTime: number;
  cognitiveScore: number;
  radiationDoseRate: number;
  cumulativeDose: number;
  cabinCo2: number;
  cabinO2: number;
  cabinTempC: number;
  activity: ActivityKind;
  location: ZoneId;
  workload: number;
  dataQuality: DataQuality;
  source: 'SYNTHETIC';
}

export interface BaselineMetric {
  key: DetectionMetric;
  label: string;
  short: string;
  unit: string;
  value: number;
  sd: number;
  n: number;
  direction: 'up' | 'down' | 'either';
  method: 'profile' | 'rolling';
  digits: number;
}

export interface BaselineSnapshot {
  astronautId: string;
  computedAtMinute: number;
  windowHours: number;
  sampleCount: number;
  metrics: Record<string, BaselineMetric>;
  note: string;
}

export interface VitalSnapshot {
  heartRate: number;
  restingHeartRate: number;
  hrv: number;
  respiratoryRate: number;
  spo2: number;
  systolic: number;
  diastolic: number;
  reactionTime: number;
  cognitiveScore: number;
}

/* ------------------------------------------------------------------ */
/* Simulation                                                          */
/* ------------------------------------------------------------------ */

export interface ScheduleBlock {
  id: string;
  kind: ActivityKind;
  startMinute: number;
  endMinute: number;
  label: string;
  zone: ZoneId;
}

export interface ScheduleOverride {
  id: string;
  kind: ActivityKind;
  startMinute: number;
  endMinute: number;
  label: string;
  zone: ZoneId;
  scenarioId?: ScenarioId;
}

export interface SleepSample {
  minute: number;
  hours: number;
}

export interface DoseSample {
  minute: number;
  mSv: number;
}

export interface CrewState {
  astronautId: string;
  location: ZoneId;
  activity: ActivityKind;
  fatigue: number;
  stress: number;
  mood: number;
  workload: number;
  sleepSamples: SleepSample[];
  doseSamples: DoseSample[];
  cumulativeDose: number;
  lastExerciseMinute: number | null;
  lastEvaMinute: number | null;
  reactionTimeOffsetPct: number;
  subjective: {
    fatigue: number;
    stress: number;
    mood: number;
    note: string;
    minute: number;
  } | null;
  overrides: ScheduleOverride[];
  vitals: VitalSnapshot;
  sleepQuality: number;
}

export interface SolarParticleEvent {
  active: boolean;
  startedMinute: number;
  endsMinute: number;
  intensity: number;
  label: string;
}

export interface EnvironmentalState {
  co2: number;
  co2Target: number;
  o2: number;
  tempC: number;
  pressureKpa: number;
  eclssStatus: 'nominal' | 'degraded' | 'critical';
  eclssRepairMinute: number | null;
  spe: SolarParticleEvent | null;
  comms: CommsStatus;
  commsDelaySeconds: number;
}

export interface MissionEvent {
  id: string;
  type: 'scenario' | 'environment' | 'system' | 'decision' | 'crew';
  minute: number;
  title: string;
  detail: string;
  severity: 'info' | 'caution' | 'critical';
  zone?: ZoneId;
  astronautIds: string[];
  resolved: boolean;
}

export interface ScenarioState {
  id: ScenarioId | null;
  stage: 'idle' | 'active' | 'decision_pending' | 'resolved';
  primaryAstronautId: string | null;
  startedMinute: number | null;
  label: string | null;
  resolution: string | null;
}

export interface SimulationState {
  seed: number;
  clock: number;
  tick: number;
  crewOrder: string[];
  crew: Record<string, CrewState>;
  env: EnvironmentalState;
  events: MissionEvent[];
  scenario: ScenarioState;
  workloadMultiplier: number;
}

export interface AdvanceResult {
  state: SimulationState;
  observations: HealthObservation[];
  events: MissionEvent[];
}

/* ------------------------------------------------------------------ */
/* Alerts                                                              */
/* ------------------------------------------------------------------ */

export interface DetectionRule {
  id: string;
  metric: DetectionMetric;
  label: string;
  direction: 'up' | 'down';
  pctThreshold: number;
  zThreshold: number;
  consecutive: number;
  level: Exclude<AlertLevel, 'normal'>;
  rationale: string;
  absoluteBelow?: number;
}

export interface AlertEvidence {
  missionMinute: number;
  label: string;
  value: number;
  baseline: number;
  unit: string;
}

export interface HealthAlert {
  id: string;
  astronautId: string;
  level: Exclude<AlertLevel, 'normal'>;
  title: string;
  summary: string;
  ruleId: string;
  ruleLabel: string;
  metric: MetricKey;
  currentValue: number;
  baselineValue: number;
  unit: string;
  deltaPct: number;
  zScore: number | null;
  windowStartMinute: number;
  windowEndMinute: number;
  evidence: AlertEvidence[];
  contributingFactors: string[];
  limitations: string[];
  recommendedWorkflow: string[];
  createdAtMinute: number;
  acknowledged: boolean;
  acknowledgedAtMinute: number | null;
  source: 'deterministic_rule' | 'environment_rule' | 'multi_factor_rule';
  context: {
    activity: ActivityKind;
    location: ZoneId;
    comms: CommsStatus;
    scenarioId: ScenarioId | null;
    baselineMethod: string;
    sampleCount: number;
  };
}

/* ------------------------------------------------------------------ */
/* Assessments                                                         */
/* ------------------------------------------------------------------ */

export type AssessmentDimension =
  | 'sleepQuality'
  | 'fatigue'
  | 'stress'
  | 'discomfort'
  | 'workload'
  | 'mood'
  | 'concentration';

export interface AssessmentItem {
  id: string;
  dimension: AssessmentDimension;
  prompt: string;
  lowLabel: string;
  highLabel: string;
  direction: 'higher_worse' | 'higher_better';
}

export interface Assessment {
  id: string;
  astronautId: string;
  missionMinute: number;
  createdAtIso: string;
  instrument: 'orbit-self-report-v1';
  responses: { itemId: string; value: number }[];
  scores: Record<AssessmentDimension, number>;
  note: string;
  source: 'self_report';
}

export interface ReactionTrial {
  index: number;
  delayMs: number;
  reactionMs: number | null;
  falseStart: boolean;
  missed: boolean;
}

export interface CognitiveTestResult {
  id: string;
  astronautId: string;
  missionMinute: number;
  createdAtIso: string;
  trials: ReactionTrial[];
  medianMs: number;
  bestMs: number;
  missed: number;
  falseStarts: number;
  durationMs: number;
  baselineMs: number;
  changePct: number;
}

/* ------------------------------------------------------------------ */
/* Decisions & reports                                                 */
/* ------------------------------------------------------------------ */

export type DecisionKind =
  | 'continue_activity'
  | 'schedule_rest'
  | 'reassign_task'
  | 'continue_eva'
  | 'return_to_habitat'
  | 'enter_shelter'
  | 'investigate_system'
  | 'reduce_nonessential'
  | 'emergency_protocol';

export interface DecisionOption {
  kind: DecisionKind;
  scenario: ScenarioId;
  label: string;
  detail: string;
  expectedEffect: string;
  risk: 'low' | 'moderate' | 'elevated';
}

export interface MetricSummary {
  fatigue: number;
  restingHeartRate: number;
  reactionTime: number;
  sleepHours: number;
  cumulativeDose: number;
}

export interface OperationalDecision {
  id: string;
  astronautId: string;
  missionMinute: number;
  createdAtIso: string;
  scenarioId: ScenarioId;
  kind: DecisionKind;
  label: string;
  rationale: string;
  projected: MetricSummary;
  alternative: MetricSummary;
  horizonMinutes: number;
}

export interface ProjectionPoint {
  minute: number;
  fatigue: number;
  restingHeartRate: number;
  reactionTime: number;
  sleepHours: number;
  cumulativeDose: number;
}

export interface DecisionProjection {
  option: DecisionOption;
  horizonMinutes: number;
  withDecision: ProjectionPoint[];
  withoutDecision: ProjectionPoint[];
  baseline: MetricSummary;
  projected: MetricSummary;
  alternative: MetricSummary;
}

export interface ReportStats {
  observations: number;
  meanRestingHeartRate: number;
  meanSleepHours: number;
  meanFatigue: number;
  medianReactionTime: number | null;
  doseDelta: number;
  alertCount: number;
}

export interface ReportBaselineRow {
  label: string;
  unit: string;
  baseline: number;
  observed: number;
  deltaPct: number;
}

export interface HealthReport {
  id: string;
  astronautId: string;
  missionId: string;
  missionName: string;
  generatedAtIso: string;
  periodStartMinute: number;
  periodEndMinute: number;
  title: string;
  summary: string[];
  stats: ReportStats;
  baselineRows: ReportBaselineRow[];
  alerts: {
    id: string;
    title: string;
    level: Exclude<AlertLevel, 'normal'>;
    createdAtMinute: number;
    acknowledged: boolean;
  }[];
  events: { minute: number; title: string; severity: MissionEvent['severity'] }[];
  assessments: { id: string; missionMinute: number; fatigue: number; stress: number; note: string }[];
  cognitiveTests: { id: string; missionMinute: number; medianMs: number; changePct: number }[];
  decisions: {
    id: string;
    missionMinute: number;
    label: string;
    projected: MetricSummary;
    alternative: MetricSummary;
  }[];
  followUps: string[];
  provenance: string[];
  limitations: string[];
}

/* ------------------------------------------------------------------ */
/* Settings / workspace                                                */
/* ------------------------------------------------------------------ */

export interface Settings {
  speed: number;
  reducedMotion: boolean;
  useCloudAI: boolean;
  autoPauseOnReview: boolean;
  rules: DetectionRule[];
  assistantModel: string;
}

export interface PersistedWorkspace {
  version: 1;
  mission: Mission;
  sim: SimulationState;
  observations: HealthObservation[];
  alerts: HealthAlert[];
  assessments: Assessment[];
  cognitiveTests: CognitiveTestResult[];
  decisions: OperationalDecision[];
  reports: HealthReport[];
  selectedAstronautId: string;
  settings: Settings;
  savedAtIso: string;
}
