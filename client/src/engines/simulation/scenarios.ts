import type {
  DecisionKind,
  DecisionOption,
  ScenarioId,
  SimulationState,
} from '../../types/domain';
import { defaultOverride } from './healthModel';
import { makeEvent } from './simulator';
import { ASTRONAUT_BY_ID } from '../../data/astronauts';

export interface ScenarioMeta {
  id: ScenarioId;
  index: number;
  title: string;
  subtitle: string;
  goal: string;
  trigger: string;
  watchFor: string[];
  durationLabel: string;
  decisionPrompt: string;
}

export const SCENARIO_META: ScenarioMeta[] = [
  {
    id: 'fatigue',
    index: 1,
    title: 'Fatigue During a Critical Mission',
    subtitle: 'Extended inspection window, restricted sleep',
    goal: 'Explore how an operational schedule changes sleep debt, modelled fatigue, cardiovascular indicators and reaction time — then decide whether to continue, rest or reassign.',
    trigger: 'Directs an extended thermal-shield inspection and compresses the next sleep opportunity to four hours.',
    watchFor: ['Sleep duration', 'Fatigue indicator', 'Resting heart rate', 'Reaction time'],
    durationLabel: '24 h schedule impact',
    decisionPrompt:
      'The priority inspection needs another 14 hours of work. Decide how to protect the crew member’s recovery.',
  },
  {
    id: 'radiation',
    index: 2,
    title: 'Radiation Exposure Event',
    subtitle: 'Solar particle event during surface operations',
    goal: 'Compare modelled exposure under three operational choices: continue the EVA, return to the habitat, or enter the radiation shelter.',
    trigger: 'Starts a simulated solar particle event while the selected astronaut is outside the habitat.',
    watchFor: ['Dose rate', 'Cumulative exposure', 'Location', 'Event timeline'],
    durationLabel: '6 h event window',
    decisionPrompt:
      'A solar particle event is in progress. Shielding differs sharply between the surface, the habitat and the storm shelter.',
  },
  {
    id: 'eclss',
    index: 3,
    title: 'Environmental Control Malfunction',
    subtitle: 'CO2 removal degraded in the habitat',
    goal: 'Inspect the life-support system, choose an operational response, and watch the environmental readings and data-quality flags change.',
    trigger: 'Degrades the simulated CO2 removal system and raises the cabin concentration toward the configured review bands.',
    watchFor: ['Cabin CO2', 'Life-support status', 'Data quality', 'Environmental alert'],
    durationLabel: 'Repair-dependent',
    decisionPrompt:
      'CO2 removal performance is degraded. Choose an operational response and monitor the cabin trend.',
  },
];

export const DECISION_OPTIONS: DecisionOption[] = [
  {
    kind: 'continue_activity',
    scenario: 'fatigue',
    label: 'Continue the planned activity',
    detail: 'Keep the 14-hour inspection window and the four-hour sleep opportunity.',
    expectedEffect: 'Sleep debt and modelled fatigue continue to accumulate; reaction time slows further.',
    risk: 'elevated',
  },
  {
    kind: 'schedule_rest',
    scenario: 'fatigue',
    label: 'Schedule additional rest',
    detail: 'Insert a 10-hour recovery period followed by a protected 8-hour sleep window.',
    expectedEffect: 'Sleep debt begins to recover; modelled fatigue and reaction time improve after the rest period.',
    risk: 'low',
  },
  {
    kind: 'reassign_task',
    scenario: 'fatigue',
    label: 'Reassign the task',
    detail: 'Reduce this crew member’s task load for eight hours and hand the inspection to the other crew.',
    expectedEffect: 'Workload falls immediately; recovery is partial unless sleep is also protected.',
    risk: 'moderate',
  },
  {
    kind: 'continue_eva',
    scenario: 'radiation',
    label: 'Continue the EVA',
    detail: 'Remain outside and finish the inspection during the event.',
    expectedEffect: 'Exposure estimate rises fastest; the mission log records the decision.',
    risk: 'elevated',
  },
  {
    kind: 'return_to_habitat',
    scenario: 'radiation',
    label: 'Return to the habitat',
    detail: 'End the EVA and continue monitoring from the pressurized habitat.',
    expectedEffect: 'Dose rate falls to the habitat shielding estimate.',
    risk: 'moderate',
  },
  {
    kind: 'enter_shelter',
    scenario: 'radiation',
    label: 'Enter the radiation shelter',
    detail: 'Move to the storm shelter for the remainder of the event.',
    expectedEffect: 'Lowest modelled dose rate; operations pause for the shelter period.',
    risk: 'low',
  },
  {
    kind: 'investigate_system',
    scenario: 'eclss',
    label: 'Investigate the life-support system',
    detail: 'Send the flight engineer to diagnose the CO2 removal fault before changing operations.',
    expectedEffect: 'Repair begins after a short diagnostic window; CO2 peaks before falling.',
    risk: 'moderate',
  },
  {
    kind: 'reduce_nonessential',
    scenario: 'eclss',
    label: 'Reduce non-essential operations',
    detail: 'Lower activity and cabin load while the scrubber is repaired.',
    expectedEffect: 'Slower CO2 rise; repair is scheduled after a longer delay.',
    risk: 'moderate',
  },
  {
    kind: 'emergency_protocol',
    scenario: 'eclss',
    label: 'Follow the emergency workflow',
    detail: 'Treat the fault as an emergency, protect the crew and prioritise the repair.',
    expectedEffect: 'Fastest repair path; the crew pauses non-essential work.',
    risk: 'low',
  },
];

export function optionsForScenario(id: ScenarioId | null): DecisionOption[] {
  return DECISION_OPTIONS.filter((option) => option.scenario === id);
}

export function decisionOption(kind: DecisionKind): DecisionOption | undefined {
  return DECISION_OPTIONS.find((option) => option.kind === kind);
}

function addScenarioEvent(
  state: SimulationState,
  title: string,
  detail: string,
  severity: 'info' | 'caution' | 'critical',
  zone: SimulationState['crew'][string]['location'],
  astronautIds: string[],
): void {
  state.events = [
    ...state.events,
    makeEvent(state.seed, {
      type: 'scenario',
      minute: state.clock,
      title,
      detail,
      severity,
      zone,
      astronautIds,
    }),
  ].slice(-240);
}

export function activateScenario(
  state: SimulationState,
  scenarioId: ScenarioId,
  astronautId: string,
): SimulationState {
  const next = structuredClone(state);
  const primary = next.crew[astronautId] ?? next.crew[next.crewOrder[0]];
  const meta = SCENARIO_META.find((s) => s.id === scenarioId);
  if (!primary || !meta) return next;

  // Clear stale scenario overrides so the new scenario starts from a clean operational plan.
  for (const id of next.crewOrder) {
    next.crew[id].overrides = next.crew[id].overrides.filter(
      (o) => o.endMinute <= next.clock || !o.scenarioId,
    );
  }

  next.scenario = {
    id: scenarioId,
    stage: 'decision_pending',
    primaryAstronautId: primary.astronautId,
    startedMinute: next.clock,
    label: meta.title,
    resolution: null,
  };
  next.workloadMultiplier = 1;

  if (scenarioId === 'fatigue') {
    primary.overrides.push(
      defaultOverride(
        next.clock,
        14 * 60,
        'work',
        'lab',
        'Extended thermal-shield inspection',
        'fatigue',
      ),
    );
    primary.overrides.push(
      defaultOverride(
        next.clock + 14 * 60,
        4 * 60,
        'sleep',
        'quarters',
        'Restricted sleep window (4 h)',
        'fatigue',
      ),
    );
    primary.overrides.push(
      defaultOverride(
        next.clock + 18 * 60,
        6 * 60,
        'work',
        'lab',
        'Inspection closeout',
        'fatigue',
      ),
    );
    next.workloadMultiplier = 1.25;
    primary.location = 'lab';
    primary.activity = 'work';
    addScenarioEvent(
      next,
      'Priority inspection directed',
      'The outpost commander has extended the thermal-shield inspection. The next sleep opportunity for the selected crew member is restricted to four hours.',
      'caution',
      'lab',
      [primary.astronautId],
    );
  }

  if (scenarioId === 'radiation') {
    primary.overrides.push(
      defaultOverride(
        next.clock,
        6 * 60,
        'eva',
        'eva',
        'External inspection during SPE',
        'radiation',
      ),
    );
    next.env.spe = {
      active: true,
      startedMinute: next.clock,
      endsMinute: next.clock + 6 * 60,
      intensity: 6,
      label: 'SPE-04 solar particle event',
    };
    primary.location = 'eva';
    primary.activity = 'eva';
    addScenarioEvent(
      next,
      'Solar particle event detected',
      'A simulated solar particle event is in progress. The selected crew member is outside the habitat; sheltering decisions now affect the exposure estimate.',
      'critical',
      'eva',
      [primary.astronautId],
    );
  }

  if (scenarioId === 'eclss') {
    next.env.eclssStatus = 'critical';
    next.env.co2Target = 8500;
    next.env.eclssRepairMinute = null;
    addScenarioEvent(
      next,
      'CO2 removal performance degraded',
      'The simulated life-support system is no longer maintaining the nominal CO2 band. Environmental readings and data-quality flags are affected.',
      'critical',
      'life-support',
      next.crewOrder,
    );
  }

  return next;
}

export function applyScenarioDecision(
  state: SimulationState,
  kind: DecisionKind,
  astronautId: string,
): SimulationState {
  const next = structuredClone(state);
  const scenarioId = next.scenario.id;
  if (!scenarioId) return next;
  const primaryId = next.scenario.primaryAstronautId ?? astronautId;
  const primary = next.crew[primaryId];
  const now = next.clock;
  let resolution = 'Decision recorded.';

  if (scenarioId === 'fatigue' && primary) {
    primary.overrides = primary.overrides.filter(
      (o) => o.scenarioId !== 'fatigue' || o.endMinute <= now,
    );
    if (kind === 'schedule_rest') {
      primary.overrides.push(
        defaultOverride(now, 10 * 60, 'rest', 'quarters', 'Directed recovery period', 'fatigue'),
      );
      primary.overrides.push(
        defaultOverride(now + 10 * 60, 8 * 60, 'sleep', 'quarters', 'Protected sleep window', 'fatigue'),
      );
      next.workloadMultiplier = 0.85;
      primary.location = 'quarters';
      primary.activity = 'rest';
      resolution =
        'A 10-hour recovery period and a protected 8-hour sleep window were added. Workload was reduced for the next 18 hours.';
    } else if (kind === 'reassign_task') {
      primary.overrides.push(
        defaultOverride(now, 2 * 60, 'rest', 'quarters', 'Immediate rest', 'fatigue'),
      );
      primary.overrides.push(
        defaultOverride(now + 2 * 60, 8 * 60, 'sleep', 'quarters', 'Protected sleep window', 'fatigue'),
      );
      primary.overrides.push(
        defaultOverride(
          now + 10 * 60,
          8 * 60,
          'work',
          'lab',
          'Reassigned low-load tasking',
          'fatigue',
        ),
      );
      next.workloadMultiplier = 0.6;
      primary.location = 'quarters';
      primary.activity = 'rest';
      resolution =
        'Task load was reduced for eight hours and handed to the other crew members. Recovery begins immediately, but the sleep window starts later than the rest-first option.';
    } else {
      primary.overrides.push(
        defaultOverride(
          now,
          8 * 60,
          'work',
          'lab',
          'Inspection continues under monitoring',
          'fatigue',
        ),
      );
      next.workloadMultiplier = 1.25;
      primary.location = 'lab';
      primary.activity = 'work';
      resolution =
        'The inspection continued as planned. Monitoring cadence is increased and the operational risk is recorded.';
    }
  }

  if (scenarioId === 'radiation' && primary) {
    if (kind === 'enter_shelter' || kind === 'return_to_habitat') {
      primary.overrides = primary.overrides.filter((o) => o.scenarioId !== 'radiation');
      if (kind === 'enter_shelter') {
        primary.overrides.push(
          defaultOverride(now, 8 * 60, 'rest', 'shelter', 'Sheltered during SPE', 'radiation'),
        );
        primary.location = 'shelter';
        primary.activity = 'rest';
        resolution =
          'The crew member moved to the radiation shelter for the remainder of the event. The lowest modelled dose rate applies.';
      } else {
        primary.overrides.push(
          defaultOverride(now, 6 * 60, 'rest', 'quarters', 'Returned to habitat', 'radiation'),
        );
        primary.location = 'quarters';
        primary.activity = 'rest';
        resolution =
          'The EVA ended and the crew member returned to the pressurized habitat. Habitat shielding now applies.';
      }
    } else {
      resolution =
        'The EVA continued during the event. The exposure estimate and the decision are recorded for review.';
    }
  }

  if (scenarioId === 'eclss') {
    if (kind === 'investigate_system') {
      next.env.co2Target = 4200;
      next.env.eclssRepairMinute = now + 2 * 60;
      resolution =
        'A diagnostic investigation is underway. Repair is modelled as complete after two hours; CO2 peaks before falling.';
    } else if (kind === 'reduce_nonessential') {
      next.env.co2Target = 6200;
      next.env.eclssRepairMinute = now + 4 * 60;
      resolution =
        'Non-essential operations were reduced. The CO2 rise slows, and repair is scheduled after four hours.';
    } else {
      next.env.co2Target = 5200;
      next.env.eclssRepairMinute = now + 90;
      next.workloadMultiplier = 0.6;
      resolution =
        'The simulated emergency workflow was followed: non-essential work paused and the repair prioritised. Recovery is modelled after 90 minutes.';
    }
  }

  next.scenario.stage = 'resolved';
  next.scenario.resolution = resolution;

  const option = decisionOption(kind);
  next.events = [
    ...next.events,
    makeEvent(next.seed, {
      type: 'decision',
      minute: now,
      title: option?.label ?? 'Operational decision recorded',
      detail: resolution,
      severity: 'info',
      astronautIds: [primaryId],
      zone: primary?.location,
    }),
  ].slice(-240);

  return next;
}
