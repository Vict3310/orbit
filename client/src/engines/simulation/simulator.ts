import type {
  AdvanceResult,
  AstronautProfile,
  CrewState,
  HealthObservation,
  MissionEvent,
  SimulationState,
} from '../../types/domain';
import { ASTRONAUTS, ASTRONAUT_BY_ID } from '../../data/astronauts';
import {
  CO2_NOMINAL_PPM,
  SIM_CONFIG,
  ZONES,
} from './config';
import {
  accumulateRadiation,
  buildObservation,
  observationNow,
  resolveActivity,
  updateCrewPhysiology,
} from './healthModel';
import { clamp, hashNoise, round } from './rng';
import { formatMET } from '../../lib/format';

export function eventId(seed: number, minute: number, title: string): string {
  const token = Math.abs(Math.round(hashNoise(seed, minute, title) * 1e9)).toString(36);
  return `evt-${minute}-${token}`;
}

export function makeEvent(
  seed: number,
  params: Omit<MissionEvent, 'id' | 'resolved'> & { resolved?: boolean },
): MissionEvent {
  return {
    id: eventId(seed, params.minute, params.title),
    resolved: params.resolved ?? false,
    ...params,
  };
}

function initialVitals(profile: AstronautProfile): CrewState['vitals'] {
  return {
    heartRate: profile.baseline.heartRate,
    restingHeartRate: profile.baseline.restingHeartRate,
    hrv: profile.baseline.hrv,
    respiratoryRate: profile.baseline.respiratoryRate,
    spo2: profile.baseline.spo2,
    systolic: profile.baseline.systolic,
    diastolic: profile.baseline.diastolic,
    reactionTime: profile.baseline.reactionTime,
    cognitiveScore: profile.baseline.cognitiveScore,
  };
}

export function createCrewState(profile: AstronautProfile): CrewState {
  return {
    astronautId: profile.id,
    location: 'quarters',
    activity: 'rest',
    fatigue: profile.baseline.fatigue,
    stress: profile.baseline.stress,
    mood: profile.baseline.mood,
    workload: 8,
    sleepSamples: [],
    doseSamples: [],
    cumulativeDose: 2.6,
    lastExerciseMinute: null,
    lastEvaMinute: null,
    reactionTimeOffsetPct: 0,
    subjective: null,
    overrides: [],
    vitals: initialVitals(profile),
    sleepQuality: 0.94,
  };
}

export function createSimulationState(seed: number, clock = SIM_CONFIG.missionStartMinute): SimulationState {
  const crew: Record<string, CrewState> = {};
  for (const profile of ASTRONAUTS) crew[profile.id] = createCrewState(profile);
  return {
    seed,
    clock,
    tick: 0,
    crewOrder: ASTRONAUTS.map((profile) => profile.id),
    crew,
    env: {
      co2: CO2_NOMINAL_PPM,
      co2Target: CO2_NOMINAL_PPM,
      o2: 20.9,
      tempC: 22.4,
      pressureKpa: 101.3,
      eclssStatus: 'nominal',
      eclssRepairMinute: null,
      spe: null,
      comms: 'delay',
      commsDelaySeconds: SIM_CONFIG.defaultCommsDelaySeconds,
    },
    events: [],
    scenario: {
      id: null,
      stage: 'idle',
      primaryAstronautId: null,
      startedMinute: null,
      label: null,
      resolution: null,
    },
    workloadMultiplier: 1,
  };
}

function updateEnvironment(
  state: SimulationState,
  newEvents: MissionEvent[],
  suppressEvents: boolean,
): void {
  const env = state.env;

  if (env.eclssRepairMinute !== null && state.clock >= env.eclssRepairMinute) {
    const wasCritical = env.eclssStatus !== 'nominal';
    env.eclssStatus = 'nominal';
    env.eclssRepairMinute = null;
    env.co2Target = CO2_NOMINAL_PPM;
    env.o2 = 20.9;
    env.tempC = 22.4;
    if (wasCritical && !suppressEvents) {
      newEvents.push(
        makeEvent(state.seed, {
          type: 'system',
          minute: state.clock,
          title: 'Life-support repair verified',
          detail:
            'Simulated CO2 removal performance has been restored. Cabin CO2 is returning to the nominal modelled band.',
          severity: 'info',
          zone: 'life-support',
          astronautIds: state.crewOrder,
        }),
      );
    }
  }

  env.co2 = clamp(env.co2 + (env.co2Target - env.co2) * 0.08, 400, 20000);
  env.o2 = clamp(env.o2 + ((env.eclssStatus === 'critical' ? 20.3 : 20.9) - env.o2) * 0.05, 15, 23);
  env.tempC = clamp(
    env.tempC + ((env.eclssStatus === 'critical' ? 24.6 : 22.4) - env.tempC) * 0.03,
    12,
    34,
  );

  if (env.spe?.active && state.clock >= env.spe.endsMinute) {
    env.spe.active = false;
    if (!suppressEvents) {
      newEvents.push(
        makeEvent(state.seed, {
          type: 'environment',
          minute: state.clock,
          title: 'Solar particle event ended',
          detail:
            'The simulated solar particle event has ended. Cumulative dose estimates remain in the mission log for review.',
          severity: 'info',
          zone: 'eva',
          astronautIds: state.crewOrder,
        }),
      );
    }
    if (state.scenario.id === 'radiation' && state.scenario.stage !== 'resolved') {
      state.scenario.stage = 'resolved';
      state.scenario.resolution =
        'The solar particle event ended before an operational decision was recorded.';
    }
  }
}

export interface AdvanceOptions {
  suppressEvents?: boolean;
}

/**
 * Advances the mission by a number of simulated minutes in fixed 15-minute
 * ticks. Rendering cadence never affects the result: one hour is always four
 * ticks, and all noise is derived from the mission seed.
 */
export function advanceSimulation(
  state: SimulationState,
  minutes: number,
  options: AdvanceOptions = {},
): AdvanceResult {
  const next = structuredClone(state);
  const observations: HealthObservation[] = [];
  const newEvents: MissionEvent[] = [];
  const steps = Math.max(0, Math.round(minutes / SIM_CONFIG.tickMinutes));

  for (let step = 0; step < steps; step += 1) {
    next.clock += SIM_CONFIG.tickMinutes;
    next.tick += 1;
    updateEnvironment(next, newEvents, Boolean(options.suppressEvents));

    for (const astronautId of next.crewOrder) {
      const profile = ASTRONAUT_BY_ID[astronautId];
      const crew = next.crew[astronautId];
      if (!profile || !crew) continue;
      const resolved = resolveActivity(crew, profile, next.clock);
      if (resolved.activity === 'exercise' && crew.activity !== 'exercise') {
        crew.lastExerciseMinute = next.clock;
      }
      if (resolved.activity === 'eva' && crew.activity !== 'eva') {
        crew.lastEvaMinute = next.clock;
      }
      crew.activity = resolved.activity;
      crew.location = resolved.location;
      updateCrewPhysiology(crew, {
        profile,
        env: next.env,
        clock: next.clock,
        seed: next.seed,
        tick: next.tick,
        workloadMultiplier: next.workloadMultiplier,
        scenarioId: next.scenario.id,
      });
      accumulateRadiation(crew, next.env, next.clock);
    }

    if (next.clock % SIM_CONFIG.observationIntervalMinutes === 0) {
      for (const astronautId of next.crewOrder) {
        const profile = ASTRONAUT_BY_ID[astronautId];
        if (profile) observations.push(buildObservation(next, astronautId, profile));
      }
    }
  }

  if (newEvents.length > 0) {
    next.events = [...next.events, ...newEvents].slice(-240);
  }

  return { state: next, observations, events: newEvents };
}

/**
 * Builds the initial seven days of simulated history, then leaves the clock at
 * Mission Day 13, 06:00. The history gives the personal baseline engine enough
 * observations to use a rolling mean rather than only profile values.
 */
export function createInitialSimulation(seed: number): AdvanceResult {
  const historyStart = SIM_CONFIG.missionStartMinute - SIM_CONFIG.historyHours * 60;
  const base = createSimulationState(seed, historyStart);
  const warmup = advanceSimulation(base, SIM_CONFIG.historyHours * 60, {
    suppressEvents: true,
  });
  return {
    state: { ...warmup.state, events: [] },
    observations: warmup.observations,
    events: [],
  };
}

export function emitManualObservation(
  state: SimulationState,
  astronautId: string,
): HealthObservation {
  return observationNow(state, astronautId);
}

export function currentZoneLabel(state: SimulationState, astronautId: string): string {
  const crew = state.crew[astronautId];
  return crew ? ZONES[crew.location].label : 'Unknown';
}

export function missionStatusLine(state: SimulationState): string {
  return `${formatMET(state.clock)} · ${state.scenario.id ? state.scenario.stage.replace('_', ' ') : 'nominal operations'}`;
}

export function crewSummary(state: SimulationState, astronautId: string) {
  const crew = state.crew[astronautId];
  if (!crew) return null;
  const sleep = crew.sleepSamples.reduce((sum, sample) => sum + sample.hours, 0);
  return {
    fatigue: round(crew.fatigue, 0),
    stress: round(crew.stress, 0),
    mood: round(crew.mood, 0),
    sleepHours: round(sleep, 1),
    restingHeartRate: round(crew.vitals.restingHeartRate, 0),
    cumulativeDose: round(crew.cumulativeDose, 2),
    activity: crew.activity,
    location: crew.location,
  };
}
