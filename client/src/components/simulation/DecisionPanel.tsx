import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowUpRight, CheckCircle2, GitCompareArrows } from 'lucide-react';
import type { DecisionKind, DecisionProjection } from '../../types/domain';
import { useOrbitStore } from '../../store/orbitStore';
import { optionsForScenario, SCENARIO_META } from '../../engines/simulation/scenarios';
import { profileFor } from '../../store/orbitStore';
import { formatMET } from '../../lib/format';
import { ComparisonChart } from '../charts/TrendChart';
import { ALERT_META } from '../../lib/severity';
import { Badge, Button, cn } from '../ui';

const RISK_TONE: Record<'low' | 'moderate' | 'elevated', 'ok' | 'caution' | 'critical'> = {
  low: 'ok',
  moderate: 'caution',
  elevated: 'critical',
};

function signed(value: number, digits = 0): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(digits)}`;
}

export function DecisionPanel() {
  const sim = useOrbitStore((s) => s.sim);
  const decisions = useOrbitStore((s) => s.decisions);
  const previewDecision = useOrbitStore((s) => s.previewDecision);
  const resolveScenario = useOrbitStore((s) => s.resolveScenario);
  const launchScenario = useOrbitStore((s) => s.launchScenario);
  const advance = useOrbitStore((s) => s.advance);
  const alerts = useOrbitStore((s) => s.alerts);
  const profile = useOrbitStore((s) => profileFor(s));
  const activeAlerts = useMemo(
    () =>
      [...alerts]
        .filter((alert) => !alert.acknowledged)
        .sort((a, b) => b.createdAtMinute - a.createdAtMinute),
    [alerts],
  );

  const options = useMemo(() => optionsForScenario(sim.scenario.id), [sim.scenario.id]);
  const [selectedKind, setSelectedKind] = useState<DecisionKind | null>(null);
  const [projection, setProjection] = useState<DecisionProjection | null>(null);

  const stage = sim.scenario.stage;
  const meta = SCENARIO_META.find((scenario) => scenario.id === sim.scenario.id);

  useEffect(() => {
    if (stage !== 'decision_pending') {
      setProjection(null);
      return;
    }
    const first = optionsForScenario(useOrbitStore.getState().sim.scenario.id)[0];
    if (!first) return;
    setSelectedKind(first.kind);
    setProjection(useOrbitStore.getState().previewDecision(first.kind));
    // The scenario start minute and stage identify a fresh decision point.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, sim.scenario.startedMinute, sim.scenario.id]);

  const chartData = useMemo(() => {
    if (!projection) return [];
    const map = new Map<number, { minute: number; withDecision: number; withoutDecision: number }>();
    for (const point of projection.withoutDecision) {
      map.set(point.minute, {
        minute: point.minute,
        withDecision: 0,
        withoutDecision: point.fatigue,
      });
    }
    for (const point of projection.withDecision) {
      const existing = map.get(point.minute);
      map.set(point.minute, {
        minute: point.minute,
        withDecision: point.fatigue,
        withoutDecision: existing?.withoutDecision ?? 0,
      });
    }
    return [...map.values()].sort((a, b) => a.minute - b.minute);
  }, [projection]);

  const lastDecision = decisions.find(
    (decision) =>
      decision.astronautId === sim.scenario.primaryAstronautId &&
      decision.scenarioId === sim.scenario.id,
  );

  if (!sim.scenario.id) {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <GitCompareArrows size={18} className="mt-0.5 text-accent" />
          <div>
            <h3 className="font-display text-[13px] text-ink">Decision support is ready</h3>
            <p className="mt-1 text-[11px] leading-5 text-muted">
              Activate a scenario to create a decision point. ORBIT will show the triggering
              evidence, the operational options, and two deterministic projections: the mission as
              planned and the mission with your decision applied.
            </p>
          </div>
        </div>
        <ol className="grid gap-2 sm:grid-cols-2">
          {[
            'Detect an anomaly and explain the triggering observations',
            'Review mission context and data limitations',
            'Choose a structured assessment or operational response',
            'Project the modelled consequences before committing',
            'Record the decision and continue monitoring',
            'Document the outcome in a mission health report',
          ].map((step, index) => (
            <li key={step} className="flex gap-2 border border-line bg-bg px-3 py-2">
              <span className="font-mono text-[9px] text-accent">{String(index + 1).padStart(2, '0')}</span>
              <span className="text-[10px] leading-4 text-muted">{step}</span>
            </li>
          ))}
        </ol>
        {activeAlerts.length > 0 && (
          <div className="border border-line bg-bg p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="label">Latest active alert</span>
              <Badge tone={ALERT_META[activeAlerts[0].level].tone}>
                {ALERT_META[activeAlerts[0].level].label}
              </Badge>
            </div>
            <p className="text-[11px] text-ink">{activeAlerts[0].title}</p>
            <p className="mt-1 text-[10px] leading-4 text-muted">{activeAlerts[0].summary}</p>
            <Link
              to={`/alerts?focus=${encodeURIComponent(activeAlerts[0].id)}`}
              className="mt-2 inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.06em] text-accent"
            >
              Inspect evidence <ArrowUpRight size={11} />
            </Link>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => launchScenario('fatigue')}>
            Activate fatigue scenario
          </Button>
          <Button variant="secondary" onClick={() => launchScenario('radiation')}>
            Radiation event
          </Button>
        </div>
        <p className="text-[9px] leading-4 text-muted/70">
          Decisions in ORBIT are operational demonstrations, not medical treatment recommendations.
        </p>
      </div>
    );
  }

  if (stage === 'resolved') {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-3 border border-ok/30 bg-ok/5 p-3">
          <CheckCircle2 size={18} className="mt-0.5 text-ok" />
          <div>
            <h3 className="font-display text-[13px] text-ink">Decision recorded</h3>
            <p className="mt-1 text-[11px] leading-5 text-muted">
              {sim.scenario.resolution ?? 'The operational decision has been applied.'}
            </p>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.06em] text-muted/70">
              {formatMET(sim.scenario.startedMinute ?? sim.clock)} · {meta?.title}
            </p>
          </div>
        </div>

        {lastDecision && (
          <div className="border border-line bg-surface2 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-display text-[11px] text-ink">{lastDecision.label}</span>
              <Badge tone="accent">MODEL PROJECTION</Badge>
            </div>
            <p className="mt-1 text-[10px] leading-4 text-muted">{lastDecision.rationale}</p>
            <div className="mt-3 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
              <ComparisonCell label="Fatigue /100" value={lastDecision.projected.fatigue} alternate={lastDecision.alternative.fatigue} digits={0} />
              <ComparisonCell label="Resting HR" value={lastDecision.projected.restingHeartRate} alternate={lastDecision.alternative.restingHeartRate} digits={0} />
              <ComparisonCell label="Reaction ms" value={lastDecision.projected.reactionTime} alternate={lastDecision.alternative.reactionTime} digits={0} />
              <ComparisonCell label="Sleep h" value={lastDecision.projected.sleepHours} alternate={lastDecision.alternative.sleepHours} digits={1} />
            </div>
            <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.05em] text-muted/60">
              After {Math.round(lastDecision.horizonMinutes / 60)} simulated hours · compared with no action
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => advance(360)}>
            Advance 6 h to observe
          </Button>
          <Button variant="secondary" onClick={() => advance(1440)}>
            Advance 24 h
          </Button>
          <Link to="/alerts" className="btn btn-secondary">
            Review alerts
          </Link>
        </div>
        <p className="text-[9px] leading-4 text-muted/70">
          The projection is produced by the same deterministic model, not a statistical forecast.
          Actual simulated values will differ as the scenario continues.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="label mb-1">Decision point</div>
          <h3 className="font-display text-[14px] text-ink">{meta?.title}</h3>
          <p className="mt-1 max-w-2xl text-[11px] leading-5 text-muted">{meta?.decisionPrompt}</p>
        </div>
        <Badge tone="caution">AWAITING RESPONSE</Badge>
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        {options.map((option) => {
          const selected = selectedKind === option.kind;
          return (
            <button
              key={option.kind}
              type="button"
              onClick={() => {
                setSelectedKind(option.kind);
                setProjection(previewDecision(option.kind));
              }}
              aria-pressed={selected}
              className={cn(
                'flex h-full flex-col border p-3 text-left transition-colors',
                selected
                  ? 'border-accent/60 bg-accent/5'
                  : 'border-line bg-bg hover:border-[#3b4d5f]',
              )}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <span className="font-display text-[11px] leading-4 text-ink">{option.label}</span>
                <Badge tone={RISK_TONE[option.risk]}>{option.risk}</Badge>
              </div>
              <p className="text-[10px] leading-4 text-muted">{option.detail}</p>
              <p className="mt-2 border-t border-line/60 pt-2 text-[9px] leading-4 text-muted/80">
                {option.expectedEffect}
              </p>
            </button>
          );
        })}
      </div>

      {projection ? (
        <div className="border border-line bg-bg p-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <GitCompareArrows size={14} className="text-accent" />
              <span className="label text-ink">Modelled consequence · fatigue</span>
            </div>
            <span className="font-mono text-[8px] uppercase tracking-[0.05em] text-muted">
              12 h horizon · same seed
            </span>
          </div>
          <ComparisonChart data={chartData} height={190} />
          <div className="mt-3 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
            <ProjectionCell
              label="Fatigue"
              unit="/100"
              projected={projection.projected.fatigue}
              alternative={projection.alternative.fatigue}
              lowerIsBetter
            />
            <ProjectionCell
              label="Resting HR"
              unit="bpm"
              projected={projection.projected.restingHeartRate}
              alternative={projection.alternative.restingHeartRate}
              lowerIsBetter
            />
            <ProjectionCell
              label="Reaction"
              unit="ms"
              projected={projection.projected.reactionTime}
              alternative={projection.alternative.reactionTime}
              lowerIsBetter
            />
            <ProjectionCell
              label="Sleep"
              unit="h"
              projected={projection.projected.sleepHours}
              alternative={projection.alternative.sleepHours}
              digits={1}
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 border border-line bg-bg px-3 py-2 text-[10px] text-muted">
          <AlertTriangle size={13} className="text-caution" />
          Select an option to compute its modelled consequence.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="primary"
          disabled={!selectedKind}
          onClick={() => {
            if (selectedKind) resolveScenario(selectedKind);
          }}
        >
          Record decision
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            const primary = sim.scenario.primaryAstronautId;
            if (!primary) return;
            const next = useOrbitStore.getState().sim;
            if (next.scenario.stage !== 'decision_pending') return;
            setProjection(previewDecision(selectedKind ?? options[0].kind));
          }}
        >
          Recompute projection
        </Button>
        <span className="font-mono text-[8px] uppercase tracking-[0.05em] text-muted/60">
          Operational response, not medical treatment
        </span>
      </div>
      <p className="text-[9px] leading-4 text-muted/70">
        The two branches are generated deterministically from the current mission state. They
        illustrate how scheduling choices can change modelled indicators; they do not predict real
        physiological outcomes.
      </p>
    </div>
  );
}

function ProjectionCell({
  label,
  unit,
  projected,
  alternative,
  lowerIsBetter = false,
  digits = 0,
}: {
  label: string;
  unit: string;
  projected: number;
  alternative: number;
  lowerIsBetter?: boolean;
  digits?: number;
}) {
  const delta = projected - alternative;
  const better = lowerIsBetter ? delta < 0 : delta > 0;
  return (
    <div className="bg-surface p-2.5">
      <div className="label mb-1.5 text-[8px]">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className="font-mono text-[15px] text-ink numeric">{projected.toFixed(digits)}</span>
        <span className="font-mono text-[8px] uppercase text-muted">{unit}</span>
      </div>
      <div className={cn('mt-1 font-mono text-[9px]', better ? 'text-ok' : delta === 0 ? 'text-muted' : 'text-caution')}>
        {signed(delta, digits)} vs planned
      </div>
    </div>
  );
}

function ComparisonCell({
  label,
  value,
  alternate,
  digits,
}: {
  label: string;
  value: number;
  alternate: number;
  digits: number;
}) {
  return (
    <div className="bg-surface p-2.5">
      <div className="label mb-1.5 text-[8px]">{label}</div>
      <div className="font-mono text-[14px] text-ink numeric">{value.toFixed(digits)}</div>
      <div className="mt-1 font-mono text-[9px] text-muted">planned {alternate.toFixed(digits)}</div>
    </div>
  );
}
