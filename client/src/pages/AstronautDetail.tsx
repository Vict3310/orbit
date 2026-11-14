import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowUpRight, FileText, FlaskConical, Orbit } from 'lucide-react';
import type { DetectionMetric } from '../types/domain';
import { ASTRONAUT_BY_ID, ASTRONAUTS } from '../data/astronauts';
import { useOrbitStore } from '../store/orbitStore';
import { useCrewBaseline, useCrewObservations, useLatestObservation } from '../hooks/useMissionData';
import { METRIC_BY_KEY } from '../engines/health/metrics';
import { formatMET, missionDay } from '../lib/format';
import { ALERT_META, worstLevel } from '../lib/severity';
import { Badge, Button, EmptyState, PageHeader, Panel, Segmented, cn } from '../components/ui';
import { CrewAvatar } from '../components/astronauts/CrewAvatar';
import { BaselineTable } from '../components/astronauts/BaselineTable';
import { VitalsGrid } from '../components/telemetry/VitalsGrid';
import { SleepBarChart, TrendChart } from '../components/charts/TrendChart';
import { AlertList } from '../components/alerts/AlertList';
import { MissionTimeline } from '../components/mission/MissionTimeline';

type Tab = 'telemetry' | 'baseline' | 'assessments' | 'log';
type RangeHours = 24 | 72 | 168;

const TABS: { id: Tab; label: string }[] = [
  { id: 'telemetry', label: 'Telemetry' },
  { id: 'baseline', label: 'Baseline' },
  { id: 'assessments', label: 'Assessments' },
  { id: 'log', label: 'Mission log' },
];

const FULL_BASELINE_KEYS: DetectionMetric[] = [
  'restingHeartRate',
  'hrv',
  'respiratoryRate',
  'spo2',
  'sleepHours',
  'sleepConsistency',
  'fatigue',
  'stress',
  'mood',
  'reactionTime',
  'cognitiveScore',
];

export default function AstronautDetail() {
  const { astronautId } = useParams<{ astronautId: string }>();
  const navigate = useNavigate();
  const profile = (astronautId && ASTRONAUT_BY_ID[astronautId]) || ASTRONAUTS[0];
  const [tab, setTab] = useState<Tab>('telemetry');
  const [rangeHours, setRangeHours] = useState<RangeHours>(72);

  const clock = useOrbitStore((s) => s.sim.clock);
  const alerts = useOrbitStore((s) => s.alerts);
  const assessments = useOrbitStore((s) => s.assessments);
  const cognitiveTests = useOrbitStore((s) => s.cognitiveTests);
  const decisions = useOrbitStore((s) => s.decisions);
  const events = useOrbitStore((s) => s.sim.events);
  const reports = useOrbitStore((s) => s.reports);
  const selectedId = useOrbitStore((s) => s.selectedAstronautId);
  const selectAstronaut = useOrbitStore((s) => s.selectAstronaut);
  const generateReport = useOrbitStore((s) => s.generateReport);

  const baseline = useCrewBaseline(profile.id);
  const observations = useCrewObservations(profile.id);
  const latest = useLatestObservation(profile.id);
  const crewAlerts = useMemo(
    () => alerts.filter((alert) => alert.astronautId === profile.id),
    [alerts, profile.id],
  );
  const active = useMemo(
    () => crewAlerts.filter((alert) => !alert.acknowledged),
    [crewAlerts],
  );
  const level = worstLevel(active.map((alert) => alert.level));
  const meta = ALERT_META[level];

  const crewAssessments = useMemo(
    () => assessments.filter((assessment) => assessment.astronautId === profile.id),
    [assessments, profile.id],
  );
  const crewTests = useMemo(
    () => cognitiveTests.filter((test) => test.astronautId === profile.id),
    [cognitiveTests, profile.id],
  );
  const crewDecisions = useMemo(
    () => decisions.filter((decision) => decision.astronautId === profile.id),
    [decisions, profile.id],
  );
  const crewReports = useMemo(
    () => reports.filter((report) => report.astronautId === profile.id),
    [reports, profile.id],
  );
  const crewEvents = useMemo(
    () => events.filter((event) => event.astronautIds.includes(profile.id)),
    [events, profile.id],
  );

  useEffect(() => {
    if (astronautId && ASTRONAUT_BY_ID[astronautId]) selectAstronaut(astronautId);
  }, [astronautId, selectAstronaut]);

  const rangeStart = clock - rangeHours * 60;
  const rangeObs = useMemo(
    () => observations.filter((o) => o.missionMinute >= rangeStart),
    [observations, rangeStart],
  );

  const hrData = rangeObs.map((o) => ({
    minute: o.missionMinute,
    restingHeartRate: Number(o.restingHeartRate.toFixed(1)),
    heartRate: Number(o.heartRate.toFixed(1)),
  }));
  const fatigueData = rangeObs.map((o) => ({
    minute: o.missionMinute,
    fatigue: Number(o.fatigue.toFixed(1)),
  }));
  const reactionData = rangeObs.map((o) => ({
    minute: o.missionMinute,
    reactionTime: Number(o.reactionTime.toFixed(0)),
  }));

  const sleepData = useMemo(() => {
    const byDay = new Map<number, { minute: number; label: string; sleepHours: number }>();
    for (const observation of observations) {
      if (observation.missionMinute <= clock - 7 * 1440) continue;
      if (((observation.missionMinute % 1440) + 1440) % 1440 !== 360) continue;
      byDay.set(missionDay(observation.missionMinute), {
        minute: observation.missionMinute,
        label: `D${missionDay(observation.missionMinute)}`,
        sleepHours: observation.sleepHours,
      });
    }
    return [...byDay.values()].sort((a, b) => a.minute - b.minute);
  }, [observations, clock]);

  const alertsInRange = alerts
    .filter(
      (alert) =>
        alert.astronautId === profile.id && alert.createdAtMinute >= rangeStart,
    )
    .slice(-4)
    .map((alert) => ({
      minute: alert.createdAtMinute,
      label: alert.ruleId.replace(/-/g, ' '),
      tone: alert.level === 'review' ? ('critical' as const) : ('caution' as const),
    }));

  const assessmentData = useMemo(
    () =>
      [...crewAssessments]
        .sort((a, b) => a.missionMinute - b.missionMinute)
        .map((assessment) => ({
          minute: assessment.missionMinute,
          fatigue: assessment.scores.fatigue,
          stress: assessment.scores.stress,
          mood: assessment.scores.mood,
        })),
    [crewAssessments],
  );

  const cognitiveData = useMemo(
    () =>
      [...crewTests]
        .sort((a, b) => a.missionMinute - b.missionMinute)
        .map((test) => ({ minute: test.missionMinute, medianMs: test.medianMs })),
    [crewTests],
  );

  const handleReport = () => {
    const report = generateReport(profile.id, 7);
    navigate(`/reports/${report.id}`);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow={`Crew profile · ${profile.callSign}`}
        title={profile.name}
        description={profile.role}
        actions={
          <>
            {selectedId === profile.id ? (
              <Badge tone="accent">ACTIVE MONITORING TARGET</Badge>
            ) : (
              <Button size="sm" onClick={() => selectAstronaut(profile.id)}>
                Set active
              </Button>
            )}
            <Link to="/simulation" className="btn btn-secondary">
              <Orbit size={13} /> Simulator
            </Link>
            <Button variant="primary" size="sm" onClick={handleReport}>
              <FileText size={13} /> Generate report
            </Button>
          </>
        }
      />

      <Panel bodyClassName="p-0">
        <div className="grid gap-0 lg:grid-cols-[1.5fr_1fr]">
          <div className="border-b border-line p-4 lg:border-b-0 lg:border-r">
            <div className="flex flex-col gap-4 sm:flex-row">
              <CrewAvatar profile={profile} size={86} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-xl text-ink">{profile.name}</h2>
                  <Badge tone="muted">FICTIONAL</Badge>
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                </div>
                <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
                  {profile.callSign} · {profile.role} · {profile.age} years
                </p>
                <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.05em] text-muted/70">
                  {profile.origin}
                </p>
                <p className="mt-3 max-w-2xl text-[12px] leading-6 text-muted">{profile.bio}</p>
                <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.06em] text-muted/70">
                  Specialty: {profile.specialty}
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4 lg:grid-cols-2">
            <div className="bg-surface p-4">
              <div className="label mb-2">Active alerts</div>
              <div className="font-mono text-2xl text-ink numeric">{active.length}</div>
              <div className="mt-1 text-[10px] text-muted">
                {active.filter((a) => a.level === 'review').length} review-level
              </div>
            </div>
            <div className="bg-surface p-4">
              <div className="label mb-2">Last observation</div>
              <div className="font-mono text-lg text-ink">
                {latest ? formatMET(latest.missionMinute) : '—'}
              </div>
              <div className="mt-1 text-[10px] text-muted">
                {latest ? `${latest.activity} · ${latest.location}` : 'Awaiting telemetry'}
              </div>
            </div>
            <div className="bg-surface p-4">
              <div className="label mb-2">Baseline window</div>
              <div className="font-mono text-lg text-ink">{baseline.windowHours} h</div>
              <div className="mt-1 text-[10px] text-muted">{baseline.sampleCount} synthetic samples</div>
            </div>
            <div className="bg-surface p-4">
              <div className="label mb-2">Assessments</div>
              <div className="font-mono text-lg text-ink">{crewAssessments.length + crewTests.length}</div>
              <div className="mt-1 text-[10px] text-muted">
                {crewAssessments.length} self-report · {crewTests.length} reaction
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-line px-4 py-2.5">
          <span className="label">Assignments</span>
          {profile.assignments.map((assignment) => (
            <span key={assignment} className="chip">
              {assignment}
            </span>
          ))}
        </div>
      </Panel>

      <div role="tablist" aria-label="Astronaut profile sections" className="flex flex-wrap gap-0 border-b border-line">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            aria-controls={`panel-${item.id}`}
            id={`tab-${item.id}`}
            onClick={() => setTab(item.id)}
            className={cn(
              'relative px-4 py-2.5 font-display text-[11px] transition-colors',
              tab === item.id ? 'text-ink' : 'text-muted hover:text-ink',
            )}
          >
            {item.label}
            {tab === item.id && <span aria-hidden className="absolute inset-x-0 bottom-[-1px] h-[2px] bg-accent" />}
          </button>
        ))}
      </div>

      {tab === 'telemetry' && (
        <div
          role="tabpanel"
          id="panel-telemetry"
          aria-labelledby="tab-telemetry"
          className="space-y-3"
        >
          {latest ? (
            <>
              <Panel
                title="Current vitals"
                meta="Simulated measurement snapshot"
                action={
                  <div className="flex items-center gap-2">
                    <Badge tone="muted">SYNTHETIC</Badge>
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
                }
              >
                <VitalsGrid observation={latest} baseline={baseline} />
                <div className="mt-4 grid gap-5 xl:grid-cols-2">
                  <div>
                    <h3 className="label mb-2 text-ink">Heart rate and resting heart rate</h3>
                    <TrendChart
                      data={hrData}
                      series={[
                        { key: 'restingHeartRate', label: 'Resting HR', color: '#D9F26A', unit: 'bpm' },
                        { key: 'heartRate', label: 'Heart rate', color: '#94A5B5', unit: 'bpm', dashed: true },
                      ]}
                      baseline={baseline.metrics.restingHeartRate?.value}
                      markers={alertsInRange}
                      ariaLabel={`Heart-rate history for ${profile.name}`}
                      height={210}
                    />
                  </div>
                  <div>
                    <h3 className="label mb-2 text-ink">Sleep duration history</h3>
                    <SleepBarChart
                      data={sleepData}
                      baseline={profile.baseline.sleepHours}
                      ariaLabel={`Sleep history for ${profile.name}`}
                      height={210}
                    />
                  </div>
                  <div>
                    <h3 className="label mb-2 text-ink">Fatigue indicator</h3>
                    <TrendChart
                      data={fatigueData}
                      series={[{ key: 'fatigue', label: 'Fatigue', color: '#F2BA68', unit: '/100' }]}
                      baseline={baseline.metrics.fatigue?.value}
                      ariaLabel={`Fatigue indicator history for ${profile.name}`}
                      height={190}
                      yDomain={[0, 100]}
                    />
                  </div>
                  <div>
                    <h3 className="label mb-2 text-ink">Reaction time</h3>
                    <TrendChart
                      data={reactionData}
                      series={[{ key: 'reactionTime', label: 'Reaction time', color: '#65D6A5', unit: 'ms' }]}
                      baseline={baseline.metrics.reactionTime?.value}
                      ariaLabel={`Reaction-time history for ${profile.name}`}
                      height={190}
                    />
                  </div>
                </div>
              </Panel>

              <Panel
                title="Recent observations"
                meta={`latest ${Math.min(observations.length, 14)} hourly records`}
                bodyClassName="p-0"
              >
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[820px] border-collapse text-left">
                    <caption className="sr-only">Recent synthetic observations for {profile.name}</caption>
                    <thead>
                      <tr className="border-b border-line bg-surface2/40">
                        {['MET', 'Activity', 'Zone', 'HR', 'RHR', 'HRV', 'SpO2', 'Sleep', 'Fatigue', 'RT', 'Quality'].map(
                          (heading) => (
                            <th key={heading} scope="col" className="label px-3 py-2 font-normal">
                              {heading}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {observations
                        .slice(-14)
                        .reverse()
                        .map((observation) => (
                          <tr key={observation.id} className="border-b border-line/60 last:border-0">
                            <td className="px-3 py-2 font-mono text-[10px] text-muted">
                              {formatMET(observation.missionMinute)}
                            </td>
                            <td className="px-3 py-2 text-[10px] capitalize text-muted">{observation.activity}</td>
                            <td className="px-3 py-2 text-[10px] text-muted">{observation.location}</td>
                            <td className="px-3 py-2 font-mono text-[10px] text-ink">{observation.heartRate.toFixed(0)}</td>
                            <td className="px-3 py-2 font-mono text-[10px] text-ink">{observation.restingHeartRate.toFixed(0)}</td>
                            <td className="px-3 py-2 font-mono text-[10px] text-ink">{observation.hrv.toFixed(0)}</td>
                            <td className="px-3 py-2 font-mono text-[10px] text-ink">{observation.spo2.toFixed(1)}</td>
                            <td className="px-3 py-2 font-mono text-[10px] text-ink">{observation.sleepHours.toFixed(1)}</td>
                            <td className="px-3 py-2 font-mono text-[10px] text-ink">{observation.fatigue.toFixed(0)}</td>
                            <td className="px-3 py-2 font-mono text-[10px] text-ink">{observation.reactionTime.toFixed(0)}</td>
                            <td className="px-3 py-2">
                              <span
                                className={cn(
                                  'font-mono text-[9px] uppercase',
                                  observation.dataQuality === 'degraded' ? 'text-caution' : 'text-ok',
                                )}
                              >
                                {observation.dataQuality}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            </>
          ) : (
            <EmptyState
              title="No telemetry yet"
              description="Advance the simulated clock to create the next observation."
            />
          )}
        </div>
      )}

      {tab === 'baseline' && (
        <div role="tabpanel" id="panel-baseline" aria-labelledby="tab-baseline" className="grid gap-3 xl:grid-cols-12">
          <Panel
            className="xl:col-span-7"
            title="Personal baseline comparison"
            meta={`${baseline.windowHours} h window · computed ${formatMET(baseline.computedAtMinute)}`}
            bodyClassName="p-3"
          >
            {latest ? (
              <BaselineTable baseline={baseline} observation={latest} keys={FULL_BASELINE_KEYS} showMethod />
            ) : (
              <EmptyState title="No current observation" description="Advance the clock to compare against a current value." />
            )}
          </Panel>
          <div className="space-y-3 xl:col-span-5">
            <Panel title="Method" meta="Deterministic and inspectable">
              <p className="text-[11px] leading-5 text-muted">{baseline.note}</p>
              <div className="mt-3 space-y-2">
                {(['restingHeartRate', 'sleepHours', 'reactionTime'] as DetectionMetric[]).map((key) => {
                  const metric = baseline.metrics[key];
                  const def = METRIC_BY_KEY[key];
                  return (
                    <div key={key} className="flex items-center justify-between border-b border-line/60 py-1.5">
                      <span className="text-[11px] text-muted">{def.label}</span>
                      <span className="font-mono text-[10px] text-ink">
                        {metric?.value.toFixed(def.digits)} {def.unit} ·{' '}
                        <span className="text-muted">
                          {metric?.method === 'rolling' ? `72h n=${metric.n}` : 'profile'}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </Panel>
            <Panel title="Demonstration limits" meta="Read before interpreting">
              <ul className="space-y-2 text-[11px] leading-5 text-muted">
                <li>· Baselines describe the synthetic model, not a real person.</li>
                <li>· A deviation is not a diagnosis or a validated clinical finding.</li>
                <li>· With only seven simulated days, a rolling mean can lag real changes.</li>
                <li>· Standardised deviations are shown only when a standard deviation exists.</li>
                <li>· Activity and environment are evaluated separately from the numeric rule.</li>
              </ul>
            </Panel>
            <Panel title="Data provenance" meta="Synthetic">
              <p className="text-[11px] leading-5 text-muted">
                {observations.length} hourly observations retained for this crew member. Each record
                is generated by the deterministic model and tagged <span className="font-mono text-ink">source: SYNTHETIC</span>.
                No NASA astronaut medical records were used.
              </p>
            </Panel>
          </div>
        </div>
      )}

      {tab === 'assessments' && (
        <div role="tabpanel" id="panel-assessments" aria-labelledby="tab-assessments" className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Link to="/assessments" className="btn btn-secondary">
              Run a new structured assessment
            </Link>
            <Link to="/assessments#reaction" className="btn btn-secondary">
              Run reaction-time check
            </Link>
          </div>
          <div className="grid gap-3 xl:grid-cols-2">
            <Panel title="Self-report history" meta={`${crewAssessments.length} records`} bodyClassName="p-0">
              {crewAssessments.length === 0 ? (
                <div className="p-4">
                  <EmptyState
                    title="No self-assessments yet"
                    description="Complete ORBIT Self-Report v1 to add subjective context to the telemetry."
                  />
                </div>
              ) : (
                <>
                  <div className="p-4">
                    <TrendChart
                      data={assessmentData}
                      series={[
                        { key: 'fatigue', label: 'Fatigue', color: '#F2BA68', unit: '/100' },
                        { key: 'stress', label: 'Stress', color: '#F27676', unit: '/100' },
                        { key: 'mood', label: 'Mood burden', color: '#94A5B5', unit: '/100' },
                      ]}
                      ariaLabel={`Self-assessment history for ${profile.name}`}
                      height={180}
                      yDomain={[0, 100]}
                    />
                  </div>
                  <div className="overflow-x-auto border-t border-line">
                    <table className="w-full min-w-[420px] border-collapse text-left">
                      <thead>
                        <tr className="border-b border-line">
                          {['MET', 'Fatigue', 'Stress', 'Workload', 'Note'].map((heading) => (
                            <th key={heading} scope="col" className="label px-3 py-2 font-normal">
                              {heading}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {crewAssessments.slice(0, 8).map((assessment) => (
                          <tr key={assessment.id} className="border-b border-line/60 last:border-0">
                            <td className="px-3 py-2 font-mono text-[10px] text-muted">
                              {formatMET(assessment.missionMinute)}
                            </td>
                            <td className="px-3 py-2 font-mono text-[10px] text-ink">{assessment.scores.fatigue}</td>
                            <td className="px-3 py-2 font-mono text-[10px] text-ink">{assessment.scores.stress}</td>
                            <td className="px-3 py-2 font-mono text-[10px] text-ink">{assessment.scores.workload}</td>
                            <td className="max-w-[180px] truncate px-3 py-2 text-[10px] text-muted">
                              {assessment.note || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </Panel>

            <Panel title="Reaction-time checks" meta={`${crewTests.length} records`} bodyClassName="p-0">
              {crewTests.length === 0 ? (
                <div className="p-4">
                  <EmptyState
                    title="No reaction-time checks yet"
                    description="The browser check measures simple visual response latency. It is educational, not diagnostic."
                  />
                </div>
              ) : (
                <>
                  {cognitiveData.length >= 2 && (
                    <div className="p-4">
                      <TrendChart
                        data={cognitiveData}
                        series={[{ key: 'medianMs', label: 'Median RT', color: '#65D6A5', unit: 'ms' }]}
                        baseline={baseline.metrics.reactionTime?.value}
                        ariaLabel={`Reaction-time check history for ${profile.name}`}
                        height={180}
                      />
                    </div>
                  )}
                  <div className="border-t border-line">
                    {crewTests.slice(0, 6).map((test) => (
                      <div
                        key={test.id}
                        className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 px-3 py-2.5 last:border-0"
                      >
                        <div>
                          <div className="font-mono text-[10px] text-muted">{formatMET(test.missionMinute)}</div>
                          <div className="mt-0.5 font-mono text-[9px] text-muted/70">
                            {test.trials.length} trials · {test.missed} missed · {test.falseStarts} false starts
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-[13px] text-ink">{test.medianMs} ms</div>
                          <div
                            className={cn(
                              'font-mono text-[9px]',
                              test.changePct > 10 ? 'text-caution' : 'text-muted',
                            )}
                          >
                            {test.changePct > 0 ? '+' : ''}
                            {test.changePct.toFixed(1)}% vs baseline
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Panel>
          </div>
        </div>
      )}

      {tab === 'log' && (
        <div role="tabpanel" id="panel-log" aria-labelledby="tab-log" className="space-y-3">
          <div className="grid gap-3 xl:grid-cols-12">
            <Panel
              className="xl:col-span-7"
              title="Alert history"
              meta={`${crewAlerts.length} records`}
              action={<Link to="/alerts" className="font-mono text-[9px] text-muted hover:text-accent">Open alerts →</Link>}
              bodyClassName="p-0"
            >
              <AlertList
                alerts={crewAlerts}
                showAstronaut={false}
                emptyLabel="No alerts have been generated for this crew member."
                onSelect={(alert) => navigate(`/alerts?focus=${encodeURIComponent(alert.id)}`)}
              />
            </Panel>
            <Panel className="xl:col-span-5" title="Assessment records" meta="Local only" bodyClassName="p-0">
              {crewAssessments.length + crewTests.length === 0 ? (
                <p className="p-4 text-[11px] text-muted">
                  No assessments recorded for this crew member yet.
                </p>
              ) : (
                <div>
                  {crewAssessments.slice(0, 4).map((assessment) => (
                    <div key={assessment.id} className="border-b border-line/60 px-4 py-2.5 last:border-0">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[9px] text-muted">{formatMET(assessment.missionMinute)}</span>
                        <Badge tone="muted">SELF-REPORT</Badge>
                      </div>
                      <p className="mt-1 text-[10px] text-muted">
                        Fatigue {assessment.scores.fatigue} · stress {assessment.scores.stress} ·{' '}
                        {assessment.note || 'no note'}
                      </p>
                    </div>
                  ))}
                  {crewTests.slice(0, 3).map((test) => (
                    <div key={test.id} className="border-b border-line/60 px-4 py-2.5 last:border-0">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[9px] text-muted">{formatMET(test.missionMinute)}</span>
                        <Badge tone="muted">REACTION</Badge>
                      </div>
                      <p className="mt-1 text-[10px] text-muted">
                        Median {test.medianMs} ms · {test.changePct > 0 ? '+' : ''}
                        {test.changePct.toFixed(1)}% vs baseline
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          <div className="grid gap-3 xl:grid-cols-12">
            <Panel className="xl:col-span-7" title="Operational decisions" meta={`${crewDecisions.length} records`} bodyClassName="p-0">
              {crewDecisions.length === 0 ? (
                <p className="p-4 text-[11px] text-muted">
                  No operational decisions recorded for this crew member. Activate a scenario in the
                  simulator to explore decision support.
                </p>
              ) : (
                <div>
                  {crewDecisions.slice(0, 5).map((decision) => (
                    <div key={decision.id} className="border-b border-line/60 px-4 py-3 last:border-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-display text-[11px] text-ink">{decision.label}</span>
                        <span className="font-mono text-[9px] text-muted">{formatMET(decision.missionMinute)}</span>
                      </div>
                      <p className="mt-1 text-[10px] leading-4 text-muted">{decision.rationale}</p>
                      <p className="mt-1.5 font-mono text-[9px] text-muted/70">
                        Projected fatigue {decision.projected.fatigue} vs as-planned {decision.alternative.fatigue}{' '}
                        after {Math.round(decision.horizonMinutes / 60)} h
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
            <Panel className="xl:col-span-5" title="Mission events" meta="Crew-linked">
              <MissionTimeline events={crewEvents} limit={6} />
            </Panel>
          </div>

          <Panel title="Reports for this crew member" meta={`${crewReports.length} saved`} bodyClassName="p-0">
            {crewReports.length === 0 ? (
              <p className="p-4 text-[11px] text-muted">
                No reports yet. Generate a report from the header to snapshot this period.
              </p>
            ) : (
              <div>
                {crewReports.map((report) => (
                  <Link
                    key={report.id}
                    to={`/reports/${report.id}`}
                    className="flex items-center justify-between gap-3 border-b border-line/60 px-4 py-3 last:border-0 hover:bg-surface2"
                  >
                    <div>
                      <div className="text-[11px] text-ink">{report.title}</div>
                      <div className="mt-0.5 font-mono text-[9px] text-muted">
                        {formatMET(report.periodStartMinute)} → {formatMET(report.periodEndMinute)}
                      </div>
                    </div>
                    <ArrowUpRight size={13} className="text-muted" />
                  </Link>
                ))}
              </div>
            )}
          </Panel>

          <div className="flex items-center gap-2 border border-line bg-surface px-4 py-3">
            <FlaskConical size={14} className="text-muted" />
            <p className="text-[10px] leading-4 text-muted">
              Every entry in this log is synthetic. The alert engine is deterministic; assessment and
              decision records are stored locally in IndexedDB.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
