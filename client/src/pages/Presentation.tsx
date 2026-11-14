import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  Check,
  ExternalLink,
  FileText,
  FlaskConical,
  GitCompareArrows,
  HeartPulse,
  Maximize2,
  Minimize2,
  NotebookPen,
  Play,
  Radio,
  ShieldCheck,
  X,
} from 'lucide-react';
import { OrbitMark } from '../components/brand/OrbitMark';
import { cn } from '../components/ui';

const TOTAL = 10;

const NOTES = [
  'Open with the problem: a measurement is not a decision. Long-duration crews need local, contextual judgement when Earth is delayed or unavailable.',
  'Four gaps: isolated numbers, communication delay, generic thresholds, and alerts nobody can explain. ORBIT addresses each one in the same workflow.',
  'The workflow is the product. Monitoring, detection, explanation, assessment, simulation and documentation all share one authoritative state.',
  'This is the real dashboard, not a mockup. Personal baselines, source labels, synthetic provenance and multiple physiological domains are visible at once.',
  'Every alert shows its evidence, baseline, rule, window, context, contributing factors and limitations. The deterministic engine decides; the language model only explains.',
  'Three scenarios connect operational conditions to health indicators. The user can rest, reassign, shelter or respond to an ECLSS fault.',
  'The simulator runs two deterministic branches from the same state. The chosen decision and both projections are recorded and appear in the report.',
  'Scientific integrity is a feature. Research-supported claims are separated from approximations and synthetic parameters, and the app never diagnoses.',
  'Play the 40-second film, then open the live product. The film is a narrative wrapper; the demo is the working system.',
  'Close on the outcome: a complete, reproducible, local-first workflow. Mention the test suite, the documentation and the three-minute demo path.',
];

type SlideMeta = { kind: string; title: string };

const SLIDES: SlideMeta[] = [
  { kind: 'Cover', title: 'Beyond monitoring' },
  { kind: 'Problem', title: 'A number is not a decision' },
  { kind: 'Solution', title: 'One connected workflow' },
  { kind: 'Monitor', title: 'Context before thresholds' },
  { kind: 'Explain', title: 'Every alert explains itself' },
  { kind: 'Simulate', title: 'Model the operational choice' },
  { kind: 'Document', title: 'Leave an evidence trail' },
  { kind: 'Science', title: 'Integrity is a feature' },
  { kind: 'Film', title: 'The launch film' },
  { kind: 'Close', title: 'Mission resilience' },
];

export default function Presentation() {
  const [index, setIndex] = useState(0);
  const [notes, setNotes] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const reduceMotion = useReducedMotion();

  const go = useCallback((next: number) => {
    setIndex(Math.max(0, Math.min(TOTAL - 1, next)));
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setFullscreen(true);
      } else {
        await document.exitFullscreen();
        setFullscreen(false);
      }
    } catch {
      setFullscreen(Boolean(document.fullscreenElement));
    }
  }, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('video, input, textarea, select')) return;
      if (event.key === 'ArrowRight' || event.key === ' ' || event.key === 'PageDown') {
        event.preventDefault();
        setIndex((current) => Math.min(TOTAL - 1, current + 1));
      } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault();
        setIndex((current) => Math.max(0, current - 1));
      } else if (event.key === 'Home') {
        setIndex(0);
      } else if (event.key === 'End') {
        setIndex(TOTAL - 1);
      } else if (event.key.toLowerCase() === 'n') {
        setNotes((current) => !current);
      } else if (event.key.toLowerCase() === 'f') {
        void toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleFullscreen]);

  useEffect(() => {
    const onFullscreenChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const slide = SLIDES[index];

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-bg text-ink">
      <DeckGrid />

      <header className="relative z-20 flex items-center justify-between border-b border-line px-5 py-3 md:px-8">
        <div className="flex items-center gap-3">
          <OrbitMark size={28} />
          <span className="font-display text-[16px] font-semibold tracking-[0.16em]">ORBIT</span>
          <span className="hidden font-mono text-[8px] uppercase tracking-[0.16em] text-muted sm:inline">
            Judging presentation
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setNotes((current) => !current)}
            aria-pressed={notes}
            className={cn(
              'inline-flex items-center gap-1.5 border px-2 py-1.5 font-mono text-[9px] uppercase tracking-[0.08em]',
              notes
                ? 'border-accent/50 bg-accent/10 text-accent'
                : 'border-line bg-surface text-muted hover:text-ink',
            )}
          >
            <NotebookPen size={11} /> Notes
          </button>
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            className="inline-flex items-center gap-1.5 border border-line bg-surface px-2 py-1.5 font-mono text-[9px] uppercase tracking-[0.08em] text-muted hover:text-ink"
            aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {fullscreen ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
            <span className="hidden sm:inline">{fullscreen ? 'Exit' : 'Present'}</span>
          </button>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 border border-line bg-surface px-2 py-1.5 font-mono text-[9px] uppercase tracking-[0.08em] text-muted hover:text-ink"
          >
            <X size={11} /> <span className="hidden sm:inline">Exit deck</span>
          </Link>
        </div>
      </header>

      <main className="relative z-10 min-h-0 flex-1 px-5 py-4 md:px-8 md:py-5">
        <AnimatePresence mode="wait" initial={false}>
          <motion.section
            key={index}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 36 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -24 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="flex h-full min-h-0 flex-col"
          >
            <div className="mb-2 flex items-center gap-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-accent">
                {String(index + 1).padStart(2, '0')} / {String(TOTAL).padStart(2, '0')}
              </span>
              <span className="h-px w-8 bg-line" />
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
                {slide.kind}
              </span>
            </div>
            <div className="min-h-0 flex-1">{renderSlide(index)}</div>
          </motion.section>
        </AnimatePresence>
      </main>

      <footer className="relative z-20 flex items-center gap-4 border-t border-line px-5 py-2.5 md:px-8">
        <button
          type="button"
          onClick={() => go(index - 1)}
          disabled={index === 0}
          className="inline-flex items-center gap-1.5 border border-line bg-surface px-2 py-1.5 font-mono text-[9px] uppercase tracking-[0.08em] text-muted disabled:opacity-30 hover:text-ink"
          aria-label="Previous slide"
        >
          <ArrowLeft size={11} /> Prev
        </button>
        <div className="flex flex-1 items-center justify-center gap-1.5" role="tablist" aria-label="Slides">
          {SLIDES.map((item, itemIndex) => (
            <button
              key={item.kind}
              type="button"
              role="tab"
              aria-selected={itemIndex === index}
              aria-label={`${itemIndex + 1}. ${item.title}`}
              title={item.title}
              onClick={() => go(itemIndex)}
              className={cn(
                'h-1.5 transition-all',
                itemIndex === index ? 'w-8 bg-accent' : 'w-3 bg-line hover:bg-muted',
              )}
            />
          ))}
        </div>
        <span className="hidden font-mono text-[8px] uppercase tracking-[0.1em] text-muted/60 md:inline">
          ← → navigate · F fullscreen · N notes
        </span>
        <button
          type="button"
          onClick={() => go(index + 1)}
          disabled={index === TOTAL - 1}
          className="inline-flex items-center gap-1.5 border border-line bg-surface px-2 py-1.5 font-mono text-[9px] uppercase tracking-[0.08em] text-muted disabled:opacity-30 hover:text-ink"
          aria-label="Next slide"
        >
          Next <ArrowRight size={11} />
        </button>
      </footer>

      <AnimatePresence>
        {notes && (
          <motion.aside
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-[52px] left-0 right-0 z-30 border-t border-accent/30 bg-surface2 px-5 py-3 md:px-8"
          >
            <div className="flex items-start gap-3">
              <NotebookPen size={14} className="mt-0.5 shrink-0 text-accent" />
              <div>
                <div className="font-mono text-[8px] uppercase tracking-[0.14em] text-accent">
                  Speaker note · slide {index + 1}
                </div>
                <p className="mt-1 max-w-5xl text-[11px] leading-5 text-muted">{NOTES[index]}</p>
              </div>
              <button
                type="button"
                onClick={() => setNotes(false)}
                className="ml-auto p-1 text-muted hover:text-ink"
                aria-label="Close speaker notes"
              >
                <X size={13} />
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}

function renderSlide(index: number) {
  switch (index) {
    case 0:
      return <CoverSlide />;
    case 1:
      return <ProblemSlide />;
    case 2:
      return <SolutionSlide />;
    case 3:
      return <MonitorSlide />;
    case 4:
      return <ExplainSlide />;
    case 5:
      return <SimulationSlide />;
    case 6:
      return <DocumentSlide />;
    case 7:
      return <ScienceSlide />;
    case 8:
      return <FilmSlide />;
    default:
      return <CloseSlide />;
  }
}

function CoverSlide() {
  return (
    <div className="grid h-full min-h-0 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="flex min-h-0 flex-col justify-center">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-accent">
          NASA International Space Apps Challenge 2026
        </p>
        <h1 className="mt-4 font-display text-[clamp(62px,9.4vw,168px)] font-semibold leading-[0.82] tracking-[-0.06em]">
          ORBIT
        </h1>
        <p className="mt-5 max-w-2xl font-display text-[clamp(22px,2.5vw,42px)] leading-[1.05] tracking-[-0.03em] text-ink">
          Beyond monitoring.
          <br />
          <span className="text-accent">Toward mission resilience.</span>
        </p>
        <p className="mt-4 max-w-xl text-[clamp(11px,0.95vw,15px)] leading-6 text-muted">
          Autonomous astronaut health intelligence and mission simulation. A working,
          offline-first prototype that connects telemetry to context, explanation and operational
          decisions.
        </p>
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
          <span>Health Monitoring Software</span>
          <span className="text-line">|</span>
          <span>Miva University</span>
          <span className="text-line">|</span>
          <span className="text-accent">Working prototype</span>
        </div>
      </div>

      <div className="relative hidden min-h-0 items-center justify-center lg:flex">
        <div className="relative flex aspect-square w-[min(36vw,520px)] items-center justify-center border border-line">
          <OrbitMark size={320} />
          <div className="absolute inset-0">
            {[
              ['3', 'FICTIONAL CREW'],
              ['7', 'SIMULATED DAYS'],
              ['6', 'WORKFLOW STAGES'],
              ['0', 'CLOUD DEPENDENCIES'],
            ].map(([value, label], itemIndex) => {
              const positions = [
                'left-4 top-4',
                'right-4 top-4',
                'left-4 bottom-4',
                'right-4 bottom-4',
              ];
              return (
                <div key={label} className={cn('absolute', positions[itemIndex])}>
                  <div className="font-mono text-2xl text-ink">{value}</div>
                  <div className="font-mono text-[7px] uppercase tracking-[0.12em] text-muted">
                    {label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="absolute bottom-3 right-0 font-mono text-[8px] uppercase tracking-[0.12em] text-muted/60">
          Press → or Space to begin
        </div>
      </div>
    </div>
  );
}

function ProblemSlide() {
  const problems = [
    {
      icon: HeartPulse,
      title: 'Isolated measurements',
      body: 'A heart rate, a sleep duration and a cabin reading are displayed separately. The relationship between them is left to the crew.',
      response: 'One authoritative state',
    },
    {
      icon: Radio,
      title: 'Communication is not guaranteed',
      body: 'Long-duration crews cannot wait for Earth to interpret every change. Monitoring, detection and explanation must work locally.',
      response: 'Local autonomy by default',
    },
    {
      icon: Brain,
      title: 'Generic thresholds miss the person',
      body: 'A value can be normal for one astronaut and unusual for another. Context requires a personal baseline and recent mission history.',
      response: 'Personal 72-hour baselines',
    },
    {
      icon: GitCompareArrows,
      title: 'Alerts without reasoning',
      body: 'An unexplained warning creates uncertainty. Teams need triggering values, the rule, the window, the limitations and a next step.',
      response: 'Evidence at the alert',
    },
  ];
  return (
    <div className="grid h-full min-h-0 gap-6 lg:grid-cols-[0.42fr_0.58fr] lg:gap-8">
      <div className="flex min-h-0 min-w-0 flex-col">
        <h2 className="max-w-[560px] font-display text-[clamp(34px,3.8vw,64px)] leading-[0.96] tracking-[-0.045em]">
          A number is not a decision.
        </h2>
        <p className="mt-3 max-w-[520px] text-[clamp(11px,0.95vw,14px)] leading-6 text-muted">
          The hard question is not “what is the value?” It is “what changed for this astronaut, why
          does it matter, and what should we do next?”
        </p>

        <div className="mt-5 flex min-h-0 flex-1 flex-col justify-center border-y border-line/70 py-4">
          <div className="flex items-center justify-between font-mono text-[8px] uppercase tracking-[0.12em]">
            <span className="text-muted">Worked example · D014 12:00</span>
            <span className="text-accent">Simulated</span>
          </div>
          <div className="mt-4 flex items-end justify-between gap-4 border-b border-line/70 pb-3">
            <div>
              <div className="font-mono text-[40px] leading-none text-ink">70</div>
              <div className="mt-1 font-mono text-[7px] uppercase tracking-[0.1em] text-muted">
                Resting HR · bpm
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[14px] text-accent">+11.0%</div>
              <div className="mt-1 font-mono text-[7px] uppercase tracking-[0.1em] text-muted">
                vs 63 bpm baseline
              </div>
            </div>
          </div>
          <div className="mt-3 space-y-3">
            {[
              ['CONTEXT', '+11% vs 63 bpm baseline · 4.2 h sleep · 8 min one-way delay', 'text-muted'],
              ['DECISION', 'Rest, repeat measurement, review in 6 hours', 'text-ink'],
              ['PROJECTION', 'Fatigue 84 → 58 after rest', 'text-accent'],
            ].map(([label, value, tone]) => (
              <div key={label} className="grid grid-cols-[76px_1fr] gap-3 border-l border-line pl-3">
                <div className="font-mono text-[7px] uppercase tracking-[0.1em] text-muted/60">{label}</div>
                <div className={`text-[10px] leading-4 ${tone}`}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4">
          <div className="font-mono text-[8px] uppercase tracking-[0.14em] text-accent">
            The design response
          </div>
          <p className="mt-2 max-w-[520px] font-display text-[clamp(20px,2vw,30px)] leading-[1.06] tracking-[-0.03em] text-ink">
            Make the reasoning visible.
          </p>
          <div className="mt-3 divide-y divide-line/60 border-y border-line/60">
            {[
              ['ONE STATE', 'Telemetry, alerts, assessments, decisions and reports.'],
              ['LOCAL FIRST', 'The core workflow runs without a cloud dependency.'],
              ['EXPLAINABLE', 'Rule, evidence, baseline, window and limits.'],
            ].map(([title, body]) => (
              <div key={title} className="grid grid-cols-[92px_1fr] gap-3 py-2">
                <div className="font-mono text-[8px] uppercase tracking-[0.08em] text-ink">{title}</div>
                <p className="text-[10px] leading-4 text-muted">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid min-h-0 grid-rows-4 gap-2">
        {problems.map((problem, index) => {
          const Icon = problem.icon;
          return (
            <article
              key={problem.title}
              className="grid min-h-0 grid-cols-[34px_1fr] items-center gap-4 border border-line bg-surface p-4 md:grid-cols-[34px_1fr_136px] md:p-5"
            >
              <div className="flex h-9 w-9 items-center justify-center border border-line bg-bg">
                <Icon size={16} className="text-accent" strokeWidth={1.6} />
              </div>
              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-[8px] text-muted/50">0{index + 1}</span>
                  <h3 className="font-display text-[clamp(15px,1.25vw,21px)] leading-6 text-ink">
                    {problem.title}
                  </h3>
                </div>
                <p className="mt-1 max-w-[560px] text-[clamp(10px,0.82vw,12px)] leading-5 text-muted">
                  {problem.body}
                </p>
              </div>
              <div className="hidden items-center gap-1.5 border-l border-line pl-3 font-mono text-[8px] uppercase leading-4 tracking-[0.06em] text-accent md:flex">
                <ArrowRight size={9} className="shrink-0" /> {problem.response}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function SolutionSlide() {
  const stages = ['MONITOR', 'DETECT', 'EXPLAIN', 'ASSESS', 'SIMULATE', 'DOCUMENT'];
  return (
    <div className="flex h-full min-h-0 flex-col">
      <h2 className="max-w-5xl font-display text-[clamp(34px,4.4vw,72px)] leading-[0.98] tracking-[-0.045em]">
        One connected workflow.
      </h2>
      <p className="mt-2 max-w-3xl text-[clamp(11px,0.95vw,14px)] leading-6 text-muted">
        Every screen reads and writes the same authoritative mission state. An alert is generated
        from observations; a decision forks that state; a report documents what happened.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-3 lg:grid-cols-6">
        {stages.map((stage, index) => (
          <div key={stage} className="bg-surface p-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[8px] text-muted">0{index + 1}</span>
              {index < stages.length - 1 && <ArrowRight size={10} className="text-line" />}
            </div>
            <div className="mt-6 font-mono text-[clamp(10px,0.9vw,13px)] uppercase tracking-[0.08em] text-ink">
              {stage}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid shrink-0 gap-2 lg:grid-cols-3">
        {[
          [
            'Personal, not generic',
            'Each crew member has a synthetic baseline for cardiovascular, sleep, fatigue and cognitive indicators. The 72-hour rolling mean and standard deviation are visible and explainable.',
          ],
          [
            'Deterministic, not AI-decided',
            'Percentage and standardised-deviation rules with consecutive-sample confirmation decide every alert. The optional language model can only explain a read-only snapshot.',
          ],
          [
            'Local-first, not cloud-dependent',
            'Simulation, detection, assessments, reports and the fallback explanation engine run in the browser. IndexedDB restores the workspace after a reload.',
          ],
        ].map(([title, body]) => (
          <article key={title} className="border border-line bg-surface p-4">
            <div className="h-px w-6 bg-accent" />
            <h3 className="mt-3 font-display text-[clamp(14px,1.2vw,18px)] text-ink">{title}</h3>
            <p className="mt-2 text-[clamp(10px,0.82vw,12px)] leading-5 text-muted">{body}</p>
          </article>
        ))}
      </div>

      <div className="mt-3 flex min-h-0 flex-1 flex-col gap-2">
        <div className="flex items-center justify-between font-mono text-[8px] uppercase tracking-[0.1em] text-muted">
          <span>Same authoritative state · every product surface</span>
          <span className="text-muted/50">Live screenshots · simulated data</span>
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-3 gap-2">
          {[
            ['/presentation/dashboard.png', 'OVERVIEW'],
            ['/presentation/alerts.png', 'EXPLAINABLE ALERTS'],
            ['/presentation/simulation.png', 'DECISION SIMULATION'],
          ].map(([src, label]) => (
            <figure key={label} className="relative min-h-0 overflow-hidden border border-line bg-surface">
              <img src={src} alt="" className="h-full w-full object-cover object-top opacity-90" />
              <figcaption className="absolute bottom-0 left-0 border-t border-r border-line bg-bg/95 px-2 py-1 font-mono text-[7px] uppercase tracking-[0.08em] text-muted">
                {label}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
}

function MonitorSlide() {
  return (
    <div className="grid h-full min-h-0 gap-5 lg:grid-cols-[1.45fr_0.55fr]">
      <div className="flex min-h-0 min-w-0 flex-col">
        <h2 className="font-display text-[clamp(30px,3.8vw,62px)] leading-[0.98] tracking-[-0.04em]">
          Context before thresholds.
        </h2>
        <DeckShot
          src="/presentation/dashboard.png"
          label="orbit.local / dashboard"
          className="mt-3 min-h-0 flex-1"
        />
      </div>
      <div className="flex min-h-0 min-w-0 flex-col justify-center gap-2">
        <div className="border border-accent/40 bg-accent/5 p-3">
          <div className="font-mono text-[8px] uppercase tracking-[0.12em] text-accent">
            Synthetic telemetry
          </div>
          <p className="mt-1 text-[11px] leading-5 text-muted">
            Every value is generated by a seeded educational model and labelled at the point of
            display.
          </p>
        </div>
        {[
          ['Cardiovascular', 'Heart rate, resting HR, HRV, blood pressure'],
          ['Respiratory', 'Respiratory rate and simulated SpO₂'],
          ['Sleep & recovery', 'Trailing 24 h sleep, consistency, fatigue'],
          ['Behavioural', 'Stress, mood, cognitive index, reaction time'],
          ['Environment', 'Dose estimate, CO₂, O₂, temperature, location'],
        ].map(([title, body], index) => (
          <div key={title} className="border border-line bg-surface p-3">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="font-display text-[13px] text-ink">{title}</h3>
              <span className="font-mono text-[8px] text-muted/50">0{index + 1}</span>
            </div>
            <p className="mt-1 text-[10px] leading-4 text-muted">{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExplainSlide() {
  return (
    <div className="grid h-full min-h-0 gap-5 lg:grid-cols-[1.35fr_0.65fr]">
      <div className="flex min-h-0 min-w-0 flex-col">
        <h2 className="font-display text-[clamp(30px,3.8vw,62px)] leading-[0.98] tracking-[-0.04em]">
          Every alert explains itself.
        </h2>
        <DeckShot
          src="/presentation/alerts.png"
          label="orbit.local / alerts"
          className="mt-3 min-h-0 flex-1"
        />
      </div>
      <div className="flex min-h-0 min-w-0 flex-col justify-center">
        <div className="border border-line bg-surface p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink">
              Evidence anatomy
            </span>
            <span className="font-mono text-[8px] uppercase tracking-[0.08em] text-caution">
              Deterministic
            </span>
          </div>
          <div className="mt-3 divide-y divide-line/60">
            {[
              ['Triggering values', 'Up to eight consecutive breaching observations'],
              ['Personal baseline', '72-hour rolling mean and standard deviation'],
              ['Rule and window', 'Exact threshold, direction and time range'],
              ['Mission context', 'Activity, zone, communication, scenario'],
              ['Limitations', 'Synthetic data, rule assumptions, sensor quality'],
              ['Next assessment', 'Structured self-report, repeat measurement, review'],
            ].map(([label, value], index) => (
              <div key={label} className="py-2 first:pt-0 last:pb-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-muted">
                    {String(index + 1).padStart(2, '0')} · {label}
                  </span>
                </div>
                <p className="mt-1 text-[10px] leading-4 text-ink/90">{value}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-3 border-l-2 border-critical pl-3 text-[10px] leading-5 text-muted">
          Prototype classification, not a clinical risk category. The alert reports co-occurrence
          and never asserts causation.
        </p>
      </div>
    </div>
  );
}

function SimulationSlide() {
  return (
    <div className="grid h-full min-h-0 gap-5 lg:grid-cols-[1.45fr_0.55fr]">
      <div className="flex min-h-0 min-w-0 flex-col">
        <h2 className="font-display text-[clamp(30px,3.8vw,62px)] leading-[0.98] tracking-[-0.04em]">
          Model the operational choice.
        </h2>
        <DeckShot
          src="/presentation/simulation.png"
          label="orbit.local / simulation"
          className="mt-3 min-h-0 flex-1"
        />
      </div>
      <div className="flex min-h-0 min-w-0 flex-col justify-center gap-2">
        {[
          ['01 · Fatigue', 'Extended inspection, restricted sleep. Continue, rest or reassign.'],
          ['02 · Radiation', 'Solar particle event during EVA. Continue, return or shelter.'],
          ['03 · ECLSS', 'CO₂ removal fault. Investigate, reduce operations or emergency workflow.'],
        ].map(([title, body], index) => (
          <div key={title} className="border border-line bg-surface p-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-accent">
                Scenario {index + 1}
              </span>
              <span className="font-mono text-[8px] text-muted/50">ACTIVE</span>
            </div>
            <h3 className="mt-2 font-display text-[13px] text-ink">{title}</h3>
            <p className="mt-1 text-[10px] leading-4 text-muted">{body}</p>
          </div>
        ))}
        <div className="border border-line bg-bg p-3">
          <div className="font-mono text-[8px] uppercase tracking-[0.1em] text-muted">
            Two deterministic branches
          </div>
          <div className="mt-2 flex items-end gap-3">
            <div>
              <div className="font-mono text-2xl text-critical">84</div>
              <div className="font-mono text-[7px] uppercase tracking-[0.08em] text-muted">
                as planned
              </div>
            </div>
            <ArrowRight size={13} className="mb-3 text-line" />
            <div>
              <div className="font-mono text-2xl text-accent">58</div>
              <div className="font-mono text-[7px] uppercase tracking-[0.08em] text-muted">
                with rest
              </div>
            </div>
          </div>
          <p className="mt-2 text-[9px] leading-4 text-muted/70">
            Illustrative fatigue projection, not a physiological forecast.
          </p>
        </div>
      </div>
    </div>
  );
}

function DocumentSlide() {
  return (
    <div className="grid h-full min-h-0 gap-5 lg:grid-cols-[1.35fr_0.65fr]">
      <div className="flex min-h-0 min-w-0 flex-col">
        <h2 className="font-display text-[clamp(30px,3.8vw,62px)] leading-[0.98] tracking-[-0.04em]">
          Leave an evidence trail.
        </h2>
        <DeckShot
          src="/presentation/report.png"
          label="orbit.local / reports"
          className="mt-3 min-h-0 flex-1"
        />
      </div>
      <div className="flex min-h-0 min-w-0 flex-col justify-center">
        <div className="border border-line bg-surface p-4">
          <div className="flex items-center gap-2">
            <FileText size={14} className="text-accent" />
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink">
              Mission health report
            </span>
          </div>
          <ul className="mt-3 space-y-2">
            {[
              'Reporting period and observation count',
              'Baseline comparison table',
              'Heart-rate and sleep trends',
              'Detected anomalies and acknowledgement',
              'Assessments and reaction-time results',
              'Operational decisions and projections',
              'Event timeline and follow-up items',
              'Provenance and explicit limitations',
            ].map((item) => (
              <li key={item} className="flex gap-2 text-[10px] leading-4 text-muted">
                <Check size={11} className="mt-0.5 shrink-0 text-ok" />
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-3 border-t border-line pt-2 font-mono text-[8px] uppercase tracking-[0.08em] text-muted">
            Print or save to PDF from the browser
          </div>
        </div>
        <p className="mt-3 text-[10px] leading-5 text-muted">
          Reports are produced entirely from local state and state the educational limits in the
          document itself.
        </p>
      </div>
    </div>
  );
}

function ScienceSlide() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <h2 className="font-display text-[clamp(30px,4vw,66px)] leading-[0.98] tracking-[-0.04em]">
        Scientific integrity is a feature.
      </h2>
      <p className="mt-2 max-w-3xl text-[clamp(11px,0.95vw,14px)] leading-5 text-muted">
        We separate what research supports from what we approximate and what is invented for the
        demonstration.
      </p>

      <div className="mt-4 grid shrink-0 gap-2 lg:grid-cols-3">
        <article className="border border-ok/30 bg-ok/5 p-4">
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.1em] text-ok">
            <FlaskConical size={13} /> Research-supported
          </div>
          <p className="mt-3 text-[11px] leading-5 text-muted">
            Published findings inform the framing: in-flight sleep near six hours, lunar surface
            dose, solar-event shielding, the NASA CO₂ reference and multi-system variability.
          </p>
          <div className="mt-3 space-y-1 font-mono text-[8px] leading-4 text-muted/70">
            <a href="https://www.nasa.gov/hrp/" target="_blank" rel="noreferrer" className="block hover:text-accent">
              NASA Human Research Program ↗
            </a>
            <a href="https://osdr.nasa.gov/" target="_blank" rel="noreferrer" className="block hover:text-accent">
              NASA Open Science Data Repository ↗
            </a>
            <a href="https://www.nasa.gov/ochmo-tb-004-carbon-dioxide-2" target="_blank" rel="noreferrer" className="block hover:text-accent">
              NASA OCHMO · CO₂ technical brief ↗
            </a>
          </div>
        </article>

        <article className="border border-caution/30 bg-caution/5 p-4">
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.1em] text-caution">
            <Brain size={13} /> Educational approximation
          </div>
          <p className="mt-3 text-[11px] leading-5 text-muted">
            Physiological responses are simplified linear relationships. The CO₂ ppm value is a
            pressure conversion proxy. Dose is a location multiplier, not a transport calculation.
          </p>
          <p className="mt-3 text-[10px] leading-5 text-muted/70">
            Every coefficient is documented in <span className="font-mono">docs/SIMULATION.md</span>.
          </p>
        </article>

        <article className="border border-line bg-surface p-4">
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
            <GitCompareArrows size={13} /> Synthetic parameter
          </div>
          <p className="mt-3 text-[11px] leading-5 text-muted">
            The crew, telemetry, rules, review bands and mission are invented for the demonstration.
            Thresholds are editable and labelled as prototype assumptions.
          </p>
          <p className="mt-3 text-[10px] leading-5 text-muted/70">
            No NASA medical records or OSDR datasets were used or implied.
          </p>
        </article>
      </div>

      <div className="mt-3 flex shrink-0 flex-col border border-line bg-surface">
        <div className="flex items-center justify-between border-b border-line px-4 py-2 font-mono text-[8px] uppercase tracking-[0.1em]">
          <span className="text-ink">Claim ledger</span>
          <span className="text-muted/60">Evidence status · not a clinical validation</span>
        </div>
        <div className="grid grid-rows-4 divide-y divide-line/60">
          {[
            [
              'Sleep duration and consistency affect operational performance',
              'Research-supported',
              'text-ok',
              'NASA HRP and in-flight sleep analyses frame this monitoring domain.',
            ],
            [
              'Lunar surface operations carry a material radiation burden',
              'Research-supported',
              'text-ok',
              'Surface dose and solar-event shielding inform the scenario, not individual risk.',
            ],
            [
              'Cabin CO₂ can be estimated from partial pressure',
              'Approximation',
              'text-caution',
              'A conversion proxy, not a calibrated sensor or habitat model.',
            ],
            [
              'Alert thresholds and review bands',
              'Synthetic',
              'text-muted',
              'Prototype rules, editable in Settings and never presented as clinical cut-offs.',
            ],
          ].map(([claim, status, tone, note]) => (
            <div
              key={claim}
              className="grid min-h-[46px] items-center gap-2 px-4 py-2 sm:grid-cols-[1.25fr_130px_1fr] sm:gap-4 2xl:min-h-[56px]"
            >
              <div className="text-[11px] leading-4 text-ink">{claim}</div>
              <div className={`font-mono text-[8px] uppercase tracking-[0.08em] ${tone}`}>{status}</div>
              <div className="text-[10px] leading-4 text-muted">{note}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex min-h-0 flex-1 flex-col justify-center border border-critical/30 bg-critical/5 p-3">
        <p className="hidden font-display text-[clamp(24px,2.4vw,38px)] leading-[1.05] tracking-[-0.03em] text-ink 2xl:block">
          If we cannot source it,
          <br />
          <span className="text-critical">we label it.</span>
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-[160px_1fr] sm:items-baseline sm:gap-4">
          <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-critical">
            What we do not claim
          </div>
          <div className="text-[10px] leading-4 text-muted">
            No diagnosis. No clinical validation. No individual radiation-risk prediction. No AI
            deciding whether an astronaut is safe. The report says so on every page.
          </div>
        </div>
      </div>
    </div>
  );
}

function FilmSlide() {
  return (
    <div className="grid h-full min-h-0 gap-5 lg:grid-cols-[0.42fr_0.58fr]">
      <div className="flex min-h-0 flex-col justify-center">
        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-accent">Launch film · 40 s</p>
        <h2 className="mt-2 font-display text-[clamp(34px,4.8vw,76px)] leading-[0.9] tracking-[-0.045em]">
          Every frame
          <br />
          is designed.
        </h2>
        <p className="mt-3 max-w-md text-[11px] leading-5 text-muted">
          The film is a narrative wrapper around the product: signals, context, explainable alerts,
          a simulated decision and the report. It is rendered from the same brand system as the app.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/dashboard" className="btn btn-primary">
            <Play size={13} /> Open live ORBIT
          </Link>
          <Link to="/simulation" className="btn btn-secondary">
            Launch demo <ArrowRight size={13} />
          </Link>
        </div>
        <div className="mt-4 flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.08em] text-muted">
          <ShieldCheck size={11} className="text-ok" />
          Original procedural score · synthetic visuals
        </div>
      </div>

      <div className="flex min-h-0 items-center">
        <div className="w-full border border-line bg-surface p-2">
          <video
            controls
            playsInline
            preload="auto"
            poster="/media/orbit-launch-thumbnail.png"
            className="aspect-video w-full bg-bg"
          >
            <source src="/media/orbit-launch-1080p.mp4" type="video/mp4" />
            Your browser does not support the launch film. The live product remains available.
          </video>
          <div className="mt-2 flex items-center justify-between px-1">
            <span className="font-mono text-[8px] uppercase tracking-[0.08em] text-muted">
              ORBIT / launch film / 1920 × 1080 / 60 FPS
            </span>
            <a
              href="/media/orbit-launch-1080p.mp4"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.08em] text-accent hover:underline"
            >
              Open MP4 <ExternalLink size={9} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function CloseSlide() {
  return (
    <div className="flex h-full min-h-0 flex-col justify-between">
      <div className="flex flex-1 flex-col justify-center">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-accent">
          NASA International Space Apps Challenge 2026 · Miva University
        </p>
        <h2 className="mt-4 font-display text-[clamp(42px,6.4vw,112px)] leading-[0.92] tracking-[-0.05em]">
          Beyond monitoring.
          <br />
          <span className="text-accent">Toward mission resilience.</span>
        </h2>
        <p className="mt-5 max-w-2xl text-[clamp(11px,1vw,15px)] leading-6 text-muted">
          A complete, reproducible workflow from mission conditions to a documented decision — built
          to keep working when the cloud does not.
        </p>
      </div>
      <div className="grid gap-2 border-t border-line pt-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['10 / 10', 'Engine tests passing'],
          ['2 / 2', 'Browser journeys passing'],
          ['6', 'Documentation files'],
          ['100%', 'Local core workflow'],
        ].map(([value, label]) => (
          <div key={label}>
            <div className="font-mono text-2xl text-ink">{value}</div>
            <div className="mt-1 font-mono text-[8px] uppercase tracking-[0.1em] text-muted">{label}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.1em] text-muted">
          <OrbitMark size={18} /> ORBIT / SELENE-4 / Educational prototype
        </div>
        <div className="flex gap-2">
          <Link to="/research" className="btn btn-secondary px-2 py-1 text-[11px]">
            Research register
          </Link>
          <Link to="/dashboard" className="btn btn-primary px-2 py-1 text-[11px]">
            Enter ORBIT <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}

function DeckShot({
  src,
  label,
  className,
}: {
  src: string;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn('flex min-h-0 min-w-0 flex-col border border-line bg-surface', className)}>
      <div className="flex h-8 shrink-0 items-center gap-2 border-b border-line bg-surface2 px-3">
        <span className="h-1.5 w-1.5 rounded-full bg-critical/80" />
        <span className="h-1.5 w-1.5 rounded-full bg-caution/80" />
        <span className="h-1.5 w-1.5 rounded-full bg-ok/80" />
        <span className="ml-2 truncate font-mono text-[8px] tracking-[0.04em] text-muted">{label}</span>
        <span className="ml-auto font-mono text-[7px] uppercase tracking-[0.08em] text-muted/60">
          simulated
        </span>
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <img src={src} alt="" className="h-full w-full object-contain object-center" />
      </div>
    </div>
  );
}

function DeckGrid() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 opacity-70">
      <svg width="100%" height="100%">
        <defs>
          <pattern id="deck-grid" width="96" height="96" patternUnits="userSpaceOnUse">
            <path d="M96 0H0V96" fill="none" stroke="#293744" strokeWidth="0.6" opacity="0.35" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#deck-grid)" />
      </svg>
    </div>
  );
}
