import type { OrbitStore } from '../store/orbitStore';
import { activeAlertsFor, profileFor, selectedDashboard } from '../store/orbitStore';
import { computeDailyDose } from '../engines/anomaly/engine';
import type { MedContextPayload } from './api';
import type { ExplainerContext } from '../engines/explain/localExplainer';

export interface MedContextBundle {
  payload: MedContextPayload;
  local: ExplainerContext;
}

export function buildMedContext(state: OrbitStore): MedContextBundle {
  const profile = profileFor(state);
  const { latest, baseline } = selectedDashboard(state);
  const crew = state.sim.crew[state.selectedAstronautId];
  const active = activeAlertsFor(state, state.selectedAstronautId);
  const dailyDose = crew ? computeDailyDose(crew) : 0;

  const baselineRecord: Record<string, number> = {};
  for (const metric of Object.values(baseline.metrics)) {
    baselineRecord[metric.key] = Number(metric.value.toFixed(2));
  }

  const latestRecord: Record<string, number | string> = latest
    ? {
        missionMinute: latest.missionMinute,
        restingHeartRate: latest.restingHeartRate,
        heartRate: latest.heartRate,
        hrv: latest.hrv,
        respiratoryRate: latest.respiratoryRate,
        spo2: latest.spo2,
        sleepHours: latest.sleepHours,
        sleepConsistency: latest.sleepConsistency,
        fatigue: latest.fatigue,
        stress: latest.stress,
        mood: latest.mood,
        reactionTime: latest.reactionTime,
        cognitiveScore: latest.cognitiveScore,
        radiationDoseRate: latest.radiationDoseRate,
        cumulativeDose: latest.cumulativeDose,
        cabinCo2: latest.cabinCo2,
        cabinO2: latest.cabinO2,
        activity: latest.activity,
        location: latest.location,
      }
    : {};

  const alertRecords = active.slice(0, 8).map((alert) => ({
    title: alert.title,
    level: alert.level,
    summary: alert.summary,
  }));

  return {
    payload: {
      astronaut: { name: profile.name, role: profile.role },
      baseline: baselineRecord,
      latest: latestRecord,
      alerts: alertRecords,
      scenario: state.sim.scenario.label,
      environment: {
        co2: Math.round(state.sim.env.co2),
        o2: Number(state.sim.env.o2.toFixed(1)),
        eclssStatus: state.sim.env.eclssStatus,
      },
      comms: state.sim.env.comms,
    },
    local: {
      profileName: profile.name,
      role: profile.role,
      latest,
      baseline,
      fatigue: latest?.fatigue ?? 0,
      stress: latest?.stress ?? 0,
      sleepHours: latest?.sleepHours ?? 0,
      reactionTime: latest?.reactionTime ?? profile.baseline.reactionTime,
      restingHeartRate: latest?.restingHeartRate ?? profile.baseline.restingHeartRate,
      hrv: latest?.hrv ?? profile.baseline.hrv,
      dailyDose,
      cumulativeDose: latest?.cumulativeDose ?? 0,
      envCo2: state.sim.env.co2,
      envO2: state.sim.env.o2,
      eclssStatus: state.sim.env.eclssStatus,
      comms: state.sim.env.comms,
      activeAlerts: alertRecords,
      scenarioLabel: state.sim.scenario.label,
    },
  };
}
