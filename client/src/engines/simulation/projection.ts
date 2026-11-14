import type {
  DecisionKind,
  DecisionProjection,
  DecisionOption,
  MetricSummary,
  ProjectionPoint,
  SimulationState,
} from '../../types/domain';
import { advanceSimulation } from './simulator';
import { applyScenarioDecision, decisionOption } from './scenarios';
import { sleep24Hours } from './healthModel';
import { round } from './rng';

export function summaryFor(state: SimulationState, astronautId: string): MetricSummary {
  const crew = state.crew[astronautId];
  return {
    fatigue: round(crew.fatigue, 0),
    restingHeartRate: round(crew.vitals.restingHeartRate, 0),
    reactionTime: round(crew.vitals.reactionTime, 0),
    sleepHours: round(sleep24Hours(crew), 1),
    cumulativeDose: round(crew.cumulativeDose, 2),
  };
}

function pointFromCrew(
  minute: number,
  crew: SimulationState['crew'][string],
): ProjectionPoint {
  return {
    minute,
    fatigue: round(crew.fatigue, 0),
    restingHeartRate: round(crew.vitals.restingHeartRate, 0),
    reactionTime: round(crew.vitals.reactionTime, 0),
    sleepHours: round(sleep24Hours(crew), 1),
    cumulativeDose: round(crew.cumulativeDose, 2),
  };
}

function pointsFrom(
  startState: SimulationState,
  endState: SimulationState,
  astronautId: string,
  observations: SimulationState['crew'][string] extends never
    ? never
    : ReturnType<typeof advanceSimulation>['observations'],
): ProjectionPoint[] {
  const points: ProjectionPoint[] = [
    pointFromCrew(startState.clock, startState.crew[astronautId]),
  ];
  for (const observation of observations) {
    if (observation.astronautId !== astronautId) continue;
    points.push({
      minute: observation.missionMinute,
      fatigue: round(observation.fatigue, 0),
      restingHeartRate: round(observation.restingHeartRate, 0),
      reactionTime: round(observation.reactionTime, 0),
      sleepHours: round(observation.sleepHours, 1),
      cumulativeDose: round(observation.cumulativeDose, 2),
    });
  }
  const last = points[points.length - 1];
  if (last.minute < endState.clock) {
    points.push(pointFromCrew(endState.clock, endState.crew[astronautId]));
  }
  return points;
}

/**
 * Runs two deterministic branches from the same state: the mission as planned
 * and the mission with the selected operational decision applied. The returned
 * curves are model projections, not predictions.
 */
export function projectDecision(
  state: SimulationState,
  astronautId: string,
  kind: DecisionKind,
  horizonMinutes = 720,
): DecisionProjection | null {
  const option: DecisionOption | undefined = decisionOption(kind);
  if (!option) return null;

  const baseline = summaryFor(state, astronautId);
  const decisionBranch = advanceSimulation(
    applyScenarioDecision(structuredClone(state), kind, astronautId),
    horizonMinutes,
  );
  const alternativeBranch = advanceSimulation(structuredClone(state), horizonMinutes);

  return {
    option,
    horizonMinutes,
    baseline,
    withDecision: pointsFrom(
      state,
      decisionBranch.state,
      astronautId,
      decisionBranch.observations,
    ),
    withoutDecision: pointsFrom(
      state,
      alternativeBranch.state,
      astronautId,
      alternativeBranch.observations,
    ),
    projected: summaryFor(decisionBranch.state, astronautId),
    alternative: summaryFor(alternativeBranch.state, astronautId),
  };
}
