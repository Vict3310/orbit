import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowUpRight,
  Check,
  ClipboardList,
  Info,
  Sparkles,
  TriangleAlert,
} from 'lucide-react';
import type { AlertLevel, HealthAlert } from '../types/domain';
import { ASTRONAUT_BY_ID } from '../data/astronauts';
import { useOrbitStore } from '../store/orbitStore';
import { ALERT_META } from '../lib/severity';
import { formatMET } from '../lib/format';
import { Badge, Button, EmptyState, PageHeader, Panel, cn } from '../components/ui';
import { AlertList } from '../components/alerts/AlertList';

type LevelFilter = 'all' | 'review' | 'elevated' | 'observation';

const LEVEL_FILTERS: { value: LevelFilter; label: string }[] = [
  { value: 'all', label: 'All levels' },
  { value: 'review', label: 'Requires review' },
  { value: 'elevated', label: 'Elevated' },
  { value: 'observation', label: 'Observation' },
];

export default function Alerts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const alerts = useOrbitStore((s) => s.alerts);
  const acknowledge = useOrbitStore((s) => s.acknowledgeAlert);
  const acknowledgeAll = useOrbitStore((s) => s.acknowledgeAll);
  const setAssistantOpen = useOrbitStore((s) => s.setAssistantOpen);
  const selectAstronaut = useOrbitStore((s) => s.selectAstronaut);

  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
  const [astronautFilter, setAstronautFilter] = useState<string>('all');
  const [showAcknowledged, setShowAcknowledged] = useState(false);

  const filtered = useMemo(() => {
    return [...alerts]
      .filter((alert) => (showAcknowledged ? true : !alert.acknowledged))
      .filter((alert) => (levelFilter === 'all' ? true : alert.level === levelFilter))
      .filter((alert) => (astronautFilter === 'all' ? true : alert.astronautId === astronautFilter))
      .sort((a, b) => b.createdAtMinute - a.createdAtMinute);
  }, [alerts, levelFilter, astronautFilter, showAcknowledged]);

  const focus = searchParams.get('focus');
  const selected =
    alerts.find((alert) => alert.id === focus) ?? filtered[0] ?? alerts[0] ?? null;
  const activeCount = alerts.filter((alert) => !alert.acknowledged).length;

  const handleSelect = (alert: HealthAlert) => {
    setSearchParams({ focus: alert.id });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Explainable anomaly detection"
        title="Health alerts"
        description="Every alert is produced by a deterministic rule over synthetic observations. Open one to see the triggering values, baseline, time window, contributing factors, limitations and recommended assessment workflow."
        actions={
          <>
            <Badge tone="muted">{activeCount} ACTIVE</Badge>
            <Button
              variant="secondary"
              size="sm"
              onClick={acknowledgeAll}
              disabled={activeCount === 0}
            >
              <Check size={12} /> Acknowledge all
            </Button>
          </>
        }
      />

      <div className="grid gap-2 md:grid-cols-4">
        {(['normal', 'observation', 'elevated', 'review'] as AlertLevel[]).map((level) => {
          const meta = ALERT_META[level];
          const count = alerts.filter((alert) => alert.level === level && !alert.acknowledged).length;
          return (
            <div key={level} className="border border-line bg-surface px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  <span
                    aria-hidden
                    className="inline-block h-1.5 w-1.5"
                    style={{ background: meta.color }}
                  />
                  <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-ink">
                    {meta.label}
                  </span>
                </span>
                <span className="font-mono text-[11px] text-muted">{count}</span>
              </div>
              <p className="mt-1.5 text-[9px] leading-4 text-muted/70">{meta.description}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-3 xl:grid-cols-12">
        <div className="space-y-2 xl:col-span-4">
          <div className="border border-line bg-surface p-2.5">
            <div className="flex flex-wrap gap-1">
              {LEVEL_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setLevelFilter(filter.value)}
                  aria-pressed={levelFilter === filter.value}
                  className={cn(
                    'border px-2 py-1 font-mono text-[8px] uppercase tracking-[0.04em]',
                    levelFilter === filter.value
                      ? 'border-accent/50 bg-accent/10 text-accent'
                      : 'border-line bg-bg text-muted hover:text-ink',
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <label htmlFor="alert-astronaut" className="sr-only">
                Filter alerts by astronaut
              </label>
              <select
                id="alert-astronaut"
                value={astronautFilter}
                onChange={(event) => setAstronautFilter(event.target.value)}
                className="border border-line bg-bg px-2 py-1 font-mono text-[9px] uppercase tracking-[0.04em] text-muted focus:border-accent focus:outline-none"
              >
                <option value="all">All crew</option>
                {Object.values(ASTRONAUT_BY_ID).map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.04em] text-muted">
                <input
                  type="checkbox"
                  checked={showAcknowledged}
                  onChange={(event) => setShowAcknowledged(event.target.checked)}
                  className="h-3 w-3 accent-[#D9F26A]"
                />
                Show acknowledged
              </label>
              <span className="ml-auto font-mono text-[8px] text-muted/60">{filtered.length} shown</span>
            </div>
          </div>

          <Panel
            title="Alert queue"
            meta="Newest first"
            bodyClassName="p-0 max-h-[72vh] overflow-y-auto"
          >
            {filtered.length === 0 ? (
              <div className="p-3">
                <EmptyState
                  title="No alerts match these filters"
                  description="ORBIT has not generated a matching rule deviation in this window. Nominal monitoring continues."
                  icon={<Info size={18} />}
                />
              </div>
            ) : (
              <AlertList
                alerts={filtered}
                selectedId={selected?.id}
                onSelect={handleSelect}
                limit={60}
              />
            )}
          </Panel>
        </div>

        <div className="xl:col-span-8">
          {selected ? (
            <AlertDetail
              alert={selected}
              onAcknowledge={() => acknowledge(selected.id)}
              onAskAssistant={() => {
                selectAstronaut(selected.astronautId);
                setAssistantOpen(true);
              }}
              onSelectAstronaut={() => selectAstronaut(selected.astronautId)}
            />
          ) : (
            <Panel title="Alert detail" bodyClassName="p-6">
              <EmptyState
                title="No alert selected"
                description="The alert queue is empty or every alert has been acknowledged. Activate a scenario in the simulator to generate a deterministic health deviation."
                icon={<TriangleAlert size={20} />}
              />
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

function AlertDetail({
  alert,
  onAcknowledge,
  onAskAssistant,
  onSelectAstronaut,
}: {
  alert: HealthAlert;
  onAcknowledge: () => void;
  onAskAssistant: () => void;
  onSelectAstronaut: () => void;
}) {
  const meta = ALERT_META[alert.level];
  const profile = ASTRONAUT_BY_ID[alert.astronautId];

  return (
    <article className="panel">
      <header className="border-b border-line p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={meta.tone}>{meta.label}</Badge>
              <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-muted">
                {alert.source.replace(/_/g, ' ')}
              </span>
              <span className="font-mono text-[9px] text-muted">{formatMET(alert.createdAtMinute)}</span>
            </div>
            <h2 className="mt-2 font-display text-lg leading-6 text-ink">{alert.title}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[9px] uppercase tracking-[0.05em] text-muted">
              <button type="button" onClick={onSelectAstronaut} className="hover:text-accent">
                {profile?.name ?? alert.astronautId}
              </button>
              <span>·</span>
              <span>{profile?.role}</span>
              <span>·</span>
              <span>{profile?.callSign}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Button size="sm" variant="primary" onClick={onAcknowledge} disabled={alert.acknowledged}>
              <Check size={12} /> {alert.acknowledged ? 'Acknowledged' : 'Acknowledge'}
            </Button>
            <Link to={`/astronauts/${alert.astronautId}`} className="btn btn-secondary px-2 py-1 text-[11px]">
              Health profile <ArrowUpRight size={11} />
            </Link>
          </div>
        </div>
        <p className="mt-3 max-w-3xl text-[12px] leading-6 text-muted">{alert.summary}</p>
        {alert.acknowledged && (
          <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.05em] text-ok">
            Acknowledged at {alert.acknowledgedAtMinute !== null ? formatMET(alert.acknowledgedAtMinute) : 'unknown time'} · the rule remains active in the background
          </p>
        )}
      </header>

      <div className="grid grid-cols-2 gap-px border-b border-line bg-line sm:grid-cols-4">
        <Stat label="Current" value={`${alert.currentValue}`} unit={alert.unit} />
        <Stat label="Personal baseline" value={`${alert.baselineValue}`} unit={alert.unit} />
        <Stat label="Deviation" value={`${alert.deltaPct > 0 ? '+' : ''}${alert.deltaPct.toFixed(1)}%`} unit="" />
        <Stat label="Standardised" value={alert.zScore === null ? 'n/a' : `${alert.zScore.toFixed(2)}σ`} unit="" />
      </div>

      <div className="space-y-5 p-4">
        <section aria-labelledby="alert-evidence">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h3 id="alert-evidence" className="label text-ink">
              Triggering evidence
            </h3>
            <span className="font-mono text-[9px] text-muted">
              window {formatMET(alert.windowStartMinute)} → {formatMET(alert.windowEndMinute)}
            </span>
          </div>
          <div className="overflow-x-auto border border-line">
            <table className="w-full min-w-[440px] border-collapse text-left">
              <caption className="sr-only">Observations that triggered this alert</caption>
              <thead>
                <tr className="border-b border-line bg-surface2/50">
                  <th scope="col" className="label px-3 py-2 font-normal">Observation</th>
                  <th scope="col" className="label px-3 py-2 text-right font-normal">Value</th>
                  <th scope="col" className="label px-3 py-2 text-right font-normal">Baseline</th>
                  <th scope="col" className="label px-3 py-2 text-right font-normal">Δ</th>
                </tr>
              </thead>
              <tbody>
                {alert.evidence.map((evidence, index) => (
                  <tr key={`${evidence.missionMinute}-${index}`} className="border-b border-line/60 last:border-0">
                    <td className="px-3 py-2 font-mono text-[10px] text-muted">{evidence.label}</td>
                    <td className="px-3 py-2 text-right font-mono text-[10px] text-ink">
                      {evidence.value} {evidence.unit}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-[10px] text-muted">
                      {evidence.baseline} {evidence.unit}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-[10px] text-caution">
                      {evidence.baseline === 0
                        ? 'n/a'
                        : `${(((evidence.value - evidence.baseline) / evidence.baseline) * 100).toFixed(1)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h3 className="label mb-2 text-ink">Rule and context</h3>
          <p className="border-l-2 border-line pl-3 text-[11px] leading-5 text-muted">
            {alert.ruleLabel}. {alert.context.baselineMethod === 'configured_reference'
              ? 'This is an environmental reference check, not a personal-baseline rule.'
              : `Baseline method: ${alert.context.baselineMethod}; ${alert.context.sampleCount} samples in the reference window.`}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="chip">activity · {alert.context.activity}</span>
            <span className="chip">zone · {alert.context.location}</span>
            <span className="chip">comms · {alert.context.comms}</span>
            {alert.context.scenarioId && <span className="chip">scenario · {alert.context.scenarioId}</span>}
            <span className="chip">rule · {alert.ruleId}</span>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          <section>
            <h3 className="label mb-2 text-ink">Possible contributing factors</h3>
            <ul className="space-y-1.5">
              {alert.contributingFactors.map((factor) => (
                <li key={factor} className="flex gap-2 text-[11px] leading-5 text-muted">
                  <span aria-hidden className="mt-2 h-1 w-1 shrink-0 bg-muted" />
                  {factor}
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h3 className="label mb-2 text-ink">Data limitations</h3>
            <ul className="space-y-1.5">
              {alert.limitations.map((limitation) => (
                <li key={limitation} className="flex gap-2 text-[11px] leading-5 text-muted">
                  <span aria-hidden className="mt-2 h-1 w-1 shrink-0 bg-caution" />
                  {limitation}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="border border-line bg-bg p-3">
          <h3 className="label mb-2 text-ink">Recommended assessment workflow</h3>
          <ol className="space-y-2">
            {alert.recommendedWorkflow.map((step, index) => (
              <li key={step} className="flex gap-2.5 text-[11px] leading-5 text-muted">
                <span className="font-mono text-[9px] text-accent">{String(index + 1).padStart(2, '0')}</span>
                {step}
              </li>
            ))}
          </ol>
          <p className="mt-2 text-[9px] leading-4 text-muted/60">
            These steps are assessment prompts and operational options, not medical treatment
            instructions.
          </p>
        </section>

        <div className="flex flex-wrap gap-2">
          <Link to="/assessments" className="btn btn-secondary">
            <ClipboardList size={13} /> Start structured assessment
          </Link>
          <Link to="/simulation" className="btn btn-secondary">
            Open decision support
          </Link>
          <Button variant="ghost" onClick={onAskAssistant}>
            <Sparkles size={13} /> Explain with ORBIT MED
          </Button>
        </div>

        <p className="border-t border-line pt-3 text-[10px] leading-5 text-muted/70">
          This alert is a prototype classification, not a clinical risk category. It is generated
          locally from synthetic telemetry by a deterministic rule. It does not diagnose a medical
          condition, and it must not be used for real clinical decisions.
        </p>
      </div>
    </article>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="bg-surface p-3">
      <div className="label mb-1.5">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className="font-mono text-lg text-ink numeric">{value}</span>
        {unit && <span className="font-mono text-[8px] uppercase text-muted">{unit}</span>}
      </div>
    </div>
  );
}
