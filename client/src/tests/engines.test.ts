import { describe, expect, it } from 'vitest';
import { ASTRONAUT_BY_ID } from '../data/astronauts';
import { DEFAULT_RULES, SIM_CONFIG } from '../engines/simulation/config';
import { advanceSimulation, createInitialSimulation } from '../engines/simulation/simulator';
import {
  activateScenario,
  applyScenarioDecision,
  optionsForScenario,
} from '../engines/simulation/scenarios';
import { projectDecision, summaryFor } from '../engines/simulation/projection';
import { computeBaseline, deviation } from '../engines/health/baseline';
import { computeDailyDose, detectAnomalies } from '../engines/anomaly/engine';
import { buildHealthReport } from '../engines/reporting/report';
import { explainLocally } from '../engines/explain/localExplainer';
import { scoreAssessment } from '../data/assessmentItems';
import type { HealthObservation, Mission, SimulationState } from '../types/domain';

const SEED = 424242;
const CREW_ID = 'cdr-okafor';
const profile = ASTRONAUT_BY_ID[CREW_ID];
const initial = createInitialSimulation(SEED);

function detectFrom(sim: SimulationState, observations: HealthObservation[]) {
  const baseline = computeBaseline(profile, observations, sim.clock);
  const crew = sim.crew[CREW_ID];
  return {
    baseline,
    alerts: detectAnomalies({
      profile,
      observations: observations.filter((o) => o.astronautId === CREW_ID),
      baseline,
      nowMinute: sim.clock,
      rules: DEFAULT_RULES,
      env: sim.env,
      comms: sim.env.comms,
      scenarioId: sim.scenario.id,
      crew: {
        activity: crew.activity,
        location: crew.location,
        dailyDose: computeDailyDose(crew),
        recentExercise: false,
        recentEva: false,
        workload: crew.workload,
      },
      crewState: crew,
    }),
  };
}

describe('synthetic telemetry + personal baseline', () => {
  it('creates seven days of deterministic history for every crew member', () => {
    expect(initial.observations.length).toBeGreaterThan(400);
    const crewObs = initial.observations.filter((o) => o.astronautId === CREW_ID);
    expect(crewObs.length).toBeGreaterThan(150);
    expect(new Set(initial.observations.map((o) => o.astronautId)).size).toBe(3);
    expect(initial.state.clock).toBe(SIM_CONFIG.missionStartMinute);
    for (const observation of initial.observations.slice(0, 25)) {
      expect(observation.source).toBe('SYNTHETIC');
      expect(observation.missionMinute % 60).toBe(0);
    }
  });

  it('reproduces the same mission from the same seed and diverges with another seed', () => {
    const again = createInitialSimulation(SEED);
    const lastA = initial.observations.filter((o) => o.astronautId === CREW_ID).at(-1);
    const lastB = again.observations.filter((o) => o.astronautId === CREW_ID).at(-1);
    expect(lastA).toEqual(lastB);

    const different = createInitialSimulation(SEED + 1);
    const lastC = different.observations.filter((o) => o.astronautId === CREW_ID).at(-1);
    expect(lastC?.restingHeartRate).not.toBe(lastA?.restingHeartRate);
  });

  it('derives a rolling baseline with a standard deviation when enough observations exist', () => {
    const baseline = computeBaseline(profile, initial.observations, initial.state.clock);
    const rhr = baseline.metrics.restingHeartRate;
    expect(rhr.method).toBe('rolling');
    expect(rhr.n).toBeGreaterThan(50);
    expect(rhr.value).toBeGreaterThan(50);
    expect(rhr.sd).toBeGreaterThan(0);
    expect(baseline.metrics.sleepHours.value).toBeGreaterThan(6);
    expect(baseline.windowHours).toBe(72);
  });

  it('classifies a large deviation without claiming a diagnosis', () => {
    const result = deviation(82, 64, 3);
    expect(result.pct).toBeCloseTo(28.125, 2);
    expect(result.band).toBe('large');
    expect(result.z).toBeCloseTo(6, 5);
  });
});

describe('fatigue scenario, detection and decision support', () => {
  it('creates an explainable alert after restricted sleep and a recovery decision changes the trajectory', () => {
    // 1-4: start mission, select astronaut, nominal observations and baseline.
    let sim = initial.state;
    const observations = [...initial.observations];
    const nominalBaseline = computeBaseline(profile, observations, sim.clock);
    expect(nominalBaseline.sampleCount).toBeGreaterThan(50);

    // 5-7: activate the fatigue scenario and advance simulated time.
    sim = activateScenario(sim, 'fatigue', CREW_ID);
    expect(sim.scenario.id).toBe('fatigue');
    expect(sim.scenario.stage).toBe('decision_pending');
    expect(optionsForScenario('fatigue')).toHaveLength(3);

    const firstAdvance = advanceSimulation(sim, 26 * 60);
    sim = firstAdvance.state;
    observations.push(...firstAdvance.observations);

    // 8-9: detect a baseline deviation and build a fully explained alert.
    const { alerts } = detectFrom(sim, observations);
    expect(alerts.length).toBeGreaterThan(0);
    const fatigueAlert = alerts.find((alert) =>
      ['sleep-reduced', 'fatigue-elevated', 'multi-factor'].includes(alert.ruleId),
    );
    expect(fatigueAlert).toBeDefined();
    expect(fatigueAlert!.evidence.length).toBeGreaterThan(0);
    expect(fatigueAlert!.recommendedWorkflow.length).toBeGreaterThan(0);
    expect(fatigueAlert!.limitations.join(' ')).toMatch(/not a validated clinical|synthetic/i);
    expect(fatigueAlert!.contributingFactors.length).toBeGreaterThan(0);
    expect(alerts.some((alert) => alert.ruleId === 'multi-factor')).toBe(true);

    // 10-11: apply a rest-scheduling decision and observe the modelled consequences.
    const projection = projectDecision(sim, CREW_ID, 'schedule_rest', 720);
    expect(projection).not.toBeNull();
    expect(projection!.withDecision.length).toBeGreaterThan(2);
    expect(projection!.projected.fatigue).toBeLessThan(projection!.alternative.fatigue);

    const restBranch = advanceSimulation(applyScenarioDecision(sim, 'schedule_rest', CREW_ID), 12 * 60);
    const continueBranch = advanceSimulation(sim, 12 * 60);
    expect(restBranch.state.crew[CREW_ID].fatigue).toBeLessThan(
      continueBranch.state.crew[CREW_ID].fatigue,
    );
    expect(restBranch.state.scenario.stage).toBe('resolved');
    expect(restBranch.state.scenario.resolution).toMatch(/protected.*sleep window/i);

    // 12: generate a report containing real period data and explicit limitations.
    const mission: Mission = {
      id: 'test-mission',
      name: 'TEST OUTPOST',
      designation: 'SIM-TEST',
      seed: SEED,
      epochIso: SIM_CONFIG.epochIso,
      createdAtIso: new Date().toISOString(),
      location: 'test',
    };
    const baseline = computeBaseline(profile, observations, sim.clock);
    const report = buildHealthReport({
      mission,
      profile,
      baseline,
      observations,
      alerts,
      assessments: [],
      cognitiveTests: [],
      decisions: [],
      events: restBranch.state.events,
      nowMinute: sim.clock,
      periodDays: 7,
    });
    expect(report.stats.observations).toBeGreaterThan(100);
    expect(report.alerts.length).toBeGreaterThan(0);
    expect(report.baselineRows.length).toBeGreaterThan(5);
    expect(report.summary.join(' ')).toContain('not intended for clinical decision-making');
    expect(report.limitations.length).toBeGreaterThan(4);
    expect(report.provenance.join(' ')).toContain('synthetic seed');
  });

  it('does not produce clinical-style alerts during nominal, rested operation', () => {
    const { alerts } = detectFrom(initial.state, initial.observations);
    expect(alerts.filter((alert) => alert.level === 'review')).toHaveLength(0);
    expect(alerts.filter((alert) => alert.ruleId === 'multi-factor')).toHaveLength(0);
  });
});

describe('radiation scenario', () => {
  it('reduces modelled exposure when the crew member shelters', () => {
    const armed = activateScenario(initial.state, 'radiation', CREW_ID);
    expect(armed.env.spe?.active).toBe(true);
    const shelter = applyScenarioDecision(armed, 'enter_shelter', CREW_ID);
    const shelterAdvance = advanceSimulation(shelter, 4 * 60);
    const exposedAdvance = advanceSimulation(armed, 4 * 60);
    expect(shelterAdvance.state.crew[CREW_ID].cumulativeDose).toBeLessThan(
      exposedAdvance.state.crew[CREW_ID].cumulativeDose,
    );
    expect(shelterAdvance.state.crew[CREW_ID].location).toBe('shelter');
    expect(exposedAdvance.state.crew[CREW_ID].location).toBe('eva');
  });
});

describe('assessments and explanations', () => {
  it('scores the self-report in the documented direction', () => {
    const severe = scoreAssessment(
      ['sleep_quality', 'fatigue', 'stress', 'discomfort', 'workload', 'mood', 'concentration'].map(
        (itemId) => ({ itemId, value: 10 }),
      ),
    );
    expect(severe.fatigue).toBe(100);
    expect(severe.sleepQuality).toBe(0);
    expect(severe.mood).toBe(0);
    const rested = scoreAssessment(
      ['sleep_quality', 'fatigue', 'stress', 'discomfort', 'workload', 'mood', 'concentration'].map(
        (itemId) => ({ itemId, value: 0 }),
      ),
    );
    expect(rested.fatigue).toBe(0);
    expect(rested.sleepQuality).toBe(100);
  });

  it('provides a useful offline explanation grounded in the supplied state', () => {
    const baseline = computeBaseline(profile, initial.observations, initial.state.clock);
    const latest = initial.observations.filter((o) => o.astronautId === CREW_ID).at(-1)!;
    const explanation = explainLocally('Explain the fatigue finding', {
      profileName: profile.name,
      role: profile.role,
      latest,
      baseline,
      fatigue: latest.fatigue,
      stress: latest.stress,
      sleepHours: latest.sleepHours,
      reactionTime: latest.reactionTime,
      restingHeartRate: latest.restingHeartRate,
      hrv: latest.hrv,
      dailyDose: 0.4,
      cumulativeDose: latest.cumulativeDose,
      envCo2: 2600,
      envO2: 20.9,
      eclssStatus: 'nominal',
      comms: 'delay',
      activeAlerts: [],
      scenarioLabel: null,
    });
    expect(explanation.mode).toBe('local');
    expect(explanation.text).toContain(profile.name);
    expect(explanation.text.toLowerCase()).toContain('not a diagnosis');
    expect(explanation.sources.length).toBeGreaterThan(0);
    expect(explanation.text).not.toContain('I diagnosed');
  });
});

describe('decision projections', () => {
  it('exposes a baseline and both counterfactual branches', () => {
    const armed = activateScenario(initial.state, 'fatigue', CREW_ID);
    const projection = projectDecision(armed, CREW_ID, 'reassign_task', 480);
    expect(projection).not.toBeNull();
    expect(projection!.withoutDecision[0]).toEqual({
      minute: armed.clock,
      fatigue: Math.round(summaryFor(armed, CREW_ID).fatigue),
      restingHeartRate: summaryFor(armed, CREW_ID).restingHeartRate,
      reactionTime: summaryFor(armed, CREW_ID).reactionTime,
      sleepHours: summaryFor(armed, CREW_ID).sleepHours,
      cumulativeDose: summaryFor(armed, CREW_ID).cumulativeDose,
    });
    expect(projection!.withDecision.length).toBeGreaterThan(1);
    expect(projection!.withoutDecision.length).toBeGreaterThan(1);
    expect(projection!.horizonMinutes).toBe(480);
  });
});
