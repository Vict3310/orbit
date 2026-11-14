import { db } from './db';
import { ASTRONAUTS } from '../data/astronauts';
import { computeBaseline } from '../engines/health/baseline';
import type { PersistedWorkspace } from '../types/domain';

/**
 * Persists the workspace snapshot plus queryable domain tables in IndexedDB.
 * The snapshot is authoritative for restore; the tables exist so observations,
 * alerts, assessments and reports remain inspectable records.
 */
export async function saveWorkspace(snapshot: PersistedWorkspace): Promise<void> {
  const now = snapshot.savedAtIso;
  void now;
  const baselines = ASTRONAUTS.map((profile) =>
    computeBaseline(profile, snapshot.observations, snapshot.sim.clock),
  );

  await db.transaction(
    'rw',
    [
      db.workspace,
      db.astronauts,
      db.observations,
      db.alerts,
      db.assessments,
      db.cognitiveTests,
      db.decisions,
      db.reports,
      db.baselines,
      db.events,
    ],
    async () => {
      await db.workspace.put({ id: 'main', ...snapshot });
      await db.astronauts.bulkPut(ASTRONAUTS);
      // Mirror the most recent observation window. The authoritative full
      // series lives in the workspace snapshot above.
      await db.observations.bulkPut(snapshot.observations.slice(-600));
      await db.alerts.bulkPut(snapshot.alerts);
      await db.assessments.bulkPut(snapshot.assessments);
      await db.cognitiveTests.bulkPut(snapshot.cognitiveTests);
      await db.decisions.bulkPut(snapshot.decisions);
      await db.reports.bulkPut(snapshot.reports);
      await db.baselines.bulkPut(baselines);
      await db.events.bulkPut(snapshot.sim.events);
    },
  );
}

export async function loadWorkspace(): Promise<PersistedWorkspace | null> {
  const record = await db.workspace.get('main');
  if (!record) return null;
  if (record.version !== 1) return null;
  const { id: _id, ...snapshot } = record;
  void _id;
  return snapshot;
}

export async function clearWorkspace(): Promise<void> {
  await db.transaction(
    'rw',
    [
      db.workspace,
      db.astronauts,
      db.observations,
      db.alerts,
      db.assessments,
      db.cognitiveTests,
      db.decisions,
      db.reports,
      db.baselines,
      db.events,
    ],
    async () => {
      await Promise.all([
        db.workspace.clear(),
        db.astronauts.clear(),
        db.observations.clear(),
        db.alerts.clear(),
        db.assessments.clear(),
        db.cognitiveTests.clear(),
        db.decisions.clear(),
        db.reports.clear(),
        db.baselines.clear(),
        db.events.clear(),
      ]);
    },
  );
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
