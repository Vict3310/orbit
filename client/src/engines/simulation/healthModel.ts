import type {
  AstronautProfile,
  CrewState,
  EnvironmentalState,
  HealthObservation,
  ScenarioId,
  ScheduleOverride,
  SimulationState,
  ZoneId,
} from '../../types/domain';
import { clamp, hashNoise, round } from './rng';
import { ASTRONAUT_BY_ID } from '../../data/astronauts';
import {
  ACTIVITY_WORKLOAD,
  CO2_REFERENCE_PPM,
  CREW_SCHEDULES,
  SIM_CONFIG,
  ZONES,
} from './config';

export function sleep24Hours(crew: CrewState): number {
  return crew.sleepSamples.reduce((sum, sample) => sum + sample.hours, 0);
}

export function dose24Hours(crew: CrewState): number {
  return crew.doseSamples.reduce((sum, sample) => sum + sample.mSv, 0);
}

export function sleepDebtHours(crew: CrewState, profile: AstronautProfile): number {
  return clamp(profile.baseline.sleepHours - sleep24Hours(crew), 0, 7);
}

export function doseRateFor(location: ZoneId, env: EnvironmentalState): number {
  const zone = ZONES[location];
  const speMultiplier = env.spe?.active ? env.spe.intensity * zone.speExposure : 0;
  return zone.doseRate * (1 + speMultiplier);
}

export interface ResolvedActivity {
  activity: CrewState['activity'];
  location: ZoneId;
  label: string;
  source: 'schedule' | 'override';
}

export function resolveActivity(
  crew: CrewState,
  profile: AstronautProfile,
  clock: number,
): ResolvedActivity {
  const activeOverrides = crew.overrides
    .filter((o) => clock >= o.startMinute && clock < o.endMinute)
    .sort((a, b) => b.startMinute - a.startMinute);
  if (activeOverrides.length > 0) {
    const override = activeOverrides[0];
    return {
      activity: override.kind,
      location: override.zone,
      label: override.label,
      source: 'override',
    };
  }
  const minuteOfDay = ((clock % 1440) + 1440) % 1440;
  const block = CREW_SCHEDULES[profile.roleKey].find((candidate) =>
    candidate.startMinute < candidate.endMinute
      ? minuteOfDay >= candidate.startMinute && minuteOfDay < candidate.endMinute
      : minuteOfDay >= candidate.startMinute || minuteOfDay < candidate.endMinute,
  );
  if (block) {
    return { activity: block.kind, location: block.zone, label: block.label, source: 'schedule' };
  }
  return { activity: 'rest', location: 'quarters', label: 'Unscheduled rest', source: 'schedule' };
}

const ACTIVE_SUBJECTIVE_WINDOW = 12 * 60;

function activeSubjective(crew: CrewState, clock: number) {
  if (!crew.subjective) return null;
  if (clock - crew.subjective.minute > ACTIVE_SUBJECTIVE_WINDOW) return null;
  return crew.subjective;
}

export interface PhysiologyContext {
  profile: AstronautProfile;
  env: EnvironmentalState;
  clock: number;
  seed: number;
  tick: number;
  workloadMultiplier: number;
  scenarioId: ScenarioId | null;
}

/**
 * Updates modelled sleep debt, workload, fatigue, stress, mood and vitals for
 * one 15-minute tick. Every coefficient is an illustrative demonstration
 * assumption documented in docs/SIMULATION.md.
 */
export function updateCrewPhysiology(crew: CrewState, ctx: PhysiologyContext): void {
  const { profile, env, clock, seed, tick, workloadMultiplier, scenarioId } = ctx;
  const sleeping = crew.activity === 'sleep';

  if (sleeping) {
    crew.sleepSamples.push({
      minute: clock,
      hours: (SIM_CONFIG.tickMinutes / 60) * crew.sleepQuality,
    });
  }
  const cutoff = clock - 1440;
  crew.sleepSamples = crew.sleepSamples.filter((sample) => sample.minute > cutoff);

  const sleepDebt = sleepDebtHours(crew, profile);
  const scenarioStress =
    scenarioId === 'radiation' ? 20 : scenarioId === 'eclss' ? 16 : scenarioId === 'fatigue' ? 8 : 0;
  const workload = clamp(
    ACTIVITY_WORKLOAD[crew.activity] * workloadMultiplier + (scenarioId === 'fatigue' ? 4 : 0),
    0,
    100,
  );
  crew.workload = workload;

  const subjective = activeSubjective(crew, clock);
  let stressTarget = clamp(
    14 + workload * 0.42 + sleepDebt * 6.5 + scenarioStress + (env.comms === 'loss' ? 6 : 0),
    0,
    100,
  );
  if (subjective) stressTarget = clamp((stressTarget * 0.6 + subjective.stress * 0.4), 0, 100);
  crew.stress = clamp(
    crew.stress + (stressTarget - crew.stress) * (sleeping ? 0.05 : 0.12),
    0,
    100,
  );

  let fatigueTarget = sleeping
    ? clamp(9 + sleepDebt * 4, 0, 90)
    : clamp(15 + sleepDebt * 10 + workload * 0.2 + crew.stress * 0.12 + crew.cumulativeDose * 0.06, 0, 100);
  // A scheduled rest period provides partial recovery even before sleep debt is repaid.
  if (crew.activity === 'rest') fatigueTarget = clamp(fatigueTarget - 12, 0, 100);
  if (subjective) fatigueTarget = clamp(fatigueTarget * 0.65 + subjective.fatigue * 0.35, 0, 100);
  crew.fatigue = clamp(
    crew.fatigue + (fatigueTarget - crew.fatigue) * (sleeping ? 0.05 : 0.09),
    0,
    100,
  );

  const moodTarget = clamp(
    profile.baseline.mood -
      sleepDebt * 3.2 -
      (crew.stress - profile.baseline.stress) * 0.22 -
      (crew.fatigue - profile.baseline.fatigue) * 0.12 +
      (subjective ? (subjective.mood - profile.baseline.mood) * 0.25 : 0),
    8,
    100,
  );
  crew.mood = clamp(crew.mood + (moodTarget - crew.mood) * 0.05, 0, 100);

  const hourOfDay = (((clock % 1440) + 1440) % 1440) / 60;
  const circadian = 2.4 * Math.cos((2 * Math.PI * (hourOfDay - 16)) / 24);
  const n = (channel: string) => hashNoise(seed, tick, crew.astronautId, channel);

  const restingHeartRate = clamp(
    profile.baseline.restingHeartRate +
      crew.fatigue * 0.13 +
      crew.stress * 0.035 +
      circadian +
      n('rhr') * 1.2,
    40,
    140,
  );
  const activityOffset =
    crew.activity === 'sleep'
      ? -3
      : crew.activity === 'rest'
        ? 2
        : crew.activity === 'medical'
          ? 2
          : crew.activity === 'work'
            ? 10
            : crew.activity === 'exercise'
              ? 52
              : 38;
  const heartRate = clamp(restingHeartRate + activityOffset + n('hr') * 3, 40, 185);
  const hrv = clamp(
    profile.baseline.hrv *
      (1 - crew.fatigue * 0.0032 - crew.stress * 0.0012) *
      (1 + n('hrv') * 0.03),
    8,
    160,
  );
  const respiratoryRate = clamp(
    profile.baseline.respiratoryRate +
      crew.fatigue * 0.012 +
      (crew.activity === 'exercise' ? 4 : crew.activity === 'eva' ? 2.5 : 0) +
      n('rr') * 0.5,
    6,
    40,
  );
  const co2Penalty = env.co2 > CO2_REFERENCE_PPM ? clamp((env.co2 - CO2_REFERENCE_PPM) / 6000, 0, 0.8) : 0;
  const spo2 = clamp(
    profile.baseline.spo2 -
      co2Penalty -
      (env.eclssStatus === 'critical' ? 0.7 : 0) +
      n('spo2') * 0.25,
    88,
    100,
  );
  const systolic = clamp(
    profile.baseline.systolic + crew.fatigue * 0.05 + crew.stress * 0.04 + n('sbp') * 2,
    80,
    195,
  );
  const diastolic = clamp(
    profile.baseline.diastolic + crew.fatigue * 0.025 + crew.stress * 0.02 + n('dbp') * 1.5,
    40,
    125,
  );
  const reactionTime = clamp(
    profile.baseline.reactionTime *
      (1 + crew.fatigue * 0.0035 + sleepDebt * 0.018 + crew.stress * 0.001) *
      (1 + n('rt') * 0.03) *
      (1 + crew.reactionTimeOffsetPct / 100),
    150,
    950,
  );
  const cognitiveScore = clamp(
    100 - crew.fatigue * 0.42 - crew.stress * 0.18 - sleepDebt * 1.5,
    5,
    100,
  );

  crew.vitals = {
    heartRate: round(heartRate, 1),
    restingHeartRate: round(restingHeartRate, 1),
    hrv: round(hrv, 1),
    respiratoryRate: round(respiratoryRate, 1),
    spo2: round(spo2, 1),
    systolic: round(systolic, 1),
    diastolic: round(diastolic, 1),
    reactionTime: round(reactionTime, 0),
    cognitiveScore: round(cognitiveScore, 1),
  };
}

export function accumulateRadiation(crew: CrewState, env: EnvironmentalState, clock: number): void {
  const rate = doseRateFor(crew.location, env);
  const dose = (rate / 24) * (SIM_CONFIG.tickMinutes / 60);
  crew.cumulativeDose = round(crew.cumulativeDose + dose, 4);
  crew.doseSamples.push({ minute: clock, mSv: dose });
  const cutoff = clock - 1440;
  crew.doseSamples = crew.doseSamples.filter((sample) => sample.minute > cutoff);
}

export function buildObservation(
  state: SimulationState,
  astronautId: string,
  profile: AstronautProfile,
  suffix = 'obs',
): HealthObservation {
  const crew = state.crew[astronautId];
  const noise = (channel: string) => hashNoise(state.seed, state.tick, astronautId, 'obs', channel);
  const sleep = sleep24Hours(crew);
  const debt = sleepDebtHours(crew, profile);
  const vitals = crew.vitals;

  return {
    id: `${astronautId}-${state.clock}-${suffix}`,
    astronautId,
    missionMinute: state.clock,
    iso: new Date(Date.parse(SIM_CONFIG.epochIso) + state.clock * 60_000).toISOString(),
    heartRate: round(vitals.heartRate + noise('hr') * 1.6, 1),
    restingHeartRate: round(vitals.restingHeartRate + noise('rhr') * 0.7, 1),
    hrv: round(vitals.hrv + noise('hrv') * 1.2, 1),
    respiratoryRate: round(vitals.respiratoryRate + noise('rr') * 0.25, 1),
    spo2: round(vitals.spo2 + noise('spo2') * 0.2, 1),
    systolic: round(vitals.systolic + noise('sbp') * 1.2, 1),
    diastolic: round(vitals.diastolic + noise('dbp') * 1.0, 1),
    sleepHours: round(sleep, 2),
    sleepConsistency: round(
      clamp(profile.baseline.sleepConsistency - debt * 7 + noise('cons') * 1.5, 10, 100),
      0,
    ),
    fatigue: round(crew.fatigue, 1),
    stress: round(crew.stress, 1),
    mood: round(crew.mood, 1),
    reactionTime: round(vitals.reactionTime + noise('rt') * 3, 0),
    cognitiveScore: round(vitals.cognitiveScore, 1),
    radiationDoseRate: round(doseRateFor(crew.location, state.env), 3),
    cumulativeDose: round(crew.cumulativeDose, 3),
    cabinCo2: Math.round(state.env.co2),
    cabinO2: round(state.env.o2, 2),
    cabinTempC: round(state.env.tempC, 1),
    activity: crew.activity,
    location: crew.location,
    workload: round(crew.workload, 0),
    dataQuality: state.env.eclssStatus === 'critical' ? 'degraded' : 'nominal',
    source: 'SYNTHETIC',
  };
}

export function observationNow(state: SimulationState, astronautId: string): HealthObservation {
  const profile = ASTRONAUT_BY_ID[astronautId] ?? ASTRONAUT_BY_ID[state.crewOrder[0]];
  return buildObservation(state, astronautId, profile, `manual-${state.tick}`);
}

export function defaultOverride(
  clock: number,
  durationMinutes: number,
  kind: CrewState['activity'],
  zone: ZoneId,
  label: string,
  scenarioId?: ScenarioId,
): ScheduleOverride {
  return {
    id: `ovr-${clock}-${kind}-${Math.round(durationMinutes)}`,
    startMinute: clock,
    endMinute: clock + durationMinutes,
    kind,
    zone,
    label,
    scenarioId,
  };
}
