import { useMemo } from 'react';
import { useOrbitStore } from '../store/orbitStore';
import { computeBaseline } from '../engines/health/baseline';
import { ASTRONAUT_BY_ID } from '../data/astronauts';
import type { HealthObservation } from '../types/domain';

export function useCrewBaseline(astronautId: string) {
  const observations = useOrbitStore((state) => state.observations);
  const clock = useOrbitStore((state) => state.sim.clock);
  return useMemo(
    () => computeBaseline(ASTRONAUT_BY_ID[astronautId], observations, clock),
    [astronautId, observations, clock],
  );
}

export function useCrewObservations(astronautId: string): HealthObservation[] {
  const observations = useOrbitStore((state) => state.observations);
  return useMemo(
    () => observations.filter((observation) => observation.astronautId === astronautId),
    [observations, astronautId],
  );
}

export function useLatestObservation(astronautId: string): HealthObservation | null {
  const observations = useCrewObservations(astronautId);
  return observations.length > 0 ? observations[observations.length - 1] : null;
}

export function useAlertsFor(astronautId?: string) {
  const alerts = useOrbitStore((state) => state.alerts);
  return useMemo(
    () =>
      alerts.filter(
        (alert) => (astronautId === undefined || alert.astronautId === astronautId) && !alert.acknowledged,
      ),
    [alerts, astronautId],
  );
}
