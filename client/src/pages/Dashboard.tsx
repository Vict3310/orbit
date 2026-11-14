import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowUpRight,
  ClipboardList,
  HeartPulse,
  Play,
  Pause,
  Radio,
  Sparkles,
  Stethoscope,
  Waves,
} from 'lucide-react';
import type { HealthObservation, DetectionMetric } from '../types/domain';
import { ASTRONAUTS, ASTRONAUT_BY_ID } from '../data/astronauts';
import { useOrbitStore } from '../store/orbitStore';
import { computeBaseline } from '../engines/health/baseline';
import { METRIC_BY_KEY } from '../engines/health/metrics';
import { formatMET, missionDate, missionDay } from '../lib/format';
import { ALERT_META, worstLevel } from '../lib/severity';
import {
  Badge,
  Button,
  cn,
  EmptyState,
  InlineNote,
  PageHeader,
  Panel,
  Segmented,
  StatTile,
  StatusDot,
} from '../components/ui';
import { CrewCard } from '../components/astronauts/CrewCard';
import { CrewAvatar } from '../components/astronauts/CrewAvatar';
import { BaselineTable } from '../components/astronauts/BaselineTable';
import { VitalsGrid } from '../components/telemetry/VitalsGrid';
import { MetricDelta, deviationPct } from '../components/telemetry/MetricDelta';
import { SleepBarChart, TrendChart } from '../components/charts/TrendChart';
import { AlertList } from '../components/alerts/AlertList';
import { MissionTimeline } from '../components/mission/MissionTimeline';

type RangeHours = 24 | 72 | 168;

export default function Dashboard() {
  const navigate = useNavigate();
  const sim = useOrbitStore((s) => s.sim);
  const observations = useOrbitStore((s) => s.observations);
  const alerts = useOrbitStore((s) => s.alerts);
  const selectedId = useOrbitStore((s) => s.selectedAstronautId);
  const selectAstronaut = useOrbitStore((s) => s.selectAstronaut);
  const running = useOrbitStore((s) => s.running);
  const speed = useOrbitStore((s) => s.settings.speed);
  const setRunning = useOrbitStore((s) => s.setRunning);
  const setSpeed = useOrbitStore((s) => s.setSpeed);
  const advance = useOrbitStore((s) => s.advance);
  const setComms = useOrbitStore((s) => s.setComms);
  const setAssistantOpen = useOrbitStore((s) => s.setAssistantOpen);
  const [rangeHours, setRangeHours] = useState<RangeHours>(24);

  const profile = ASTRONAUT_BY_ID[selectedId];
  const activeAlerts = useMemo(() => alerts.filter((a) => !a.acknowledged), [alerts]);
  const selectedAlerts = useMemo(
    () => activeAlerts.filter((a) => a.astronautId === selectedId),
    [activeAlerts, selectedId],
  );

  const crewLatest = useMemo(() => {
    const map: Record<string, HealthObservation | null> = {};
    for (const astronaut of ASTRONAUTS) {
      const list = observations.filter((o) => o.astronautId === astronaut.id);
      map[astronaut.id] = list.length > 0 ? list[list.length - 1] : null;
    }
    return map;
  }, [observations]);

  const baselines = useMemo(() => {
    const map: Record<string, ReturnType<typeof computeBaseline>> = {};
    for (const astronaut of ASTRONAUTS) {
      map[astronaut.id] = computeBaseline(astronaut, observations, sim.clock);
    }
    return map;
  }, [observations, sim.clock]);

  const baseline = baselines[selectedId];
  const latest = crewLatest[selectedId];
  const crewObs = useMemo(
    () => observations.filter((o) => o.astronautId === selectedId),
    [observations, selectedId],
  );
  const rangeStart = sim.clock - rangeHours * 60;
  const rangeObs = useMemo(
    () => crewObs.filter((o) => o.missionMinute >= rangeStart),
    [crewObs, rangeStart],
  );

  const hrData = rangeObs.map((o) => ({
    minute: o.missionMinute,
    restingHeartRate: Number(o.restingHeartRate.toFixed(1)),
    heartRate: Number(o.heartRate.toFixed(1)),
  }));

  const markers = useMemo(
    () =>
      alerts
        .filter(
          (alert) =>
            alert.astronautId === selectedId && alert.createdAtMinute >= rangeStart && !alert.acknowledged,
        )
        .slice(-4)
        .map((alert) => ({
          minute: alert.createdAtMinute,
          label: alert.ruleId.replace(/-/g, ' '),
          tone: alert.level === 'review' ? ('critical' as const) : ('caution' as const),
        })),
    [alerts, selectedId, rangeStart],
  );

  const sleepData = useMemo(() => {
    const byDay = new Map<number, HealthObservation>();
    for (const observation of crewObs) {
      if (observation.missionMinute <= sim.clock - 7 * 1440) continue;
      if (((observation.missionMinute % 1440) + 1440) % 1440 !== 360) continue;
      const day = missionDay(observation.missionMinute);
      byDay.set(day, observation);
    }
    return [...byDay.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([day, observation]) => ({
        minute: observation.missionMinute,
        label: `D${day}`,
        sleepHours: observation.sleepHours,
      }));
  }, [crewObs, sim.clock]);

  const meanSleep = useMemo(() => {
    const values = ASTRONAUTS.map((astronaut) => crewLatest[astronaut.id]?.sleepHours).filter(
      (value): value is number => typeof value === 'number',
    );
    return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  }, [crewLatest]);

  const highestFatigue = useMemo(() => {
    const values = ASTRONAUTS.map((astronaut) => crewLatest[astronaut.id]?.fatigue).filter(
      (value): value is number => typeof value === 'number',
    );
    return values.length > 0 ? Math.max(...values) : 0;
  }, [crewLatest]);

  const reviewCount = activeAlerts.filter((a) => a.level === 'review').length;
  const selectedLevel = worstLevel(selectedAlerts.map((a) => a.level));
  const selectedMeta = ALERT_META[selectedLevel];

  const domainRows = latest
    ? [
        {
          title: 'Cardiovascular',
          meta: 'Personal baseline comparison',
          icon: HeartPulse,
          rows: [
            metricRow('Resting HR', latest.restingHeartRate, baseline, 'restingHeartRate'),
            metricRow('HRV', latest.hrv, baseline, 'hrv'),
            metricRow('Blood pressure', `${latest.systolic.toFixed(0)}/${latest.diastolic.toFixed(0)}`, baseline, 'systolic', 'mmHg'),
            metricRow('Heart rate', latest.heartRate, baseline, 'heartRate'),
          ],
        },
        {
          title: 'Respiratory & cabin',
          meta: 'Environment-aware',
          icon: Waves,
          rows: [
            metricRow('Respiratory rate', latest.respiratoryRate, baseline, 'respiratoryRate'),
            metricRow('SpO2', latest.spo2, baseline, 'spo2'),
            { label: 'Cabin CO₂', value: `${Math.round(sim.env.co2)}`, unit: 'ppm', note: `Ref ${Math.round(3947)}` },
            { label: 'Cabin O₂', value: sim.env.o2.toFixed(1), unit: '%', note: sim.env.eclssStatus.toUpperCase() },
          ],
        },
        {
          title: 'Sleep & recovery',
          meta: 'Trailing 24 hours',
          icon: Activity,
          rows: [
            metricRow('Sleep duration', latest.sleepHours, baseline, 'sleepHours'),
            metricRow('Sleep consistency', latest.sleepConsistency, baseline, 'sleepConsistency'),
            metricRow('Fatigue indicator', latest.fatigue, baseline, 'fatigue'),
            metricRow('Reaction time', latest.reactionTime, baseline, 'reactionTime'),
          ],
        },
        {
          title: 'Behavioural & exposure',
          meta: 'Contextual indicators',
          icon: Stethoscope,
          rows: [
            metricRow('Stress indicator', latest.stress, baseline, 'stress'),
            metricRow('Mood indicator', latest.mood, baseline, 'mood'),
            metricRow('Cognitive index', latest.cognitiveScore, baseline, 'cognitiveScore'),
            {
              label: 'Cumulative dose',
              value: latest.cumulativeDose.toFixed(2),
              unit: 'mSv',
              note: `${latest.radiationDoseRate.toFixed(2)} mSv/d`,
            },
          ],
        },
      ]
    : [];

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Mission overview"
        title="Astronaut health intelligence"
        description="Monitor the crew against personal baselines, explain every deviation, and connect it to mission context. All telemetry on this screen is simulated."
        actions={
          <>
            <Badge tone="accent">SIMULATED TELEMETRY</Badge>
            <Link to="/simulation" className="btn btn-secondary">
              Open simulator <ArrowUpRight size={13} />
            </Link>
          </>
        }
      />

      <div className="grid gap-3 xl:grid-cols-12">
        <Panel
          className="xl:col-span-8"
          title="Outpost status"
          meta={sim.scenario.label ?? 'Nominal operations'}
          action={<Badge tone="muted">{sim.env.comms === 'loss' ? 'LOCAL AUTONOMY' : 'EARTH LINK ACTIVE'}</Badge>}
        >
          <div className="grid gap-5 md:grid-cols-[1.1fr_2fr]">
            <div>
              <div className="label mb-1">Mission day</div>
              <div className="font-display text-[34px] leading-none tracking-[-0.03em] text-ink">
                {String(missionDay(sim.clock)).padStart(3, '0')}
              </div>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
                {missionDate(sim.clock)} · simulated
              </p>
              <div className="mt-3 flex items-center gap-2">
                <StatusDot tone={running ? 'ok' : 'muted'} pulse={running} />
                <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted">
                  {running ? `Clock advancing · ${speed} min/s` : 'Clock paused'}
                </span>
              </div>
              <div className="mt-4 border-t border-line pt-3">
                <div className="label mb-2">Care workflow</div>
                <div className="flex flex-wrap gap-x-1.5 gap-y-1 font-mono text-[8px] uppercase tracking-[0.06em] text-muted/60">
                  {['Monitor', 'Detect', 'Explain', 'Assess', 'Simulate', 'Document'].map((step, index) => (
                    <span key={step} className="flex items-center gap-1.5">
                      {index > 0 && <span aria-hidden>→</span>}
                      <span className={index < 3 ? 'text-accent' : undefined}>{step}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatTile
                label="Crew monitored"
                value={3}
                unit="/ 3"
                hint="Continuous synthetic telemetry"
              />
              <StatTile
                label="Active alerts"
                value={activeAlerts.length}
                unit=""
                tone={reviewCount > 0 ? 'critical' : activeAlerts.length > 0 ? 'caution' : 'ok'}
                hint={
                  activeAlerts.length === 0
                    ? 'No rule deviations active'
                    : `${reviewCount} requiring review`
                }
              />
              <StatTile
                label="Mean sleep / 24h"
                value={meanSleep}
                digits={1}
                unit="h"
                tone={meanSleep < 6.5 ? 'caution' : 'ink'}
                hint="Across the current crew snapshot"
              />
              <StatTile
                label="Highest fatigue"
                value={highestFatigue}
                unit="/100"
                tone={highestFatigue >= 65 ? 'caution' : 'ink'}
                hint="Modelled indicator, not a clinical score"
              />
            </div>
          </div>
        </Panel>

        <Panel className="xl:col-span-4" title="Simulation clock" meta="Deterministic · local">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="font-mono text-[26px] leading-none tracking-tight text-ink numeric">
                {formatMET(sim.clock)}
              </span>
              <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
                {sim.scenario.stage === 'decision_pending'
                  ? 'Decision awaiting review'
                  : sim.scenario.stage === 'resolved'
                    ? 'Scenario resolved'
                    : 'Mission elapsed time'}
              </p>
            </div>
            <Button
              variant={running ? 'secondary' : 'primary'}
              onClick={() => setRunning(!running)}
              aria-pressed={running}
              size="sm"
            >
              {running ? <Pause size={12} /> : <Play size={12} />}
              {running ? 'Pause' : 'Run'}
            </Button>
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <span className="label">Rate</span>
            <Segmented
              ariaLabel="Simulation speed"
              value={speed}
              onChange={setSpeed}
              options={[
                { value: 15, label: '15m/s' },
                { value: 60, label: '1h/s' },
                { value: 240, label: '4h/s' },
              ]}
            />
          </div>

          <div className="mt-3 grid grid-cols-3 gap-1.5">
            <Button size="sm" variant="secondary" onClick={() => advance(60)}>
              +1 h
            </Button>
            <Button size="sm" variant="secondary" onClick={() => advance(360)}>
              +6 h
            </Button>
            <Button size="sm" variant="secondary" onClick={() => advance(1440)}>
              +24 h
            </Button>
          </div>

          <div className="mt-4 border-t border-line pt-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="label">Earth link</span>
              <Radio size={12} className="text-muted" />
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {(['nominal', 'delay', 'loss'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setComms(status)}
                  aria-pressed={sim.env.comms === status}
                  className={cn(
                    'border px-1 py-1.5 font-mono text-[8px] uppercase tracking-[0.04em]',
                    sim.env.comms === status
                      ? status === 'loss'
                        ? 'border-critical/50 bg-critical/10 text-critical'
                        : 'border-accent/50 bg-accent/10 text-accent'
                      : 'border-line bg-bg text-muted hover:text-ink',
                  )}
                >
                  {status === 'nominal' ? 'Nominal' : status === 'delay' ? 'Delay' : 'Loss'}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[10px] leading-4 text-muted">
              {sim.env.comms === 'loss'
                ? 'Local monitoring, alerts and reports remain available. Cloud explanations are disabled.'
                : sim.env.comms === 'delay'
                  ? 'One-way light time 8 min. Local risk engines continue without waiting for Earth.'
                  : 'Earth link nominal. Cloud explanations available when configured.'}
            </p>
          </div>
        </Panel>
      </div>

      <section aria-label="Crew overview" className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {ASTRONAUTS.map((astronaut) => (
          <CrewCard
            key={astronaut.id}
            profile={astronaut}
            latest={crewLatest[astronaut.id]}
            baseline={baselines[astronaut.id]}
            alerts={activeAlerts}
            selected={astronaut.id === selectedId}
            onSelect={() => selectAstronaut(astronaut.id)}
            onOpenProfile={() => navigate(`/astronauts/${astronaut.id}`)}
          />
        ))}
      </section>

      <div className="grid gap-3 xl:grid-cols-12">
        <Panel
          className="xl:col-span-8"
          title="Crew telemetry"
          meta={`${profile.name} · ${profile.callSign}`}
          action={
            <div className="flex items-center gap-2">
              <Badge tone={selectedMeta.tone}>{selectedMeta.label}</Badge>
              <Link
                to={`/astronauts/${profile.id}`}
                className="font-mono text-[9px] uppercase tracking-[0.06em] text-muted hover:text-accent"
              >
                Full profile →
              </Link>
            </div>
          }
          bodyClassName="p-0"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
            <div className="flex items-center gap-3">
              <CrewAvatar profile={profile} size={40} />
              <div>
                <div className="font-display text-[13px] text-ink">{profile.name}</div>
                <div className="font-mono text-[9px] uppercase tracking-[0.06em] text-muted">
                  {profile.role} ·{' '}
                  {latest ? `${latest.activity} · ${latest.location}` : 'no observation'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone="muted">SYNTHETIC</Badge>
              {latest && (
                <span className="font-mono text-[9px] text-muted">
                  obs {formatMET(latest.missionMinute)}
                </span>
              )}
            </div>
          </div>

          <div className="p-4">
            {latest ? (
              <>
                <VitalsGrid observation={latest} baseline={baseline} />
                <div className="mt-4 grid gap-4 xl:grid-cols-[1.35fr_1fr]">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <h3 className="label text-ink">Cardiovascular trend</h3>
                      <Segmented
                        ariaLabel="Telemetry range"
                        value={rangeHours}
                        onChange={setRangeHours}
                        options={[
                          { value: 24, label: '24h' },
                          { value: 72, label: '72h' },
                          { value: 168, label: '7d' },
                        ]}
                      />
                    </div>
                    <TrendChart
                      data={hrData}
                      series={[
                        { key: 'restingHeartRate', label: 'Resting HR', color: '#D9F26A', unit: 'bpm' },
                        { key: 'heartRate', label: 'Heart rate', color: '#94A5B5', unit: 'bpm', dashed: true },
                      ]}
                      baseline={baseline.metrics.restingHeartRate?.value}
                      markers={markers}
                      ariaLabel={`Heart-rate trend for ${profile.name} over the selected window`}
                      unitLabel="bpm"
                      height={216}
                    />
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <h3 className="label text-ink">Sleep duration</h3>
                      <span className="font-mono text-[9px] text-muted">last 7 days</span>
                    </div>
                    <SleepBarChart
                      data={sleepData}
                      baseline={profile.baseline.sleepHours}
                      ariaLabel={`Daily sleep duration for ${profile.name}`}
                      height={216}
                    />
                  </div>
                </div>
              </>
            ) : (
              <EmptyState
                title="No observation for this crew member"
                description="Advance the simulation clock to generate the next synthetic observation."
              />
            )}
          </div>
        </Panel>

        <div className="space-y-3 xl:col-span-4">
          <Panel
            title="Personal baseline"
            meta={`${baseline.windowHours}h window · ${baseline.sampleCount} samples`}
            action={<Badge tone="muted">{baseline.metrics.restingHeartRate.method === 'rolling' ? 'ROLLING' : 'PROFILE'}</Badge>}
            bodyClassName="p-3"
          >
            {latest && <BaselineTable baseline={baseline} observation={latest} showMethod />}
            <div className="mt-3 border-t border-line pt-3">
              <InlineNote>
                Baseline = trailing 72 h mean when at least 8 observations exist; otherwise the
                synthetic profile baseline. Thresholds are prototype assumptions.
              </InlineNote>
            </div>
          </Panel>

          <Panel
            title="Active intelligence"
            meta={`${selectedAlerts.length} for ${profile.callSign}`}
            action={
              <Link to="/alerts" className="font-mono text-[9px] uppercase tracking-[0.06em] text-muted hover:text-accent">
                All alerts →
              </Link>
            }
            bodyClassName="p-0"
          >
            <AlertList
              alerts={selectedAlerts}
              limit={4}
              showAstronaut={false}
              onSelect={(alert) => navigate(`/alerts?focus=${encodeURIComponent(alert.id)}`)}
              emptyLabel="No active rule deviations for this crew member. Keep monitoring."
            />
            <div className="flex flex-wrap gap-1.5 border-t border-line p-3">
              <Link to="/assessments" className="btn btn-secondary px-2 py-1 text-[10px]">
                <ClipboardList size={11} /> Assessment
              </Link>
              <Link to="/simulation" className="btn btn-secondary px-2 py-1 text-[10px]">
                <Activity size={11} /> Simulate
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAssistantOpen(true)}
                className="px-2 py-1 text-[10px]"
              >
                <Sparkles size={11} /> Ask ORBIT MED
              </Button>
            </div>
          </Panel>
        </div>
      </div>

      <section aria-label="Clinical domain panels" className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {domainRows.map((domain) => {
          const Icon = domain.icon;
          return (
            <Panel
              key={domain.title}
              title={domain.title}
              meta={domain.meta}
              action={<Icon size={13} className="text-muted" />}
              bodyClassName="p-0"
            >
              <dl>
                {domain.rows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-2 border-b border-line/60 px-4 py-2.5 last:border-0"
                  >
                    <dt className="min-w-0">
                      <span className="block text-[11px] text-muted">{row.label}</span>
                      {'note' in row && row.note && (
                        <span className="block font-mono text-[8px] uppercase tracking-[0.04em] text-muted/60">
                          {row.note}
                        </span>
                      )}
                    </dt>
                    <dd className="flex shrink-0 items-baseline gap-1.5">
                      <span className="font-mono text-[13px] text-ink numeric">{row.value}</span>
                      <span className="font-mono text-[8px] uppercase text-muted">{row.unit}</span>
                      {'pct' in row && typeof row.pct === 'number' && (
                        <MetricDelta
                          pct={row.pct}
                          worseWhen={'worseWhen' in row ? row.worseWhen : 'either'}
                        />
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </Panel>
          );
        })}
      </section>

      <div className="grid gap-3 xl:grid-cols-12">
        <Panel
          className="xl:col-span-7"
          title="Mission event log"
          meta="Scenario, environment and crew events"
          action={
            <Link to="/simulation" className="font-mono text-[9px] uppercase tracking-[0.06em] text-muted hover:text-accent">
              Simulation →
            </Link>
          }
        >
          <MissionTimeline events={sim.events} limit={6} />
        </Panel>
        <Panel
          className="xl:col-span-5"
          title="Mission-wide alerts"
          meta={`${activeAlerts.length} active`}
          action={<Badge tone={reviewCount > 0 ? 'critical' : 'muted'}>{reviewCount} review</Badge>}
          bodyClassName="p-0"
        >
          <AlertList
            alerts={activeAlerts}
            limit={5}
            onSelect={(alert) => navigate(`/alerts?focus=${encodeURIComponent(alert.id)}`)}
            emptyLabel="No active alerts across the crew. The monitoring engines are still running."
          />
        </Panel>
      </div>

      <p className="pb-2 text-[10px] leading-4 text-muted/60">
        ORBIT is an educational prototype. All physiological values are synthetic and all thresholds
        are demonstration assumptions. Nothing on this screen is a diagnosis or medical advice.
      </p>
    </div>
  );
}

type DomainRow =
  | {
      label: string;
      value: string;
      unit: string;
      pct: number;
      worseWhen: 'up' | 'down' | 'either';
      note?: string;
    }
  | { label: string; value: string; unit: string; note: string };

function metricRow(
  label: string,
  value: number | string,
  baseline: ReturnType<typeof computeBaseline>,
  key: DetectionMetric,
  unitOverride?: string,
): DomainRow {
  const def = METRIC_BY_KEY[key];
  const metric = baseline.metrics[key];
  const numeric = typeof value === 'number' ? value : Number.parseFloat(value);
  return {
    label,
    value: typeof value === 'number' ? value.toFixed(def.digits) : value,
    unit: unitOverride ?? def.unit,
    pct: metric ? deviationPct(numeric, metric.value) : 0,
    worseWhen: def.direction === 'either' ? 'either' : def.direction,
  };
}
