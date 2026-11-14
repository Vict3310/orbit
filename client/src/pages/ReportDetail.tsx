import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { ASTRONAUT_BY_ID } from '../data/astronauts';
import { useOrbitStore } from '../store/orbitStore';
import { formatMET, missionDate } from '../lib/format';
import { ALERT_META } from '../lib/severity';
import { OrbitMark } from '../components/brand/OrbitMark';
import { Badge, Button, EmptyState, Panel } from '../components/ui';
import { MetricDelta } from '../components/telemetry/MetricDelta';
import { SleepBarChart, TrendChart } from '../components/charts/TrendChart';
import { CrewAvatar } from '../components/astronauts/CrewAvatar';

export default function ReportDetail() {
  const { reportId } = useParams<{ reportId: string }>();
  const reports = useOrbitStore((s) => s.reports);
  const observations = useOrbitStore((s) => s.observations);
  const report = reports.find((item) => item.id === reportId);
  const profile = report ? ASTRONAUT_BY_ID[report.astronautId] : null;

  const reportObs = useMemo(() => {
    if (!report) return [];
    return observations
      .filter(
        (observation) =>
          observation.astronautId === report.astronautId &&
          observation.missionMinute >= report.periodStartMinute &&
          observation.missionMinute <= report.periodEndMinute,
      )
      .sort((a, b) => a.missionMinute - b.missionMinute);
  }, [observations, report]);

  const hrData = reportObs.map((observation) => ({
    minute: observation.missionMinute,
    restingHeartRate: Number(observation.restingHeartRate.toFixed(1)),
    heartRate: Number(observation.heartRate.toFixed(1)),
  }));

  const sleepData = useMemo(() => {
    const byDay = new Map<number, { minute: number; label: string; sleepHours: number }>();
    for (const observation of reportObs) {
      if (((observation.missionMinute % 1440) + 1440) % 1440 !== 360) continue;
      const day = Math.floor(observation.missionMinute / 1440) + 1;
      byDay.set(day, {
        minute: observation.missionMinute,
        label: `D${day}`,
        sleepHours: observation.sleepHours,
      });
    }
    return [...byDay.values()].sort((a, b) => a.minute - b.minute);
  }, [reportObs]);

  if (!report) {
    return (
      <div className="space-y-4">
        <Link to="/reports" className="btn btn-secondary">
          <ArrowLeft size={13} /> All reports
        </Link>
        <Panel bodyClassName="p-6">
          <EmptyState
            title="Report not found"
            description="This report is not stored in the current browser workspace. Generate a new report from the reports page."
          />
        </Panel>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-2">
        <Link to="/reports" className="btn btn-secondary">
          <ArrowLeft size={13} /> All reports
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="muted">LOCAL SNAPSHOT</Badge>
          <Button variant="primary" onClick={() => window.print()}>
            <Printer size={13} /> Print / save PDF
          </Button>
        </div>
      </div>

      <article className="panel">
        <header className="border-b border-line p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <OrbitMark size={40} />
              <div>
                <div className="font-display text-[18px] font-semibold tracking-[0.14em] text-ink">
                  ORBIT
                </div>
                <div className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted">
                  Mission health report
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-critical">
                Educational prototype · simulated data
              </div>
              <div className="mt-1 font-mono text-[9px] text-muted">
                Generated {new Date(report.generatedAtIso).toLocaleString()}
              </div>
              <div className="font-mono text-[9px] text-muted">
                Report ID {report.id}
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-line pt-4">
            <div>
              <h1 className="font-display text-2xl leading-8 text-ink">{report.title}</h1>
              <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.06em] text-muted">
                {profile?.name} · {profile?.role} · {profile?.callSign}
              </div>
              <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.06em] text-muted/70">
                {report.missionName} · {report.missionId}
              </div>
            </div>
            {profile && <CrewAvatar profile={profile} size={56} />}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
            <ReportMeta label="Reporting period" value={`${formatMET(report.periodStartMinute)} → ${formatMET(report.periodEndMinute)}`} />
            <ReportMeta label="Mission dates" value={`${missionDate(report.periodStartMinute)} → ${missionDate(report.periodEndMinute)}`} />
            <ReportMeta label="Observations" value={`${report.stats.observations}`} />
            <ReportMeta label="Alerts" value={`${report.stats.alertCount}`} />
          </div>
        </header>

        <section className="border-b border-line p-5" aria-labelledby="report-summary">
          <SectionHeading index="01" title="Summary" id="report-summary" />
          <div className="mt-3 space-y-2">
            {report.summary.map((paragraph) => (
              <p key={paragraph} className="max-w-4xl text-[12px] leading-6 text-muted">
                {paragraph}
              </p>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-3 lg:grid-cols-6">
            <MetricCell label="Mean RHR" value={`${report.stats.meanRestingHeartRate}`} unit="bpm" />
            <MetricCell label="Mean sleep" value={report.stats.meanSleepHours.toFixed(1)} unit="h/24h" />
            <MetricCell label="Mean fatigue" value={`${report.stats.meanFatigue}`} unit="/100" />
            <MetricCell
              label="Median RT"
              value={report.stats.medianReactionTime === null ? '—' : `${report.stats.medianReactionTime}`}
              unit="ms"
            />
            <MetricCell label="Dose delta" value={report.stats.doseDelta.toFixed(2)} unit="mSv" />
            <MetricCell label="Alerts" value={`${report.stats.alertCount}`} unit="" />
          </div>
        </section>

        <section className="border-b border-line p-5" aria-labelledby="report-baseline">
          <SectionHeading index="02" title="Baseline comparison" id="report-baseline" />
          <div className="mt-3 overflow-x-auto border border-line">
            <table className="w-full min-w-[560px] border-collapse text-left">
              <caption className="sr-only">Observed mean values compared with the personal baseline</caption>
              <thead>
                <tr className="border-b border-line bg-surface2/50">
                  <th scope="col" className="label px-3 py-2 font-normal">Indicator</th>
                  <th scope="col" className="label px-3 py-2 text-right font-normal">Baseline</th>
                  <th scope="col" className="label px-3 py-2 text-right font-normal">Observed mean</th>
                  <th scope="col" className="label px-3 py-2 text-right font-normal">Δ</th>
                </tr>
              </thead>
              <tbody>
                {report.baselineRows.map((row) => (
                  <tr key={row.label} className="border-b border-line/60 last:border-0">
                    <th scope="row" className="px-3 py-2 text-left text-[11px] font-normal text-ink">
                      {row.label} <span className="font-mono text-[8px] text-muted">({row.unit})</span>
                    </th>
                    <td className="px-3 py-2 text-right font-mono text-[10px] text-muted">{row.baseline}</td>
                    <td className="px-3 py-2 text-right font-mono text-[10px] text-ink">{row.observed}</td>
                    <td className="px-3 py-2 text-right">
                      <MetricDelta pct={row.deltaPct} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[9px] leading-4 text-muted/60">
            Baseline comparisons use the simulated personal baseline at generation time. They are not
            clinical reference ranges.
          </p>
        </section>

        {(hrData.length > 1 || sleepData.length > 0) && (
          <section className="border-b border-line p-5" aria-labelledby="report-charts">
            <SectionHeading index="03" title="Health trends" id="report-charts" />
            <div className="mt-3 grid gap-5 lg:grid-cols-2">
              {hrData.length > 1 && (
                <div>
                  <h3 className="label mb-2 text-ink">Heart rate</h3>
                  <TrendChart
                    data={hrData}
                    series={[
                      { key: 'restingHeartRate', label: 'Resting HR', color: '#D9F26A', unit: 'bpm' },
                      { key: 'heartRate', label: 'Heart rate', color: '#94A5B5', unit: 'bpm', dashed: true },
                    ]}
                    markers={report.alerts.slice(-4).map((alert) => ({
                      minute: alert.createdAtMinute,
                      label: alert.level,
                      tone: alert.level === 'review' ? 'critical' : 'caution',
                    }))}
                    baseline={
                      report.baselineRows.find((row) => row.label.includes('Resting heart rate'))?.baseline
                    }
                    ariaLabel="Heart-rate trend for the report period"
                    height={200}
                  />
                </div>
              )}
              {sleepData.length > 0 && (
                <div>
                  <h3 className="label mb-2 text-ink">Sleep duration</h3>
                  <SleepBarChart
                    data={sleepData}
                    baseline={report.baselineRows.find((row) => row.label.includes('Sleep duration'))?.baseline ?? 8}
                    ariaLabel="Sleep-duration trend for the report period"
                    height={200}
                  />
                </div>
              )}
            </div>
            <p className="mt-2 text-[9px] leading-4 text-muted/60">
              Charts render from locally retained observations that fall inside the reporting period;
              the report summary remains valid if older points have been pruned.
            </p>
          </section>
        )}

        <section className="border-b border-line p-5" aria-labelledby="report-alerts">
          <SectionHeading index="04" title="Detected anomalies" id="report-alerts" />
          {report.alerts.length === 0 ? (
            <p className="mt-3 text-[11px] text-muted">No rule-based alerts were generated in this period.</p>
          ) : (
            <div className="mt-3 overflow-x-auto border border-line">
              <table className="w-full min-w-[560px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-line bg-surface2/50">
                    <th scope="col" className="label px-3 py-2 font-normal">Time</th>
                    <th scope="col" className="label px-3 py-2 font-normal">Alert</th>
                    <th scope="col" className="label px-3 py-2 font-normal">Level</th>
                    <th scope="col" className="label px-3 py-2 text-right font-normal">Acknowledged</th>
                  </tr>
                </thead>
                <tbody>
                  {report.alerts.map((alert) => (
                    <tr key={alert.id} className="border-b border-line/60 last:border-0">
                      <td className="px-3 py-2 font-mono text-[10px] text-muted">{formatMET(alert.createdAtMinute)}</td>
                      <td className="px-3 py-2 text-[11px] text-ink">{alert.title}</td>
                      <td className="px-3 py-2">
                        <Badge tone={ALERT_META[alert.level].tone}>{ALERT_META[alert.level].label}</Badge>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[9px] text-muted">
                        {alert.acknowledged ? 'yes' : 'no'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="grid gap-0 border-b border-line lg:grid-cols-2">
          <section className="border-b border-line p-5 lg:border-b-0 lg:border-r" aria-labelledby="report-assessments">
            <SectionHeading index="05" title="Assessments & cognitive checks" id="report-assessments" />
            {report.assessments.length === 0 && report.cognitiveTests.length === 0 ? (
              <p className="mt-3 text-[11px] text-muted">No structured assessments were recorded.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {report.assessments.map((assessment) => (
                  <div key={assessment.id} className="flex items-start justify-between gap-3 border-b border-line/60 py-2 last:border-0">
                    <div>
                      <div className="font-mono text-[9px] text-muted">{formatMET(assessment.missionMinute)} · self-report</div>
                      <div className="mt-0.5 text-[10px] text-muted">
                        Fatigue {assessment.fatigue} · stress {assessment.stress}
                        {assessment.note ? ` · ${assessment.note}` : ''}
                      </div>
                    </div>
                    <Badge tone="muted">ORBIT-SR1</Badge>
                  </div>
                ))}
                {report.cognitiveTests.map((test) => (
                  <div key={test.id} className="flex items-start justify-between gap-3 border-b border-line/60 py-2 last:border-0">
                    <div>
                      <div className="font-mono text-[9px] text-muted">{formatMET(test.missionMinute)} · reaction check</div>
                      <div className="mt-0.5 text-[10px] text-muted">
                        Median {test.medianMs} ms · {test.changePct > 0 ? '+' : ''}
                        {test.changePct.toFixed(1)}% vs baseline
                      </div>
                    </div>
                    <Badge tone="muted">BROWSER</Badge>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="p-5" aria-labelledby="report-events">
            <SectionHeading index="06" title="Environmental & mission events" id="report-events" />
            {report.events.length === 0 ? (
              <p className="mt-3 text-[11px] text-muted">No crew-linked mission events in this period.</p>
            ) : (
              <ol className="mt-3 space-y-2.5">
                {report.events.map((event) => (
                  <li key={`${event.minute}-${event.title}`} className="flex gap-2 border-b border-line/60 pb-2 last:border-0">
                    <span
                      aria-hidden
                      className={`mt-1.5 h-1.5 w-1.5 shrink-0 ${
                        event.severity === 'critical'
                          ? 'bg-critical'
                          : event.severity === 'caution'
                            ? 'bg-caution'
                            : 'bg-muted'
                      }`}
                    />
                    <div>
                      <div className="font-mono text-[9px] text-muted">{formatMET(event.minute)}</div>
                      <div className="text-[10px] leading-4 text-muted">{event.title}</div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <section className="border-b border-line p-5" aria-labelledby="report-decisions">
          <SectionHeading index="07" title="Operational decisions" id="report-decisions" />
          {report.decisions.length === 0 ? (
            <p className="mt-3 text-[11px] text-muted">No operational decisions were recorded in this period.</p>
          ) : (
            <div className="mt-3 overflow-x-auto border border-line">
              <table className="w-full min-w-[600px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-line bg-surface2/50">
                    <th scope="col" className="label px-3 py-2 font-normal">Time</th>
                    <th scope="col" className="label px-3 py-2 font-normal">Decision</th>
                    <th scope="col" className="label px-3 py-2 text-right font-normal">Projected fatigue</th>
                    <th scope="col" className="label px-3 py-2 text-right font-normal">As planned</th>
                  </tr>
                </thead>
                <tbody>
                  {report.decisions.map((decision) => (
                    <tr key={decision.id} className="border-b border-line/60 last:border-0">
                      <td className="px-3 py-2 font-mono text-[10px] text-muted">{formatMET(decision.missionMinute)}</td>
                      <td className="px-3 py-2 text-[11px] text-ink">{decision.label}</td>
                      <td className="px-3 py-2 text-right font-mono text-[10px] text-ink">
                        {decision.projected.fatigue}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[10px] text-muted">
                        {decision.alternative.fatigue}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-2 text-[9px] leading-4 text-muted/60">
            Projections are deterministic model illustrations produced at decision time, not forecasts
            of a real physiological outcome.
          </p>
        </section>

        <section className="border-b border-line p-5" aria-labelledby="report-followups">
          <SectionHeading index="08" title="Follow-up items" id="report-followups" />
          <ol className="mt-3 space-y-2">
            {report.followUps.map((item, index) => (
              <li key={item} className="flex gap-2.5 text-[11px] leading-5 text-muted">
                <span className="font-mono text-[9px] text-accent">{String(index + 1).padStart(2, '0')}</span>
                {item}
              </li>
            ))}
          </ol>
        </section>

        <div className="grid gap-0 border-b border-line lg:grid-cols-2">
          <section className="border-b border-line p-5 lg:border-b-0 lg:border-r" aria-labelledby="report-provenance">
            <SectionHeading index="09" title="Data provenance" id="report-provenance" />
            <ul className="mt-3 space-y-2">
              {report.provenance.map((item) => (
                <li key={item} className="flex gap-2 text-[10px] leading-5 text-muted">
                  <span aria-hidden className="mt-2 h-1 w-1 shrink-0 bg-muted" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
          <section className="p-5" aria-labelledby="report-limitations">
            <SectionHeading index="10" title="Limitations" id="report-limitations" />
            <ul className="mt-3 space-y-2">
              {report.limitations.map((item) => (
                <li key={item} className="flex gap-2 text-[10px] leading-5 text-muted">
                  <span aria-hidden className="mt-2 h-1 w-1 shrink-0 bg-caution" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <footer className="p-5">
          <div className="border border-critical/30 bg-critical/5 px-4 py-3">
            <p className="font-mono text-[9px] uppercase tracking-[0.08em] text-critical">
              Educational prototype — contains simulated data and is not intended for clinical
              decision-making.
            </p>
            <p className="mt-1 text-[10px] leading-4 text-muted">
              ORBIT is not a certified medical device. It does not diagnose, treat, or predict medical
              conditions. All thresholds are configurable demonstration assumptions, and all
              physiological values are generated by an educational model.
            </p>
          </div>
          <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.05em] text-muted/50">
            ORBIT · Beyond monitoring. Toward mission resilience. · Generated locally · Not synced to Earth
          </p>
        </footer>
      </article>
    </div>
  );
}

function SectionHeading({ index, title, id }: { index: string; title: string; id: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="font-mono text-[9px] text-accent">{index}</span>
      <h2 id={id} className="label text-ink">
        {title}
      </h2>
      <span aria-hidden className="h-px flex-1 bg-line" />
    </div>
  );
}

function ReportMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface px-3 py-2">
      <div className="label mb-1 text-[8px]">{label}</div>
      <div className="font-mono text-[10px] text-ink">{value}</div>
    </div>
  );
}

function MetricCell({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="bg-surface px-3 py-2.5">
      <div className="label mb-1 text-[8px]">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className="font-mono text-[14px] text-ink numeric">{value}</span>
        <span className="font-mono text-[8px] uppercase text-muted">{unit}</span>
      </div>
    </div>
  );
}
