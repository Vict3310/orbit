import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ClipboardList, Info } from 'lucide-react';
import type { Assessment } from '../types/domain';
import { ASTRONAUTS } from '../data/astronauts';
import { ASSESSMENT_ITEMS, DIMENSION_LABELS, scoreAssessment } from '../data/assessmentItems';
import { useOrbitStore, profileFor } from '../store/orbitStore';
import { Badge, Button, PageHeader, Panel, cn } from '../components/ui';
import { ReactionTest } from '../components/assessments/ReactionTest';
import { TrendChart } from '../components/charts/TrendChart';
import { CrewAvatar } from '../components/astronauts/CrewAvatar';
import { formatMET } from '../lib/format';

export default function Assessments() {
  const profile = useOrbitStore((s) => profileFor(s));
  const clock = useOrbitStore((s) => s.sim.clock);
  const assessments = useOrbitStore((s) => s.assessments);
  const cognitiveTests = useOrbitStore((s) => s.cognitiveTests);
  const submitAssessment = useOrbitStore((s) => s.submitAssessment);
  const selectAstronaut = useOrbitStore((s) => s.selectAstronaut);
  const [responses, setResponses] = useState<Record<string, number>>(() =>
    Object.fromEntries(ASSESSMENT_ITEMS.map((item) => [item.id, 5])),
  );
  const [note, setNote] = useState('');
  const [result, setResult] = useState<Assessment | null>(null);

  const crewAssessments = useMemo(
    () => assessments.filter((assessment) => assessment.astronautId === profile.id),
    [assessments, profile.id],
  );
  const crewTests = useMemo(
    () => cognitiveTests.filter((test) => test.astronautId === profile.id),
    [cognitiveTests, profile.id],
  );

  const previewScores = scoreAssessment(
    Object.entries(responses).map(([itemId, value]) => ({ itemId, value })),
  );

  const assessmentTrend = useMemo(
    () =>
      [...crewAssessments]
        .sort((a, b) => a.missionMinute - b.missionMinute)
        .map((assessment) => ({
          minute: assessment.missionMinute,
          fatigue: assessment.scores.fatigue,
          stress: assessment.scores.stress,
          sleepQuality: 100 - assessment.scores.sleepQuality,
        })),
    [crewAssessments],
  );

  const handleSubmit = () => {
    const payload = ASSESSMENT_ITEMS.map((item) => ({
      itemId: item.id,
      value: responses[item.id] ?? 5,
    }));
    const saved = submitAssessment(payload, note.trim());
    setResult(saved);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Structured health assessments"
        title="Self-report and cognitive checks"
        description="Add subjective context and a short reaction-time measurement to the synthetic telemetry. Results are stored locally and become part of the monitored history."
        actions={<Badge tone="accent">ORBIT SELF-REPORT V1</Badge>}
      />

      <div className="flex flex-wrap items-center gap-3 border border-line bg-surface px-3 py-2.5">
        <CrewAvatar profile={profile} size={30} />
        <div>
          <div className="font-display text-[12px] text-ink">{profile.name}</div>
          <div className="font-mono text-[8px] uppercase tracking-[0.06em] text-muted">
            {profile.role} · assessment target
          </div>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <label htmlFor="assessment-crew" className="sr-only">
            Assessment target
          </label>
          <select
            id="assessment-crew"
            value={profile.id}
            onChange={(event) => selectAstronaut(event.target.value)}
            className="border border-line bg-bg px-2 py-1 font-mono text-[9px] uppercase tracking-[0.04em] text-ink focus:border-accent focus:outline-none"
          >
            {ASTRONAUTS.map((crew) => (
              <option key={crew.id} value={crew.id}>
                {crew.name}
              </option>
            ))}
          </select>
          <Link to={`/astronauts/${profile.id}`} className="chip hover:text-ink">
            Open profile →
          </Link>
          <span className="chip">MET {formatMET(clock)}</span>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-12">
        <Panel
          className="xl:col-span-7"
          title="ORBIT Self-Report v1"
          meta="Seven dimensions · 0–10 scales"
          action={<Badge tone="muted">NOT CLINICALLY VALIDATED</Badge>}
        >
          <p className="text-[11px] leading-5 text-muted">
            Answer for the current moment. The result updates the subjective context used by the
            model and is recorded as a local assessment. It does not overwrite the deterministic
            cardiovascular or environmental rules.
          </p>
          <div className="mt-3 divide-y divide-line/60 border-y border-line/60">
            {ASSESSMENT_ITEMS.map((item) => {
              const value = responses[item.id] ?? 5;
              const worse = item.direction === 'higher_worse';
              return (
                <div key={item.id} className="py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <label htmlFor={`item-${item.id}`} className="max-w-xl text-[11px] leading-5 text-ink">
                      {item.prompt}
                    </label>
                    <span className="font-mono text-[11px] text-accent">{value}</span>
                  </div>
                  <input
                    id={`item-${item.id}`}
                    type="range"
                    min={0}
                    max={10}
                    step={1}
                    value={value}
                    onChange={(event) =>
                      setResponses((prev) => ({ ...prev, [item.id]: Number(event.target.value) }))
                    }
                    className="mt-2 w-full"
                    aria-valuetext={`${value} of 10`}
                  />
                  <div className="mt-1 flex justify-between font-mono text-[8px] uppercase tracking-[0.05em] text-muted/70">
                    <span>{item.lowLabel}</span>
                    <span>{item.highLabel}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3">
            <label htmlFor="assessment-note" className="label mb-1.5 block">
              Context note (optional)
            </label>
            <textarea
              id="assessment-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={300}
              rows={2}
              placeholder="For example: poor sleep due to cabin noise; high workload before the EVA."
              className="input resize-none text-[12px]"
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button variant="primary" onClick={handleSubmit}>
              <ClipboardList size={13} /> Submit self-assessment
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setResponses(Object.fromEntries(ASSESSMENT_ITEMS.map((item) => [item.id, 5])))}
            >
              Reset to midpoint
            </Button>
            <span className="font-mono text-[8px] uppercase tracking-[0.05em] text-muted">
              Preview: fatigue {previewScores.fatigue} · stress {previewScores.stress}
            </span>
          </div>

          {result && (
            <div role="status" className="mt-3 border border-ok/30 bg-ok/5 p-3">
              <div className="flex items-start gap-2">
                <CheckCircle2 size={16} className="mt-0.5 text-ok" />
                <div>
                  <p className="text-[11px] text-ink">Assessment saved to local history.</p>
                  <p className="mt-1 text-[10px] leading-4 text-muted">
                    Fatigue {result.scores.fatigue}/100 · stress {result.scores.stress}/100 · recovery{' '}
                    {result.scores.sleepQuality}/100. The next alert evaluation will include this
                    context.
                  </p>
                  <div className="mt-1.5 flex gap-3">
                    <Link to="/alerts" className="font-mono text-[9px] uppercase tracking-[0.05em] text-accent">
                      Review alerts →
                    </Link>
                    <Link
                      to={`/astronauts/${profile.id}`}
                      className="font-mono text-[9px] uppercase tracking-[0.05em] text-muted hover:text-accent"
                    >
                      Profile history →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          <p className="mt-3 border-t border-line pt-3 text-[9px] leading-4 text-muted/70">
            This instrument is an educational check-in created for ORBIT. It is not a validated
            clinical questionnaire, and its scores must not be used to diagnose or treat anyone.
          </p>
        </Panel>

        <div className="space-y-3 xl:col-span-5" id="reaction">
          <Panel title="Cognitive performance" meta="Simple visual reaction time">
            <ReactionTest />
          </Panel>

          <Panel title="Saved dimensions" meta="Latest self-report preview" bodyClassName="p-0">
            <dl>
              {Object.entries(previewScores).map(([dimension, score]) => (
                <div
                  key={dimension}
                  className="flex items-center justify-between border-b border-line/60 px-3 py-2 last:border-0"
                >
                  <dt className="text-[10px] text-muted">
                    {DIMENSION_LABELS[dimension as keyof typeof DIMENSION_LABELS]}
                  </dt>
                  <dd className="flex items-center gap-2">
                    <span className="h-1 w-16 bg-surface2">
                      <span
                        className={cn(
                          'block h-full',
                          score >= 70 ? 'bg-critical' : score >= 50 ? 'bg-caution' : 'bg-ok',
                        )}
                        style={{ width: `${score}%` }}
                      />
                    </span>
                    <span className="w-7 text-right font-mono text-[10px] text-ink">{score}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </Panel>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-12">
        <Panel className="xl:col-span-7" title="Self-report trend" meta={`${crewAssessments.length} records`}>
          {assessmentTrend.length >= 2 ? (
            <TrendChart
              data={assessmentTrend}
              series={[
                { key: 'fatigue', label: 'Fatigue', color: '#F2BA68', unit: '/100' },
                { key: 'stress', label: 'Stress', color: '#F27676', unit: '/100' },
                { key: 'sleepQuality', label: 'Sleep burden', color: '#94A5B5', unit: '/100' },
              ]}
              ariaLabel={`Self-report trend for ${profile.name}`}
              height={220}
              yDomain={[0, 100]}
            />
          ) : (
            <div className="flex min-h-[180px] flex-col items-center justify-center border border-dashed border-line text-center">
              <Info size={16} className="mb-2 text-muted" />
              <p className="text-[11px] text-muted">
                Submit at least two assessments to see a trend.
              </p>
            </div>
          )}
        </Panel>

        <Panel className="xl:col-span-5" title="Assessment history" meta="Local records" bodyClassName="p-0">
          {crewAssessments.length === 0 && crewTests.length === 0 ? (
            <p className="p-4 text-[11px] text-muted">
              No assessment records for this crew member yet.
            </p>
          ) : (
            <div className="max-h-[280px] overflow-y-auto">
              {crewAssessments.slice(0, 5).map((assessment) => (
                <div key={assessment.id} className="border-b border-line/60 px-3 py-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] text-muted">{formatMET(assessment.missionMinute)}</span>
                    <Badge tone={assessment.scores.fatigue >= 65 ? 'caution' : 'muted'}>SELF-REPORT</Badge>
                  </div>
                  <p className="mt-1 text-[10px] text-ink">
                    Fatigue {assessment.scores.fatigue} · stress {assessment.scores.stress} · workload{' '}
                    {assessment.scores.workload}
                  </p>
                  {assessment.note && <p className="mt-0.5 text-[9px] text-muted">{assessment.note}</p>}
                </div>
              ))}
              {crewTests.slice(0, 4).map((test) => (
                <div key={test.id} className="border-b border-line/60 px-3 py-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] text-muted">{formatMET(test.missionMinute)}</span>
                    <Badge tone={test.changePct > 15 ? 'caution' : 'muted'}>REACTION</Badge>
                  </div>
                  <p className="mt-1 text-[10px] text-ink">
                    Median {test.medianMs} ms · {test.changePct > 0 ? '+' : ''}
                    {test.changePct.toFixed(1)}% vs baseline
                  </p>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between border-t border-line px-3 py-2">
            <span className="font-mono text-[8px] uppercase tracking-[0.05em] text-muted">
              {crewAssessments.length} self-report · {crewTests.length} reaction
            </span>
            <Link to={`/astronauts/${profile.id}`} className="font-mono text-[8px] uppercase text-muted hover:text-accent">
              Full history →
            </Link>
          </div>
        </Panel>
      </div>
    </div>
  );
}
