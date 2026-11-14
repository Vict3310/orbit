import { create } from 'zustand';
import type {
  Assessment,
  AssessmentDimension,
  BaselineSnapshot,
  CognitiveTestResult,
  DecisionKind,
  DecisionProjection,
  HealthAlert,
  HealthObservation,
  HealthReport,
  Mission,
  OperationalDecision,
  PersistedWorkspace,
  ReactionTrial,
  ScenarioId,
  Settings,
  SimulationState,
  ZoneId,
} from '../types/domain';
import { ASTRONAUT_BY_ID, DEFAULT_ASTRONAUT_ID } from '../data/astronauts';
import { DEFAULT_RULES, SIM_CONFIG, ZONES } from '../engines/simulation/config';
import { defaultOverride } from '../engines/simulation/healthModel';
import {
  advanceSimulation,
  createInitialSimulation,
  emitManualObservation,
  makeEvent,
} from '../engines/simulation/simulator';
import {
  activateScenario,
  applyScenarioDecision,
  decisionOption,
} from '../engines/simulation/scenarios';
import { projectDecision } from '../engines/simulation/projection';
import { computeBaseline } from '../engines/health/baseline';
import { computeDailyDose, detectAnomalies } from '../engines/anomaly/engine';
import { clamp } from '../engines/simulation/rng';
import { buildHealthReport } from '../engines/reporting/report';
import { scoreAssessment } from '../data/assessmentItems';

export interface Toast {
  id: string;
  alert: HealthAlert;
}

interface WorkspaceData {
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
}

export interface OrbitStore extends WorkspaceData {
  ready: boolean;
  running: boolean;
  demoMode: boolean;
  latestAlert: Toast | null;
  assistantOpen: boolean;
  introComplete: boolean;

  hydrate: (workspace: PersistedWorkspace | null) => void;
  startNewMission: (seed?: number) => void;
  startDemo: () => void;
  selectAstronaut: (id: string) => void;
  setRunning: (running: boolean) => void;
  setSpeed: (speed: number) => void;
  moveAstronaut: (astronautId: string, zone: ZoneId, hours?: number) => void;
  scheduleRest: (astronautId: string, hours?: number) => void;
  setWorkloadMultiplier: (value: number) => void;
  advance: (minutes: number) => void;
  tick: (elapsedSeconds: number) => void;
  setComms: (status: SimulationState['env']['comms']) => void;
  acknowledgeAlert: (id: string) => void;
  acknowledgeAll: () => void;
  dismissToast: () => void;
  launchScenario: (id: ScenarioId) => void;
  resolveScenario: (kind: DecisionKind) => OperationalDecision | null;
  previewDecision: (kind: DecisionKind) => DecisionProjection | null;
  submitAssessment: (responses: { itemId: string; value: number }[], note: string) => Assessment;
  recordCognitiveTest: (payload: {
    trials: ReactionTrial[];
    medianMs: number;
    bestMs: number;
    missed: number;
    falseStarts: number;
    durationMs: number;
  }) => CognitiveTestResult;
  generateReport: (astronautId: string, periodDays: number) => HealthReport;
  updateSettings: (patch: Partial<Settings>) => void;
  resetRules: () => void;
  setAssistantOpen: (open: boolean) => void;
  completeIntro: () => void;
  setToast: (alert: HealthAlert | null) => void;
}

function defaultSettings(): Settings {
  return {
    speed: SIM_CONFIG.defaultSpeed,
    reducedMotion: false,
    useCloudAI: true,
    autoPauseOnReview: true,
    rules: DEFAULT_RULES.map((rule) => ({ ...rule })),
    assistantModel: 'server-default',
  };
}

function newMission(seed: number): Mission {
  return {
    id: `selene-4-${seed}`,
    name: 'SELENE-4 LUNAR RESEARCH OUTPOST',
    designation: 'SIM-MISSION / ORBIT-001',
    seed,
    epochIso: SIM_CONFIG.epochIso,
    createdAtIso: new Date().toISOString(),
    location: 'Fictional lunar south-polar basin',
  };
}

function trimObservations(observations: HealthObservation[]): HealthObservation[] {
  const grouped = new Map<string, HealthObservation[]>();
  for (const observation of observations) {
    const list = grouped.get(observation.astronautId) ?? [];
    list.push(observation);
    grouped.set(observation.astronautId, list);
  }
  const trimmed: HealthObservation[] = [];
  for (const list of grouped.values()) {
    trimmed.push(...list.slice(-SIM_CONFIG.maxObservationsPerCrew));
  }
  return trimmed.sort((a, b) => a.missionMinute - b.missionMinute);
}

function createWorkspace(seed: number): WorkspaceData {
  const initial = createInitialSimulation(seed);
  return {
    mission: newMission(seed),
    sim: initial.state,
    observations: initial.observations,
    alerts: [],
    assessments: [],
    cognitiveTests: [],
    decisions: [],
    reports: [],
    selectedAstronautId: DEFAULT_ASTRONAUT_ID,
    settings: defaultSettings(),
  };
}

interface DetectionArgs {
  sim: SimulationState;
  observations: HealthObservation[];
  alerts: HealthAlert[];
  settings: Settings;
}

/** Deterministic detection pass with a six-hour per-rule cooldown. */
function runDetection(args: DetectionArgs): HealthAlert[] {
  const fresh: HealthAlert[] = [];
  const now = args.sim.clock;
  for (const astronautId of args.sim.crewOrder) {
    const profile = ASTRONAUT_BY_ID[astronautId];
    const crew = args.sim.crew[astronautId];
    if (!profile || !crew) continue;
    const observations = args.observations.filter((o) => o.astronautId === astronautId);
    const baseline = computeBaseline(profile, observations, now);
    const detected = detectAnomalies({
      profile,
      observations,
      baseline,
      nowMinute: now,
      rules: args.settings.rules,
      env: args.sim.env,
      comms: args.sim.env.comms,
      scenarioId: args.sim.scenario.id,
      crew: {
        activity: crew.activity,
        location: crew.location,
        dailyDose: computeDailyDose(crew),
        recentExercise: crew.lastExerciseMinute !== null && now - crew.lastExerciseMinute <= 180,
        recentEva: crew.lastEvaMinute !== null && now - crew.lastEvaMinute <= 240,
        workload: crew.workload,
      },
      crewState: crew,
    });

    for (const alert of detected) {
      const duplicate = [...args.alerts, ...fresh].some(
        (existing) =>
          existing.astronautId === astronautId &&
          existing.ruleId === alert.ruleId &&
          now - existing.createdAtMinute < 720,
      );
      if (!duplicate) fresh.push(alert);
    }
  }
  return fresh;
}

const initialWorkspace = createWorkspace(SIM_CONFIG.defaultSeed);

export const useOrbitStore = create<OrbitStore>((set, get) => ({
  ...initialWorkspace,
  ready: false,
  running: false,
  demoMode: false,
  latestAlert: null,
  assistantOpen: false,
  introComplete: false,

  hydrate: (workspace) => {
    if (!workspace) {
      set({ ready: true });
      return;
    }
    const selected = workspace.sim.crew[workspace.selectedAstronautId]
      ? workspace.selectedAstronautId
      : workspace.sim.crewOrder[0];
    set({
      mission: workspace.mission,
      sim: workspace.sim,
      observations: workspace.observations,
      alerts: workspace.alerts,
      assessments: workspace.assessments,
      cognitiveTests: workspace.cognitiveTests,
      decisions: workspace.decisions,
      reports: workspace.reports,
      selectedAstronautId: selected,
      settings: { ...defaultSettings(), ...workspace.settings },
      ready: true,
      running: false,
      demoMode: false,
      latestAlert: null,
    });
  },

  startNewMission: (seed) => {
    const resolvedSeed = seed ?? Math.floor(1 + Math.random() * 2_000_000_000);
    const workspace = createWorkspace(resolvedSeed);
    set({
      ...workspace,
      ready: true,
      running: false,
      demoMode: false,
      latestAlert: null,
      assistantOpen: false,
    });
  },

  startDemo: () => {
    const workspace = createWorkspace(SIM_CONFIG.defaultSeed);
    const sim = activateScenario(workspace.sim, 'fatigue', workspace.selectedAstronautId);
    const withEvent: SimulationState = {
      ...sim,
      events: [
        ...sim.events,
        makeEvent(sim.seed, {
          type: 'system',
          minute: sim.clock,
          title: 'Guided judging demonstration started',
          detail:
            'Deterministic seven-day history, nominal telemetry, fatigue scenario and seeded mission clock. Use the decision panel to record an operational response.',
          severity: 'info',
          astronautIds: sim.crewOrder,
        }),
      ],
    };
    set({
      ...workspace,
      sim: withEvent,
      settings: { ...workspace.settings, speed: 240 },
      running: true,
      demoMode: true,
      ready: true,
      latestAlert: null,
      assistantOpen: false,
    });
  },

  selectAstronaut: (id) => {
    if (!get().sim.crew[id]) return;
    set({ selectedAstronautId: id });
  },

  setRunning: (running) => set({ running }),
  setSpeed: (speed) =>
    set((state) => ({ settings: { ...state.settings, speed: clamp(speed, 15, 480) } })),

  moveAstronaut: (astronautId, zone, hours = 3) => {
    const state = get();
    if (!state.sim.crew[astronautId]) return;
    const sim = structuredClone(state.sim);
    const crew = sim.crew[astronautId];
    const profile = ASTRONAUT_BY_ID[astronautId];
    const activity =
      zone === 'exercise'
        ? 'exercise'
        : zone === 'medbay'
          ? 'medical'
          : zone === 'eva'
            ? 'eva'
            : zone === 'shelter'
              ? 'rest'
              : 'work';
    crew.overrides = crew.overrides.filter((override) => override.endMinute <= sim.clock);
    crew.overrides.push(
      defaultOverride(
        sim.clock,
        Math.max(1, hours) * 60,
        activity,
        zone,
        `Assigned to ${ZONES[zone].label}`,
        sim.scenario.id ?? undefined,
      ),
    );
    crew.location = zone;
    crew.activity = activity;
    sim.events = [
      ...sim.events,
      makeEvent(sim.seed, {
        type: 'crew',
        minute: sim.clock,
        title: `Crew repositioned · ${profile?.name ?? astronautId}`,
        detail: `${profile?.name ?? 'Crew member'} assigned to ${ZONES[zone].label} for ${hours} simulated hour${hours === 1 ? '' : 's'}. Activity and environmental exposure will update on the next tick.`,
        severity: zone === 'eva' ? 'caution' : 'info',
        zone,
        astronautIds: [astronautId],
      }),
    ].slice(-240);
    set({ sim });
  },

  scheduleRest: (astronautId, hours = 6) => {
    const state = get();
    if (!state.sim.crew[astronautId]) return;
    const sim = structuredClone(state.sim);
    const crew = sim.crew[astronautId];
    const profile = ASTRONAUT_BY_ID[astronautId];
    crew.overrides = crew.overrides.filter((override) => override.endMinute <= sim.clock);
    crew.overrides.push(
      defaultOverride(
        sim.clock,
        Math.max(1, hours) * 60,
        'rest',
        'quarters',
        `Protected rest period (${hours} h)`,
        sim.scenario.id ?? undefined,
      ),
    );
    crew.location = 'quarters';
    crew.activity = 'rest';
    sim.events = [
      ...sim.events,
      makeEvent(sim.seed, {
        type: 'crew',
        minute: sim.clock,
        title: `Rest period scheduled · ${profile?.name ?? astronautId}`,
        detail: `${hours} simulated hour${hours === 1 ? '' : 's'} of protected rest assigned in the living quarters. The health-consequence model will show a partial recovery before sleep debt is repaid.`,
        severity: 'info',
        zone: 'quarters',
        astronautIds: [astronautId],
      }),
    ].slice(-240);
    set({ sim });
  },

  setWorkloadMultiplier: (value) => {
    const state = get();
    const sim = structuredClone(state.sim);
    sim.workloadMultiplier = clamp(value, 0.5, 1.4);
    set({ sim });
  },

  advance: (minutes) => {
    const state = get();
    if (!state.ready || minutes <= 0) return;

    // Detection runs every six simulated hours inside a long advance so that
    // transient deviations are captured at the time they occurred rather than
    // only at the end of the jumped window.
    const chunkMinutes = 6 * 60;
    let sim = state.sim;
    let observations = state.observations;
    let alerts = state.alerts;
    const freshAll: HealthAlert[] = [];
    let remaining = Math.round(minutes);

    while (remaining > 0) {
      const step = Math.min(chunkMinutes, remaining);
      const result = advanceSimulation(sim, step);
      sim = result.state;
      observations = trimObservations([...observations, ...result.observations]);
      const fresh = runDetection({ sim, observations, alerts, settings: state.settings });
      if (fresh.length > 0) {
        alerts = [...alerts, ...fresh].slice(-500);
        freshAll.push(...fresh);
      }
      remaining -= step;
    }

    const shouldPause =
      state.settings.autoPauseOnReview && freshAll.some((alert) => alert.level === 'review');
    const featured =
      freshAll.find((alert) => alert.level === 'review') ??
      freshAll.find((alert) => alert.level === 'elevated') ??
      freshAll[0];

    set({
      sim,
      observations,
      alerts,
      latestAlert: featured
        ? { id: `${featured.id}-${Date.now()}`, alert: featured }
        : state.latestAlert,
      running: shouldPause ? false : state.running,
    });
  },

  tick: (elapsedSeconds) => {
    const state = get();
    if (!state.running) return;
    const minutes = Math.max(SIM_CONFIG.tickMinutes, Math.round(elapsedSeconds * state.settings.speed));
    get().advance(minutes);
  },

  setComms: (status) => {
    const state = get();
    const sim = structuredClone(state.sim);
    sim.env.comms = status;
    sim.env.commsDelaySeconds =
      status === 'loss' ? 0 : status === 'nominal' ? 0 : SIM_CONFIG.defaultCommsDelaySeconds;
    sim.events = [
      ...sim.events,
      makeEvent(sim.seed, {
        type: 'system',
        minute: sim.clock,
        title:
          status === 'loss'
            ? 'Communication loss simulated'
            : status === 'nominal'
              ? 'Communication restored'
              : 'Communication delay simulated',
        detail:
          status === 'loss'
            ? 'Local monitoring, simulation, alerting, assessments and reporting continue. Cloud explanations are unavailable; the local explanation engine is active.'
            : status === 'nominal'
              ? 'Earth communication is nominal. Cloud explanations are available when configured.'
              : 'One-way light-time delay applies to Earth communication. Local monitoring is unaffected.',
        severity: status === 'loss' ? 'caution' : 'info',
        astronautIds: sim.crewOrder,
      }),
    ].slice(-240);
    set({ sim });
  },

  acknowledgeAlert: (id) => {
    const now = get().sim.clock;
    set((state) => ({
      alerts: state.alerts.map((alert) =>
        alert.id === id
          ? { ...alert, acknowledged: true, acknowledgedAtMinute: now }
          : alert,
      ),
      latestAlert: state.latestAlert?.alert.id === id ? null : state.latestAlert,
    }));
  },

  acknowledgeAll: () => {
    const now = get().sim.clock;
    set((state) => ({
      alerts: state.alerts.map((alert) =>
        alert.acknowledged ? alert : { ...alert, acknowledged: true, acknowledgedAtMinute: now },
      ),
      latestAlert: null,
    }));
  },

  dismissToast: () => set({ latestAlert: null }),

  launchScenario: (id) => {
    const state = get();
    const sim = activateScenario(state.sim, id, state.selectedAstronautId);
    set({
      sim,
      running: true,
      demoMode: state.demoMode,
      latestAlert: null,
    });
  },

  previewDecision: (kind) => {
    const state = get();
    const primary = state.sim.scenario.primaryAstronautId ?? state.selectedAstronautId;
    return projectDecision(state.sim, primary, kind, 720);
  },

  resolveScenario: (kind) => {
    const state = get();
    const scenario = state.sim.scenario;
    if (!scenario.id || !scenario.primaryAstronautId || scenario.stage === 'resolved') return null;
    const option = decisionOption(kind);
    const projection = projectDecision(state.sim, scenario.primaryAstronautId, kind, 720);
    if (!option || !projection) return null;
    const sim = applyScenarioDecision(state.sim, kind, scenario.primaryAstronautId);
    const decision: OperationalDecision = {
      id: `dec-${scenario.primaryAstronautId}-${state.sim.clock}-${kind}`,
      astronautId: scenario.primaryAstronautId,
      missionMinute: state.sim.clock,
      createdAtIso: new Date().toISOString(),
      scenarioId: scenario.id,
      kind,
      label: option.label,
      rationale: sim.scenario.resolution ?? option.expectedEffect,
      projected: projection.projected,
      alternative: projection.alternative,
      horizonMinutes: projection.horizonMinutes,
    };
    set({
      sim,
      decisions: [decision, ...state.decisions].slice(0, 100),
      latestAlert: null,
      running: true,
    });
    return decision;
  },

  submitAssessment: (responses, note) => {
    const state = get();
    const astronautId = state.selectedAstronautId;
    const now = state.sim.clock;
    const scores = scoreAssessment(responses);
    const sim = structuredClone(state.sim);
    const crew = sim.crew[astronautId];
    crew.subjective = {
      fatigue: scores.fatigue,
      stress: scores.stress,
      mood: 100 - scores.mood,
      note,
      minute: now,
    };
    crew.fatigue = clamp(crew.fatigue * 0.6 + scores.fatigue * 0.4, 0, 100);
    crew.stress = clamp(crew.stress * 0.6 + scores.stress * 0.4, 0, 100);
    crew.mood = clamp(crew.mood * 0.6 + (100 - scores.mood) * 0.4, 0, 100);

    const observation = emitManualObservation(sim, astronautId);
    const observations = trimObservations([
      ...state.observations.filter((o) => o.id !== observation.id),
      observation,
    ]);
    const fresh = runDetection({ sim, observations, alerts: state.alerts, settings: state.settings });

    const assessment: Assessment = {
      id: `asm-${astronautId}-${now}-${state.assessments.length}`,
      astronautId,
      missionMinute: now,
      createdAtIso: new Date().toISOString(),
      instrument: 'orbit-self-report-v1',
      responses,
      scores,
      note,
      source: 'self_report',
    };

    sim.events = [
      ...sim.events,
      makeEvent(sim.seed, {
        type: 'crew',
        minute: now,
        title: 'Structured self-assessment submitted',
        detail: `Self-report recorded for ${ASTRONAUT_BY_ID[astronautId].name}. Fatigue ${scores.fatigue}/100, stress ${scores.stress}/100. The result has been added to the local observation history.`,
        severity: scores.fatigue >= 70 || scores.stress >= 70 ? 'caution' : 'info',
        astronautIds: [astronautId],
      }),
    ].slice(-240);

    set({
      sim,
      observations,
      alerts: [...state.alerts, ...fresh].slice(-500),
      assessments: [assessment, ...state.assessments].slice(0, 200),
      latestAlert: fresh.length > 0 ? { id: `${fresh[0].id}-${Date.now()}`, alert: fresh[0] } : state.latestAlert,
    });
    return assessment;
  },

  recordCognitiveTest: (payload) => {
    const state = get();
    const astronautId = state.selectedAstronautId;
    const profile = ASTRONAUT_BY_ID[astronautId];
    const now = state.sim.clock;
    const baseline = computeBaseline(profile, state.observations, now);
    const baselineMs = baseline.metrics.reactionTime?.value ?? profile.baseline.reactionTime;
    const changePct = ((payload.medianMs - baselineMs) / baselineMs) * 100;

    const sim = structuredClone(state.sim);
    const crew = sim.crew[astronautId];
    crew.reactionTimeOffsetPct = clamp(changePct * 0.5, -15, 40);
    crew.vitals = {
      ...crew.vitals,
      reactionTime: payload.medianMs,
      cognitiveScore: clamp(crew.vitals.cognitiveScore - Math.max(0, changePct) * 0.25, 5, 100),
    };

    const observation = emitManualObservation(sim, astronautId);
    observation.reactionTime = payload.medianMs;
    observation.cognitiveScore = crew.vitals.cognitiveScore;
    const observations = trimObservations([
      ...state.observations.filter((o) => o.id !== observation.id),
      observation,
    ]);
    const fresh = runDetection({ sim, observations, alerts: state.alerts, settings: state.settings });

    const result: CognitiveTestResult = {
      id: `cog-${astronautId}-${now}-${state.cognitiveTests.length}`,
      astronautId,
      missionMinute: now,
      createdAtIso: new Date().toISOString(),
      trials: payload.trials,
      medianMs: payload.medianMs,
      bestMs: payload.bestMs,
      missed: payload.missed,
      falseStarts: payload.falseStarts,
      durationMs: payload.durationMs,
      baselineMs: Math.round(baselineMs),
      changePct: Math.round(changePct * 10) / 10,
    };

    sim.events = [
      ...sim.events,
      makeEvent(sim.seed, {
        type: 'crew',
        minute: now,
        title: 'Reaction-time check completed',
        detail: `Median ${payload.medianMs} ms across ${payload.trials.length} trials; ${changePct >= 0 ? '+' : ''}${changePct.toFixed(1)}% versus the current simulated baseline. Browser timing limits apply.`,
        severity: changePct > 20 ? 'caution' : 'info',
        astronautIds: [astronautId],
      }),
    ].slice(-240);

    set({
      sim,
      observations,
      alerts: [...state.alerts, ...fresh].slice(-500),
      cognitiveTests: [result, ...state.cognitiveTests].slice(0, 200),
      latestAlert: fresh.length > 0 ? { id: `${fresh[0].id}-${Date.now()}`, alert: fresh[0] } : state.latestAlert,
    });
    return result;
  },

  generateReport: (astronautId, periodDays) => {
    const state = get();
    const profile = ASTRONAUT_BY_ID[astronautId];
    const baseline = computeBaseline(profile, state.observations, state.sim.clock);
    const report = buildHealthReport({
      mission: state.mission,
      profile,
      baseline,
      observations: state.observations,
      alerts: state.alerts,
      assessments: state.assessments,
      cognitiveTests: state.cognitiveTests,
      decisions: state.decisions,
      events: state.sim.events,
      nowMinute: state.sim.clock,
      periodDays,
    });
    set({
      reports: [report, ...state.reports.filter((existing) => existing.id !== report.id)].slice(0, 30),
    });
    return report;
  },

  updateSettings: (patch) =>
    set((state) => ({ settings: { ...state.settings, ...patch } })),

  resetRules: () =>
    set((state) => ({
      settings: { ...state.settings, rules: DEFAULT_RULES.map((rule) => ({ ...rule })) },
    })),

  setAssistantOpen: (open) => set({ assistantOpen: open }),
  completeIntro: () => set({ introComplete: true }),
  setToast: (alert) =>
    set({ latestAlert: alert ? { id: `${alert.id}-${Date.now()}`, alert } : null }),
}));

/* ------------------------------------------------------------------ */
/* Selectors                                                           */
/* ------------------------------------------------------------------ */

export function profileFor(state: OrbitStore, astronautId?: string) {
  return ASTRONAUT_BY_ID[astronautId ?? state.selectedAstronautId];
}

export function baselineFor(state: OrbitStore, astronautId?: string): BaselineSnapshot {
  const id = astronautId ?? state.selectedAstronautId;
  return computeBaseline(ASTRONAUT_BY_ID[id], state.observations, state.sim.clock);
}

export function observationsFor(state: OrbitStore, astronautId?: string): HealthObservation[] {
  const id = astronautId ?? state.selectedAstronautId;
  return state.observations.filter((o) => o.astronautId === id);
}

export function latestObservationFor(
  state: OrbitStore,
  astronautId?: string,
): HealthObservation | null {
  const observations = observationsFor(state, astronautId);
  return observations.length > 0 ? observations[observations.length - 1] : null;
}

export function activeAlertsFor(state: OrbitStore, astronautId?: string): HealthAlert[] {
  return state.alerts.filter(
    (alert) =>
      !alert.acknowledged &&
      (astronautId === undefined || alert.astronautId === astronautId),
  );
}

export function alertsFor(state: OrbitStore, astronautId?: string): HealthAlert[] {
  return astronautId
    ? state.alerts.filter((alert) => alert.astronautId === astronautId)
    : state.alerts;
}

export function selectedDashboard(state: OrbitStore) {
  const profile = profileFor(state);
  const observations = observationsFor(state);
  const latest = observations[observations.length - 1] ?? null;
  const baseline = computeBaseline(profile, state.observations, state.sim.clock);
  return { profile, observations, latest, baseline };
}

export function toPersistedWorkspace(state: OrbitStore): PersistedWorkspace {
  return {
    version: 1,
    mission: state.mission,
    sim: state.sim,
    observations: state.observations,
    alerts: state.alerts,
    assessments: state.assessments,
    cognitiveTests: state.cognitiveTests,
    decisions: state.decisions,
    reports: state.reports,
    selectedAstronautId: state.selectedAstronautId,
    settings: state.settings,
    savedAtIso: new Date().toISOString(),
  };
}

export const ASSESSMENT_DIMENSION_LABELS: Record<AssessmentDimension, string> = {
  sleepQuality: 'Sleep quality',
  fatigue: 'Fatigue',
  stress: 'Stress',
  discomfort: 'Discomfort',
  workload: 'Workload',
  mood: 'Mood',
  concentration: 'Concentration',
};
