import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CircleCheck,
  MonitorPlay,
  Play,
  Radio,
  ShieldCheck,
  SkipForward,
  Sparkles,
} from 'lucide-react';
import { useOrbitStore } from '../store/orbitStore';
import { ASTRONAUTS } from '../data/astronauts';
import { Badge, Button } from '../components/ui';
import { OrbitMark } from '../components/brand/OrbitMark';
import { formatMET } from '../lib/format';

const BOOT_STEPS = [
  { code: 'SYS.01', line: 'ORBIT SYSTEM INITIALIZING', detail: 'Local health-intelligence kernel' },
  { code: 'SYS.02', line: 'HEALTH TELEMETRY ONLINE', detail: '3 crew channels · synthetic feed' },
  { code: 'SYS.03', line: 'MISSION ENVIRONMENT SYNCHRONIZED', detail: 'SELENE-4 habitat model' },
  { code: 'SYS.04', line: 'ASTRONAUT MONITORING ACTIVE', detail: 'Personal baselines loaded' },
  { code: 'SYS.05', line: 'WELCOME TO ORBIT', detail: 'Beyond monitoring' },
];

const WORKFLOW = ['Monitor', 'Detect', 'Explain', 'Assess', 'Simulate', 'Document'];

export default function Intro() {
  const navigate = useNavigate();
  const introComplete = useOrbitStore((s) => s.introComplete);
  const completeIntro = useOrbitStore((s) => s.completeIntro);
  const startDemo = useOrbitStore((s) => s.startDemo);
  const setRunning = useOrbitStore((s) => s.setRunning);
  const clock = useOrbitStore((s) => s.sim.clock);
  const [step, setStep] = useState(introComplete ? BOOT_STEPS.length : 0);

  useEffect(() => {
    if (introComplete) {
      setStep(BOOT_STEPS.length);
      return;
    }
    const timers = BOOT_STEPS.map((_, index) =>
      window.setTimeout(() => setStep(index + 1), 380 * (index + 1)),
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [introComplete]);

  const finished = step >= BOOT_STEPS.length;

  const enter = () => {
    completeIntro();
    setRunning(false);
    navigate('/dashboard');
  };

  const launchDemo = () => {
    completeIntro();
    startDemo();
    navigate('/simulation');
  };

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden border border-line/40 bg-bg">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-line" />
      <div
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 hidden h-full w-px bg-line lg:block"
        style={{ left: 'max(2rem, calc((100vw - 1440px) / 2))' }}
      />

      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-4 py-4 md:px-8">
        <div className="flex items-center gap-3">
          <OrbitMark size={38} />
          <div>
            <div className="font-display text-[22px] font-semibold leading-none tracking-[0.18em] text-ink">
              ORBIT
            </div>
            <div className="mt-1.5 font-mono text-[8px] uppercase tracking-[0.2em] text-muted">
              Astronaut health intelligence
            </div>
          </div>
        </div>
        <div className="text-right font-mono text-[8px] uppercase leading-5 tracking-[0.12em] text-muted">
          <div>NASA International Space Apps Challenge 2026</div>
          <div className="text-muted/60">Miva University · Health monitoring challenge</div>
        </div>
      </header>

      <div className="relative z-10 mx-auto grid w-full max-w-[1440px] flex-1 items-center gap-8 px-4 py-8 md:px-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14 lg:py-12">
        <section className="min-w-0">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <p className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-accent">
              <span aria-hidden className="h-1.5 w-1.5 bg-accent" />
              Autonomous astronaut health intelligence
            </p>
            <h1 className="mt-5 max-w-[720px] font-display text-[40px] font-medium leading-[1.02] tracking-[-0.035em] text-ink sm:text-[56px] lg:text-[68px]">
              Beyond monitoring.
              <br />
              <span className="text-accent">Toward mission resilience.</span>
            </h1>
            <p className="mt-5 max-w-[560px] text-[13px] leading-6 text-muted">
              ORBIT connects synthetic physiological telemetry to mission context: it compares each
              crew member with their own baseline, explains every rule-based deviation, supports
              structured assessment, and models the consequences of operational decisions.
            </p>
          </motion.div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Button variant="primary" onClick={enter}>
              {finished ? 'Enter mission control' : 'Skip sequence & enter'} <ArrowRight size={14} />
            </Button>
            <Button variant="secondary" onClick={launchDemo}>
              <Play size={13} /> Launch judging demo
            </Button>
            <Link to="/presentation" className="btn btn-secondary">
              <MonitorPlay size={13} /> Judging presentation
            </Link>
            {!finished && (
              <button
                type="button"
                onClick={() => {
                  completeIntro();
                  setStep(BOOT_STEPS.length);
                }}
                className="btn btn-ghost px-2 text-[11px]"
              >
                <SkipForward size={13} /> Skip intro
              </button>
            )}
          </div>

          <div className="mt-8 border-t border-line pt-4">
            <div className="label mb-2.5">Operational loop</div>
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-2">
              {WORKFLOW.map((stage, index) => (
                <li key={stage} className="flex items-center gap-2">
                  <span className="border border-line bg-surface px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.08em] text-ink">
                    <span className="mr-1.5 text-accent">{String(index + 1).padStart(2, '0')}</span>
                    {stage}
                  </span>
                  {index < WORKFLOW.length - 1 && (
                    <ArrowRight size={11} className="text-muted/50" aria-hidden />
                  )}
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-6 grid max-w-[600px] gap-px border border-line bg-line sm:grid-cols-3">
            {[
              ['Crew', `${ASTRONAUTS.length} fictional`],
              ['History', '7 simulated days'],
              ['Runtime', 'Offline-first'],
            ].map(([label, value]) => (
              <div key={label} className="bg-surface px-3 py-2.5">
                <div className="label mb-1 text-[8px]">{label}</div>
                <div className="font-mono text-[11px] text-ink">{value}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="min-w-0">
          <div className="border border-line bg-surface">
            <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span
                  className={`h-1.5 w-1.5 ${finished ? 'bg-ok' : 'bg-caution'}`}
                  aria-hidden
                />
                <span className="label text-ink">
                  {finished ? 'Health intelligence online' : 'Initialization sequence'}
                </span>
              </div>
              <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
                {finished ? 'READY' : `${Math.min(step, BOOT_STEPS.length)}/${BOOT_STEPS.length}`}
              </span>
            </div>

            <div className="border-b border-line p-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <div className="label mb-1">Simulated mission</div>
                  <div className="font-display text-[15px] leading-6 text-ink">
                    SELENE-4 LUNAR OUTPOST
                  </div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.06em] text-muted">
                    Fictional south-polar basin · MET {formatMET(clock)}
                  </div>
                </div>
                <Badge tone="accent">SIMULATED</Badge>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-px border border-line bg-line">
                {[
                  ['Crew', '03'],
                  ['Channels', '14'],
                  ['Seed', '20260413'],
                ].map(([label, value]) => (
                  <div key={label} className="bg-bg px-2.5 py-2">
                    <div className="label mb-1 text-[8px]">{label}</div>
                    <div className="font-mono text-[11px] text-ink">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            <ol className="divide-y divide-line/70" aria-live="polite">
              {BOOT_STEPS.map((boot, index) => {
                const visible = step > index;
                const isCurrent = step === index + 1 && !finished;
                return (
                  <motion.li
                    key={boot.code}
                    initial={false}
                    animate={{ opacity: visible ? 1 : 0.28 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-3 px-4 py-2.5"
                  >
                    <span className="w-12 shrink-0 font-mono text-[8px] uppercase tracking-[0.08em] text-muted/60">
                      {boot.code}
                    </span>
                    <span
                      aria-hidden
                      className={`flex h-4 w-4 shrink-0 items-center justify-center border ${
                        visible
                          ? isCurrent
                            ? 'border-accent/60 bg-accent/10'
                            : 'border-ok/40 bg-ok/10'
                          : 'border-line bg-bg'
                      }`}
                    >
                      {visible && !isCurrent && <CircleCheck size={10} className="text-ok" />}
                      {isCurrent && <span className="h-1 w-1 animate-pulse-soft bg-accent" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block font-mono text-[9px] uppercase tracking-[0.08em] ${
                          visible ? 'text-ink' : 'text-muted'
                        }`}
                      >
                        {boot.line}
                      </span>
                      <span className="block text-[9px] leading-4 text-muted/60">{boot.detail}</span>
                    </span>
                  </motion.li>
                );
              })}
            </ol>

            <div className="border-t border-line p-4">
              <div className="h-1 w-full bg-surface2" aria-hidden>
                <div
                  className="h-full bg-accent transition-[width] duration-300"
                  style={{ width: `${(Math.min(step, BOOT_STEPS.length) / BOOT_STEPS.length) * 100}%` }}
                />
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.06em] text-muted">
                  <Radio size={10} /> Earth link nominal · local autonomy
                </span>
                {finished ? (
                  <button
                    type="button"
                    onClick={enter}
                    className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.06em] text-accent hover:underline"
                  >
                    Open dashboard <ArrowRight size={11} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      completeIntro();
                      setStep(BOOT_STEPS.length);
                    }}
                    className="font-mono text-[9px] uppercase tracking-[0.06em] text-muted hover:text-ink"
                  >
                    Skip
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="flex items-start gap-2 border border-line bg-surface px-3 py-2.5">
              <ShieldCheck size={14} className="mt-0.5 shrink-0 text-ok" />
              <p className="text-[9px] leading-4 text-muted">
                Deterministic rules run locally. No AI model decides whether a crew member is safe.
              </p>
            </div>
            <div className="flex items-start gap-2 border border-line bg-surface px-3 py-2.5">
              <Sparkles size={14} className="mt-0.5 shrink-0 text-accent" />
              <p className="text-[9px] leading-4 text-muted">
                ORBIT MED explains evidence. It cannot alter alerts, state or operational decisions.
              </p>
            </div>
          </div>
        </section>
      </div>

      <footer className="relative z-10 border-t border-line px-4 py-3 md:px-8">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-[8px] uppercase leading-4 tracking-[0.08em] text-muted/60">
            Educational prototype · all crew, telemetry and mission conditions are synthetic · not a
            medical device
          </p>
          <p className="font-mono text-[8px] uppercase tracking-[0.08em] text-muted/40">
            ORBIT / SELENE-4 / BUILD 1.0
          </p>
        </div>
      </footer>
    </main>
  );
}
