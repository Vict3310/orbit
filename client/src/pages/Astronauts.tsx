import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info, Layers, Ruler } from 'lucide-react';
import { ASTRONAUTS } from '../data/astronauts';
import { useOrbitStore } from '../store/orbitStore';
import { computeBaseline } from '../engines/health/baseline';
import { METRIC_BY_KEY } from '../engines/health/metrics';
import type { DetectionMetric, HealthObservation } from '../types/domain';
import { Badge, PageHeader, Panel } from '../components/ui';
import { CrewCard } from '../components/astronauts/CrewCard';
import { CrewAvatar } from '../components/astronauts/CrewAvatar';

const COMPARISON_METRICS: DetectionMetric[] = [
  'restingHeartRate',
  'hrv',
  'sleepHours',
  'reactionTime',
  'fatigue',
];

export default function Astronauts() {
  const navigate = useNavigate();
  const observations = useOrbitStore((s) => s.observations);
  const alerts = useOrbitStore((s) => s.alerts);
  const clock = useOrbitStore((s) => s.sim.clock);
  const selectedId = useOrbitStore((s) => s.selectedAstronautId);
  const selectAstronaut = useOrbitStore((s) => s.selectAstronaut);

  const baselines = useMemo(() => {
    const map: Record<string, ReturnType<typeof computeBaseline>> = {};
    for (const astronaut of ASTRONAUTS) {
      map[astronaut.id] = computeBaseline(astronaut, observations, clock);
    }
    return map;
  }, [observations, clock]);

  const latestByCrew = useMemo(() => {
    const map: Record<string, HealthObservation | null> = {};
    for (const astronaut of ASTRONAUTS) {
      const list = observations.filter((o) => o.astronautId === astronaut.id);
      map[astronaut.id] = list.length > 0 ? list[list.length - 1] : null;
    }
    return map;
  }, [observations]);

  const activeAlerts = alerts.filter((alert) => !alert.acknowledged);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Crew directory"
        title="Astronauts and personal baselines"
        description="Three fictional crew members with different physiological patterns. ORBIT compares each person with their own simulated baseline instead of applying one generic threshold to everyone."
        actions={<Badge tone="accent">FICTIONAL CREW · SYNTHETIC PROFILES</Badge>}
      />

      <Panel
        title="Why personal baselines"
        meta="Transparent methods, explicit limits"
        action={<Badge tone="muted">PROTOTYPE</Badge>}
      >
        <div className="grid gap-5 md:grid-cols-3">
          <div>
            <div className="mb-2 flex items-center gap-2 text-accent">
              <Layers size={14} />
              <span className="font-display text-[12px] text-ink">Rolling reference</span>
            </div>
            <p className="text-[11px] leading-5 text-muted">
              The trailing 72-hour mean is used when at least eight synthetic observations exist.
              Otherwise the profile baseline is used unchanged. No model is fitted.
            </p>
          </div>
          <div>
            <div className="mb-2 flex items-center gap-2 text-accent">
              <Ruler size={14} />
              <span className="font-display text-[12px] text-ink">Deviation, not diagnosis</span>
            </div>
            <p className="text-[11px] leading-5 text-muted">
              Percentage deviation is always shown. A standardised deviation is added only when a
              standard deviation is available. Rules require consecutive observations.
            </p>
          </div>
          <div>
            <div className="mb-2 flex items-center gap-2 text-accent">
              <Info size={14} />
              <span className="font-display text-[12px] text-ink">Context before escalation</span>
            </div>
            <p className="text-[11px] leading-5 text-muted">
              Recent exercise, EVA, cabin conditions and data-quality flags are displayed with every
              alert. For example, a post-exercise heart-rate rise is treated cautiously.
            </p>
          </div>
        </div>
        <p className="mt-4 border-t border-line pt-3 text-[10px] leading-5 text-muted/70">
          These baselines are illustrative synthetic values. They are not clinical reference ranges,
          and the crew members are not real NASA astronauts.
        </p>
      </Panel>

      <section aria-label="Crew profiles" className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {ASTRONAUTS.map((astronaut) => (
          <CrewCard
            key={astronaut.id}
            profile={astronaut}
            latest={latestByCrew[astronaut.id]}
            baseline={baselines[astronaut.id]}
            alerts={activeAlerts}
            selected={astronaut.id === selectedId}
            onSelect={() => selectAstronaut(astronaut.id)}
            onOpenProfile={() => navigate(`/astronauts/${astronaut.id}`)}
          />
        ))}
      </section>

      <Panel
        title="Baseline comparison across the crew"
        meta="Synthetic profile baselines with derived values"
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] border-collapse text-left">
            <caption className="sr-only">
              Personal baselines for each fictional crew member. Values are simulated and not clinical
              norms.
            </caption>
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="label px-4 py-2.5 font-normal">
                  Indicator
                </th>
                {ASTRONAUTS.map((astronaut) => (
                  <th key={astronaut.id} scope="col" className="px-4 py-2.5 font-normal">
                    <span className="flex items-center gap-2">
                      <CrewAvatar profile={astronaut} size={22} />
                      <span>
                        <span className="block font-display text-[11px] text-ink">{astronaut.name}</span>
                        <span className="block font-mono text-[8px] uppercase tracking-[0.06em] text-muted">
                          {astronaut.role}
                        </span>
                      </span>
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_METRICS.map((key) => {
                const def = METRIC_BY_KEY[key];
                return (
                  <tr key={key} className="border-b border-line/60 last:border-0">
                    <th scope="row" className="px-4 py-3 text-left font-normal">
                      <span className="block text-[11px] text-ink">{def.label}</span>
                      <span className="block font-mono text-[8px] uppercase tracking-[0.06em] text-muted">
                        {def.unit} · personal baseline
                      </span>
                    </th>
                    {ASTRONAUTS.map((astronaut) => {
                      const metric = baselines[astronaut.id].metrics[key];
                      return (
                        <td
                          key={astronaut.id}
                          className={
                            astronaut.id === selectedId
                              ? 'bg-accent/[0.04] px-4 py-3'
                              : 'px-4 py-3'
                          }
                        >
                          <span className="font-mono text-[13px] text-ink numeric">
                            {metric ? metric.value.toFixed(def.digits) : '—'}
                          </span>
                          <span className="ml-1.5 font-mono text-[9px] text-muted">{def.unit}</span>
                          <div className="mt-1 font-mono text-[8px] uppercase tracking-[0.05em] text-muted/60">
                            {metric?.method === 'rolling' ? `72h mean · n=${metric.n}` : 'profile value'}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
