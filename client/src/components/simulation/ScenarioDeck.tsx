import { Play, RotateCcw } from 'lucide-react';
import type { ScenarioId } from '../../types/domain';
import { useOrbitStore } from '../../store/orbitStore';
import { SCENARIO_META } from '../../engines/simulation/scenarios';
import { Badge, Button, cn } from '../ui';

export function ScenarioDeck() {
  const sim = useOrbitStore((s) => s.sim);
  const launchScenario = useOrbitStore((s) => s.launchScenario);

  return (
    <div className="grid gap-2 lg:grid-cols-3">
      {SCENARIO_META.map((scenario) => {
        const active = sim.scenario.id === scenario.id;
        return (
          <article
            key={scenario.id}
            className={cn(
              'flex flex-col border bg-surface',
              active ? 'border-accent/60' : 'border-line',
            )}
          >
            <div className="flex items-center justify-between border-b border-line px-3 py-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
                Scenario {String(scenario.index).padStart(2, '0')}
              </span>
              {active ? (
                <Badge tone={sim.scenario.stage === 'resolved' ? 'ok' : 'accent'}>
                  {sim.scenario.stage === 'resolved' ? 'RESOLVED' : 'ACTIVE'}
                </Badge>
              ) : (
                <span className="font-mono text-[8px] uppercase tracking-[0.06em] text-muted/60">
                  {scenario.durationLabel}
                </span>
              )}
            </div>
            <div className="flex-1 p-3">
              <h3 className="font-display text-[13px] leading-5 text-ink">{scenario.title}</h3>
              <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.05em] text-muted">
                {scenario.subtitle}
              </p>
              <p className="mt-2 text-[10px] leading-5 text-muted">{scenario.goal}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {scenario.watchFor.slice(0, 3).map((item) => (
                  <span key={item} className="chip px-1.5 py-0.5 text-[8px] normal-case">
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="border-t border-line p-2">
              <button
                type="button"
                onClick={() => launchScenario(scenario.id as ScenarioId)}
                className={cn(
                  'flex w-full items-center justify-center gap-1.5 border px-2 py-1.5 font-mono text-[9px] uppercase tracking-[0.06em]',
                  active
                    ? 'border-line bg-surface2 text-muted hover:text-ink'
                    : 'border-accent/40 bg-accent/10 text-accent hover:bg-accent/15',
                )}
              >
                {active ? <RotateCcw size={11} /> : <Play size={11} />}
                {active ? 'Restart scenario' : 'Activate scenario'}
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
