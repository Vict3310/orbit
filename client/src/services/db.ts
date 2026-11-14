import Dexie, { type Table } from 'dexie';
import type {
  Assessment,
  AstronautProfile,
  BaselineSnapshot,
  CognitiveTestResult,
  HealthAlert,
  HealthObservation,
  HealthReport,
  MissionEvent,
  OperationalDecision,
  PersistedWorkspace,
} from '../types/domain';

interface WorkspaceRecord extends PersistedWorkspace {
  id: string;
}

interface BaselineRecord extends BaselineSnapshot {
  astronautId: string;
}

class OrbitDatabase extends Dexie {
  workspace!: Table<WorkspaceRecord, string>;
  astronauts!: Table<AstronautProfile, string>;
  observations!: Table<HealthObservation, string>;
  alerts!: Table<HealthAlert, string>;
  assessments!: Table<Assessment, string>;
  cognitiveTests!: Table<CognitiveTestResult, string>;
  decisions!: Table<OperationalDecision, string>;
  reports!: Table<HealthReport, string>;
  baselines!: Table<BaselineRecord, string>;
  events!: Table<MissionEvent, string>;

  constructor() {
    super('orbit-local');
    this.version(1).stores({
      workspace: 'id',
      astronauts: 'id',
      observations: 'id, astronautId, missionMinute',
      alerts: 'id, astronautId, createdAtMinute',
      assessments: 'id, astronautId, missionMinute',
      cognitiveTests: 'id, astronautId, missionMinute',
      decisions: 'id, astronautId, missionMinute',
      reports: 'id, astronautId',
      baselines: 'astronautId',
      events: 'id, minute',
    });
  }
}

export const db = new OrbitDatabase();
