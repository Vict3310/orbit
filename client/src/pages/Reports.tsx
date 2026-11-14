import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpRight, FileText, Printer, ShieldCheck } from 'lucide-react';
import { ASTRONAUTS } from '../data/astronauts';
import { useOrbitStore } from '../store/orbitStore';
import { formatMET } from '../lib/format';
import { Badge, Button, EmptyState, PageHeader, Panel, StatTile } from '../components/ui';

export default function Reports() {
  const navigate = useNavigate();
  const reports = useOrbitStore((s) => s.reports);
  const observations = useOrbitStore((s) => s.observations);
  const alerts = useOrbitStore((s) => s.alerts);
  const assessments = useOrbitStore((s) => s.assessments);
  const decisions = useOrbitStore((s) => s.decisions);
  const selectedId = useOrbitStore((s) => s.selectedAstronautId);
  const generateReport = useOrbitStore((s) => s.generateReport);
  const [astronautId, setAstronautId] = useState(selectedId);
  const [periodDays, setPeriodDays] = useState(7);

  const sorted = useMemo(
    () => [...reports].sort((a, b) => b.periodEndMinute - a.periodEndMinute),
    [reports],
  );

  const handleGenerate = () => {
    const report = generateReport(astronautId, periodDays);
    navigate(`/reports/${report.id}`);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Mission documentation"
        title="Health reports"
        description="Generate a locally stored report snapshot of telemetry, baseline comparisons, alerts, assessments, events and operational decisions. Print or save to PDF from the browser."
        actions={<Badge tone="muted">LOCAL ONLY · SIMULATED DATA</Badge>}
      />

      <div className="grid gap-3 xl:grid-cols-12">
        <Panel className="xl:col-span-5" title="Generate a report" meta="Period snapshot">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="report-astronaut" className="label mb-1.5 block">
                Astronaut
              </label>
              <select
                id="report-astronaut"
                value={astronautId}
                onChange={(event) => setAstronautId(event.target.value)}
                className="input text-[12px]"
              >
                {ASTRONAUTS.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name} — {profile.role}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="report-period" className="label mb-1.5 block">
                Reporting period
              </label>
              <select
                id="report-period"
                value={periodDays}
                onChange={(event) => setPeriodDays(Number(event.target.value))}
                className="input text-[12px]"
              >
                <option value={1}>Last 24 hours</option>
                <option value={3}>Last 3 days</option>
                <option value={7}>Last 7 days</option>
                <option value={14}>Last 14 days</option>
              </select>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="primary" onClick={handleGenerate}>
              <FileText size={13} /> Generate report
            </Button>
            <Link to="/research#limitations" className="btn btn-secondary">
              Read limitations
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-3 sm:grid-cols-4">
            <StatTile label="Observations" value={observations.length} hint="Retained locally" />
            <StatTile label="Alerts" value={alerts.length} hint="All levels" />
            <StatTile label="Assessments" value={assessments.length} hint="Self-report" />
            <StatTile label="Decisions" value={decisions.length} hint="Scenario responses" />
          </div>
          <p className="mt-3 flex items-start gap-2 border-t border-line pt-3 text-[10px] leading-4 text-muted">
            <ShieldCheck size={13} className="mt-0.5 shrink-0 text-ok" />
            Reports are produced entirely in the browser from local IndexedDB state. No data is sent
            to Earth or to any external service.
          </p>
        </Panel>

        <Panel className="xl:col-span-7" title="What the report contains" meta="Mission evidence package">
          <div className="grid gap-x-5 gap-y-3 sm:grid-cols-2">
            {[
              'Mission and crew identification with synthetic provenance',
              'Reporting period and observation counts',
              'Personal baseline comparison table',
              'Heart-rate and sleep trend visualisations',
              'Detected anomalies with level and acknowledgement state',
              'Assessment and reaction-time results',
              'Operational decisions with modelled projections',
              'Environmental and scenario event markers',
              'Follow-up items derived from unresolved findings',
              'Explicit limitations and data provenance',
            ].map((item, index) => (
              <div key={item} className="flex gap-2.5">
                <span className="font-mono text-[9px] text-accent">{String(index + 1).padStart(2, '0')}</span>
                <span className="text-[11px] leading-5 text-muted">{item}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 border-t border-line pt-3 text-[10px] leading-4 text-muted/70">
            Every report states: “Educational prototype — contains simulated data and is not intended
            for clinical decision-making.” Browser print can export a PDF without a PDF library.
          </p>
        </Panel>
      </div>

      <Panel title="Saved reports" meta={`${sorted.length} local reports`} bodyClassName="p-0">
        {sorted.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title="No reports generated yet"
              description="Choose a crew member and period above. The report will be stored in this browser and can be printed at any time."
              icon={<Printer size={20} />}
            />
          </div>
        ) : (
          <div className="divide-y divide-line">
            {sorted.map((report) => {
              const profile = ASTRONAUTS.find((item) => item.id === report.astronautId);
              return (
                <Link
                  key={report.id}
                  to={`/reports/${report.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-surface2"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-[12px] text-ink">{report.title}</span>
                      <Badge tone="muted">{report.stats.observations} OBS</Badge>
                      {report.stats.alertCount > 0 && (
                        <Badge tone="caution">{report.stats.alertCount} ALERTS</Badge>
                      )}
                    </div>
                    <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.05em] text-muted">
                      {profile?.callSign} · {formatMET(report.periodStartMinute)} →{' '}
                      {formatMET(report.periodEndMinute)} · generated{' '}
                      {new Date(report.generatedAtIso).toLocaleDateString()}
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.05em] text-muted">
                    Open report <ArrowUpRight size={12} />
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </Panel>

      <p className="text-[10px] leading-4 text-muted/60">
        Report content reflects the local state at generation time. If older observations have been
        pruned from local storage, the report explicitly notes the available observation count.
      </p>
    </div>
  );
}
