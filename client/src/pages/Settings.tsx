import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Database,
  Download,
  Gauge,
  Play,
  RefreshCcw,
  Server,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useOrbitStore } from '../store/orbitStore';
import { clearWorkspace, downloadJson } from '../services/persistence';
import { formatMET, formatNumber } from '../lib/format';
import { ALERT_META } from '../lib/severity';
import {
  Badge,
  Button,
  PageHeader,
  Panel,
  Segmented,
  StatusDot,
  cn,
} from '../components/ui';

type AiState = 'checking' | 'configured' | 'local';

export default function Settings() {
  const navigate = useNavigate();
  const mission = useOrbitStore((s) => s.mission);
  const sim = useOrbitStore((s) => s.sim);
  const settings = useOrbitStore((s) => s.settings);
  const observations = useOrbitStore((s) => s.observations);
  const alerts = useOrbitStore((s) => s.alerts);
  const assessments = useOrbitStore((s) => s.assessments);
  const cognitiveTests = useOrbitStore((s) => s.cognitiveTests);
  const decisions = useOrbitStore((s) => s.decisions);
  const reports = useOrbitStore((s) => s.reports);
  const updateSettings = useOrbitStore((s) => s.updateSettings);
  const resetRules = useOrbitStore((s) => s.resetRules);
  const startNewMission = useOrbitStore((s) => s.startNewMission);
  const startDemo = useOrbitStore((s) => s.startDemo);
  const setComms = useOrbitStore((s) => s.setComms);
  const setSpeed = useOrbitStore((s) => s.setSpeed);
  const [seed, setSeed] = useState(String(mission.seed));
  const [aiState, setAiState] = useState<AiState>('checking');
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    setSeed(String(mission.seed));
  }, [mission.seed]);

  useEffect(() => {
    let alive = true;
    fetch('/api/health')
      .then(async (response) => {
        const data = (await response.json().catch(() => null)) as
          | { aiConfigured?: boolean }
          | null;
        if (!alive) return;
        setAiState(response.ok && data?.aiConfigured ? 'configured' : 'local');
      })
      .catch(() => {
        if (alive) setAiState('local');
      });
    return () => {
      alive = false;
    };
  }, []);

  const handleNewMission = () => {
    const parsed = Number(seed);
    const resolved = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : undefined;
    startNewMission(resolved);
    navigate('/dashboard');
  };

  const handleResetLocal = async () => {
    const confirmed = window.confirm(
      'Reset the local ORBIT workspace? This deletes all simulated observations, alerts, assessments, decisions and reports stored in this browser. It cannot be undone.',
    );
    if (!confirmed) return;
    setResetting(true);
    try {
      await clearWorkspace();
      startNewMission();
      navigate('/');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Application configuration"
        title="Settings"
        description="Mission seed, prototype detection rules, communication state, interface preferences and local data controls. Changes are applied to the running local model immediately."
        actions={<Badge tone="accent">LOCAL WORKSPACE</Badge>}
      />

      <div className="grid gap-3 xl:grid-cols-12">
        <div className="space-y-3 xl:col-span-7">
          <Panel title="Mission control" meta="Deterministic seed and simulation entry">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="mission-seed" className="label mb-1.5 block">
                  Mission seed
                </label>
                <input
                  id="mission-seed"
                  inputMode="numeric"
                  value={seed}
                  onChange={(event) => setSeed(event.target.value.replace(/[^0-9]/g, ''))}
                  className="input text-[12px]"
                />
                <p className="mt-1 text-[9px] leading-4 text-muted/70">
                  Same seed and actions produce the same telemetry. Current seed {mission.seed}.
                </p>
              </div>
              <div className="border border-line bg-bg p-2.5">
                <div className="label mb-1">Current mission</div>
                <div className="font-display text-[12px] leading-5 text-ink">{mission.name}</div>
                <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.05em] text-muted">
                  {formatMET(sim.clock)} · {formatNumber(sim.clock / 60, 1)} mission hours
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="primary" onClick={handleNewMission}>
                <RefreshCcw size={13} /> Start new mission
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  startDemo();
                  navigate('/simulation');
                }}
              >
                <Play size={13} /> Load judging demo
              </Button>
            </div>
            <div className="mt-4 border-t border-line pt-3">
              <div className="label mb-2">Simulated Earth link</div>
              <Segmented
                ariaLabel="Simulated communication status"
                value={sim.env.comms}
                onChange={(value) => setComms(value)}
                options={[
                  { value: 'nominal', label: 'Nominal' },
                  { value: 'delay', label: 'Delay' },
                  { value: 'loss', label: 'Loss' },
                ]}
              />
              <p className="mt-2 text-[10px] leading-4 text-muted">
                Switching to loss of signal disables cloud explanations only. Monitoring, simulation,
                alerts, assessments and reports continue locally.
              </p>
            </div>
          </Panel>

          <Panel
            title="Prototype detection rules"
            meta="Configurable demonstration assumptions"
            action={<Badge tone="caution">NOT CLINICAL THRESHOLDS</Badge>}
          >
            <p className="text-[10px] leading-4 text-muted">
              Each rule compares the trailing 72-hour personal baseline with hourly synthetic
              observations. The standardised deviation is also available when at least eight
              observations exist. Changes take effect on the next evaluation.
            </p>
            <div className="mt-3 overflow-x-auto border border-line">
              <table className="w-full min-w-[540px] border-collapse text-left">
                <caption className="sr-only">Editable prototype detection rules</caption>
                <thead>
                  <tr className="border-b border-line bg-surface2/50">
                    <th scope="col" className="label px-2.5 py-2 font-normal">Rule</th>
                    <th scope="col" className="label px-2.5 py-2 text-right font-normal">Δ %</th>
                    <th scope="col" className="label px-2.5 py-2 text-right font-normal">n</th>
                    <th scope="col" className="label px-2.5 py-2 font-normal">Level</th>
                  </tr>
                </thead>
                <tbody>
                  {settings.rules.map((rule) => (
                    <tr key={rule.id} className="border-b border-line/60 last:border-0">
                      <th scope="row" className="px-2.5 py-2 text-left">
                        <div className="text-[10px] leading-4 text-ink">{rule.label}</div>
                        <div className="font-mono text-[8px] uppercase tracking-[0.04em] text-muted/70">
                          {rule.metric} · {rule.direction} · z ≥ {rule.zThreshold}
                          {rule.absoluteBelow !== undefined ? ` · abs < ${rule.absoluteBelow}` : ''}
                        </div>
                      </th>
                      <td className="px-2.5 py-2 text-right">
                        <label className="sr-only" htmlFor={`pct-${rule.id}`}>
                          Percentage threshold for {rule.label}
                        </label>
                        <input
                          id={`pct-${rule.id}`}
                          type="number"
                          min={1}
                          max={100}
                          step={0.5}
                          value={rule.pctThreshold}
                          onChange={(event) => {
                            const value = Number(event.target.value);
                            if (!Number.isFinite(value)) return;
                            updateSettings({
                              rules: settings.rules.map((item) =>
                                item.id === rule.id
                                  ? { ...item, pctThreshold: Math.min(100, Math.max(1, value)) }
                                  : item,
                              ),
                            });
                          }}
                          className="w-16 border border-line bg-bg px-1.5 py-1 text-right font-mono text-[10px] text-ink focus:border-accent focus:outline-none"
                        />
                      </td>
                      <td className="px-2.5 py-2 text-right">
                        <label className="sr-only" htmlFor={`n-${rule.id}`}>
                          Consecutive sample count for {rule.label}
                        </label>
                        <input
                          id={`n-${rule.id}`}
                          type="number"
                          min={1}
                          max={6}
                          value={rule.consecutive}
                          onChange={(event) => {
                            const value = Number(event.target.value);
                            if (!Number.isFinite(value)) return;
                            updateSettings({
                              rules: settings.rules.map((item) =>
                                item.id === rule.id
                                  ? { ...item, consecutive: Math.min(6, Math.max(1, Math.round(value))) }
                                  : item,
                              ),
                            });
                          }}
                          className="w-12 border border-line bg-bg px-1.5 py-1 text-right font-mono text-[10px] text-ink focus:border-accent focus:outline-none"
                        />
                      </td>
                      <td className="px-2.5 py-2">
                        <Badge tone={ALERT_META[rule.level].tone}>{ALERT_META[rule.level].label}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button variant="secondary" size="sm" onClick={resetRules}>
                <RefreshCcw size={12} /> Restore demonstration defaults
              </Button>
              <span className="font-mono text-[8px] uppercase tracking-[0.04em] text-muted">
                {settings.rules.length} rules active
              </span>
            </div>
          </Panel>

          <Panel title="Simulation defaults" meta="Clock and display rate">
            <div className="flex flex-wrap items-center gap-2">
              <Gauge size={15} className="text-muted" />
              <span className="text-[11px] text-muted">Default speed</span>
              <Segmented
                ariaLabel="Default simulation speed"
                value={settings.speed}
                onChange={(value) => setSpeed(value)}
                options={[
                  { value: 15, label: '15×' },
                  { value: 60, label: '60×' },
                  { value: 120, label: '120×' },
                  { value: 240, label: '240×' },
                  { value: 480, label: '480×' },
                ]}
              />
            </div>
            <p className="mt-2 text-[10px] leading-4 text-muted">
              Speed is simulated minutes per real second. The clock advances in 15-minute simulation
              ticks, independent of render frame rate. At 60×, one real second advances one simulated
              minute.
            </p>
            <div className="mt-3 grid gap-px border border-line bg-line sm:grid-cols-3">
              <div className="bg-surface px-3 py-2">
                <div className="label mb-1">Tick</div>
                <div className="font-mono text-[12px] text-ink">15 min</div>
              </div>
              <div className="bg-surface px-3 py-2">
                <div className="label mb-1">Observation</div>
                <div className="font-mono text-[12px] text-ink">60 min</div>
              </div>
              <div className="bg-surface px-3 py-2">
                <div className="label mb-1">Detection</div>
                <div className="font-mono text-[12px] text-ink">6 h chunks</div>
              </div>
            </div>
          </Panel>
        </div>

        <div className="space-y-3 xl:col-span-5">
          <Panel title="Interface" meta="Accessibility and assistant behaviour">
            <div className="divide-y divide-line/60">
              <ToggleRow
                label="Reduce motion"
                description="Disables animated clocks, transitions and chart animation in addition to the operating-system preference."
                checked={settings.reducedMotion}
                onChange={(checked) => updateSettings({ reducedMotion: checked })}
              />
              <ToggleRow
                label="Auto-pause on review-level alert"
                description="Stops the simulation clock when a rule reaches the Requires review band so the evidence can be inspected."
                checked={settings.autoPauseOnReview}
                onChange={(checked) => updateSettings({ autoPauseOnReview: checked })}
              />
              <ToggleRow
                label="Use cloud explanations when available"
                description="ORBIT MED can request an explanation from the configured backend. The local explanation engine is always used during communication loss."
                checked={settings.useCloudAI}
                onChange={(checked) => updateSettings({ useCloudAI: checked })}
              />
            </div>
          </Panel>

          <Panel
            title="ORBIT MED service"
            meta="Optional explanation layer"
            action={
              <Badge
                tone={
                  aiState === 'configured' ? 'ok' : aiState === 'checking' ? 'muted' : 'caution'
                }
              >
                {aiState === 'configured' ? 'CLOUD READY' : aiState === 'checking' ? 'CHECKING' : 'LOCAL ONLY'}
              </Badge>
            }
          >
            <div className="flex items-start gap-2">
              <Sparkles size={15} className="mt-0.5 shrink-0 text-accent" />
              <p className="text-[10px] leading-4 text-muted">
                {aiState === 'configured'
                  ? 'The backend reports an OpenAI key. Requests send a validated, read-only state snapshot through the server. The assistant cannot modify mission state, override alerts or issue diagnoses.'
                  : 'No AI key is configured, so ORBIT MED uses the built-in local explanation engine. Every core feature — monitoring, detection, simulation, assessments and reports — works without the backend.'}
              </p>
            </div>
            <div className="mt-3 flex items-center gap-2 border-t border-line pt-3 font-mono text-[9px] uppercase tracking-[0.05em] text-muted">
              <Server size={12} />
              <span>POST /api/med/explain · rate limited · no keys in client</span>
            </div>
          </Panel>

          <Panel
            title="Local data"
            meta="IndexedDB workspace"
            action={<Database size={14} className="text-muted" />}
          >
            <div className="grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-3">
              {[
                ['Observations', observations.length],
                ['Alerts', alerts.length],
                ['Assessments', assessments.length],
                ['Reaction tests', cognitiveTests.length],
                ['Decisions', decisions.length],
                ['Reports', reports.length],
              ].map(([label, value]) => (
                <div key={String(label)} className="bg-surface px-3 py-2">
                  <div className="label mb-1 text-[8px]">{label}</div>
                  <div className="font-mono text-[13px] text-ink numeric">{value}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  downloadJson(
                    `orbit-workspace-${new Date().toISOString().slice(0, 10)}.json`,
                    useOrbitStore.getState(),
                  )
                }
              >
                <Download size={12} /> Export workspace JSON
              </Button>
              <Button variant="danger" size="sm" onClick={() => void handleResetLocal()} disabled={resetting}>
                <Trash2 size={12} /> {resetting ? 'Resetting…' : 'Reset local data'}
              </Button>
            </div>
            <p className="mt-2 text-[9px] leading-4 text-muted/70">
              Data never leaves this browser unless you export it. Clearing site data removes the
              workspace. No claim of Earth synchronisation is made anywhere in ORBIT.
            </p>
          </Panel>

          <Panel title="About this prototype" meta="Version and context">
            <dl className="divide-y divide-line/60">
              {[
                ['Application', 'ORBIT v1.0'],
                ['Challenge', 'Health Monitoring Software for Astronauts on Space Missions'],
                ['Event', 'NASA International Space Apps Challenge 2026'],
                ['Team', 'Miva University'],
                ['Mission', 'SELENE-4 · fictional lunar research outpost'],
                ['Crew', '3 fictional astronauts · all values synthetic'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-3 py-2 first:pt-0 last:pb-0">
                  <dt className="text-[9px] uppercase tracking-[0.06em] text-muted">{label}</dt>
                  <dd className="text-right text-[10px] leading-4 text-ink">{value}</dd>
                </div>
              ))}
            </dl>
            <a
              href="https://www.nasa.gov/hrp/"
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.05em] text-accent hover:underline"
            >
              NASA Human Research Program <ArrowRight size={11} />
            </a>
          </Panel>

          <div className="flex items-start gap-2 border border-critical/25 bg-critical/5 px-3 py-2.5">
            <StatusDot tone="critical" className="mt-1" />
            <p className="text-[9px] leading-4 text-muted">
              ORBIT is an educational prototype. It is not a medical device, does not diagnose or
              treat conditions, and must not be used for real clinical or mission decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
      <div>
        <div className="text-[11px] text-ink">{label}</div>
        <p className="mt-0.5 max-w-sm text-[9px] leading-4 text-muted">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 h-4 w-8 shrink-0 border transition-colors',
          checked ? 'border-accent/60 bg-accent/20' : 'border-line bg-bg',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'absolute top-[2px] h-[10px] w-[10px] transition-all',
            checked ? 'left-[18px] bg-accent' : 'left-[2px] bg-muted',
          )}
        />
      </button>
    </div>
  );
}
