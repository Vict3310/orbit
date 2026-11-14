import { useEffect, useRef, useState } from 'react';
import { Play, RotateCcw, Timer } from 'lucide-react';
import type { CognitiveTestResult, ReactionTrial } from '../../types/domain';
import { useOrbitStore, profileFor } from '../../store/orbitStore';
import { formatMET } from '../../lib/format';
import { Badge, Button, cn } from '../ui';

type Phase = 'idle' | 'waiting' | 'signal' | 'between' | 'done';

const TRIAL_COUNT = 5;
const SIGNAL_TIMEOUT_MS = 1500;

export function ReactionTest() {
  const profile = useOrbitStore((s) => profileFor(s));
  const [phase, setPhase] = useState<Phase>('idle');
  const [trials, setTrials] = useState<ReactionTrial[]>([]);
  const [saved, setSaved] = useState<CognitiveTestResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const phaseRef = useRef<Phase>('idle');
  const trialsRef = useRef<ReactionTrial[]>([]);
  const indexRef = useRef(0);
  const signalAtRef = useRef(0);
  const delayRef = useRef(0);
  const startedAtRef = useRef(0);
  const timersRef = useRef<number[]>([]);
  const pressRef = useRef<() => void>(() => {});

  const clearTimers = () => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  };

  const setPhaseSafe = (next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  };

  const addTimer = (callback: () => void, delay: number) => {
    const timer = window.setTimeout(callback, delay);
    timersRef.current.push(timer);
  };

  const finish = () => {
    clearTimers();
    const all = trialsRef.current;
    const valid = all.filter(
      (trial): trial is ReactionTrial & { reactionMs: number } => trial.reactionMs !== null,
    );
    setTrials([...all]);
    setProgress(TRIAL_COUNT);
    setPhaseSafe('done');

    if (valid.length === 0) {
      setMessage('No valid responses were recorded. Run the check again when ready.');
      return;
    }

    const times = valid.map((trial) => trial.reactionMs).sort((a, b) => a - b);
    const middle = Math.floor(times.length / 2);
    const median = Math.round(
      times.length % 2 === 0 ? (times[middle - 1] + times[middle]) / 2 : times[middle],
    );
    const best = Math.round(Math.min(...times));
    const missed = all.filter((trial) => trial.missed).length;
    const falseStarts = all.filter((trial) => trial.falseStart).length;
    const result = useOrbitStore.getState().recordCognitiveTest({
      trials: all,
      medianMs: median,
      bestMs: best,
      missed,
      falseStarts,
      durationMs: Math.round(performance.now() - startedAtRef.current),
    });
    setSaved(result);
  };

  const between = (nextIndex: number) => {
    clearTimers();
    setPhaseSafe('between');
    addTimer(() => {
      if (nextIndex >= TRIAL_COUNT) finish();
      else startTrial(nextIndex);
    }, 700);
  };

  const startTrial = (index: number) => {
    clearTimers();
    indexRef.current = index;
    setProgress(index);
    setMessage(null);
    setPhaseSafe('waiting');
    const delay = 1200 + Math.floor(Math.random() * 1800);
    delayRef.current = delay;
    addTimer(() => {
      signalAtRef.current = performance.now();
      setPhaseSafe('signal');
      addTimer(() => {
        const trial: ReactionTrial = {
          index,
          delayMs: delay,
          reactionMs: null,
          falseStart: false,
          missed: true,
        };
        trialsRef.current = [...trialsRef.current, trial];
        setTrials([...trialsRef.current]);
        between(index + 1);
      }, SIGNAL_TIMEOUT_MS);
    }, delay);
  };

  const start = () => {
    clearTimers();
    trialsRef.current = [];
    setTrials([]);
    setSaved(null);
    setMessage(null);
    setProgress(0);
    startedAtRef.current = performance.now();
    startTrial(0);
  };

  const press = () => {
    const current = phaseRef.current;
    if (current === 'waiting') {
      clearTimers();
      const trial: ReactionTrial = {
        index: indexRef.current,
        delayMs: delayRef.current,
        reactionMs: null,
        falseStart: true,
        missed: false,
      };
      trialsRef.current = [...trialsRef.current, trial];
      setTrials([...trialsRef.current]);
      between(indexRef.current + 1);
      return;
    }
    if (current === 'signal') {
      const reactionMs = Math.max(1, Math.round(performance.now() - signalAtRef.current));
      clearTimers();
      const trial: ReactionTrial = {
        index: indexRef.current,
        delayMs: delayRef.current,
        reactionMs,
        falseStart: false,
        missed: false,
      };
      trialsRef.current = [...trialsRef.current, trial];
      setTrials([...trialsRef.current]);
      between(indexRef.current + 1);
    }
  };
  pressRef.current = press;

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.code !== 'Space' && event.code !== 'Enter') return;
      if (phaseRef.current === 'waiting' || phaseRef.current === 'signal') {
        event.preventDefault();
        pressRef.current();
      }
    };
    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
      clearTimers();
    };
  }, []);

  const active = phase === 'waiting' || phase === 'signal';
  const validTrials = trials.filter((trial) => trial.reactionMs !== null);
  const median =
    validTrials.length > 0
      ? [...validTrials].map((trial) => trial.reactionMs as number).sort((a, b) => a - b)[
          Math.floor(validTrials.length / 2)
        ]
      : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Timer size={14} className="text-accent" />
          <span className="label text-ink">Reaction-time check</span>
        </div>
        <Badge tone="muted">EDUCATIONAL · NON-DIAGNOSTIC</Badge>
      </div>

      <p className="text-[11px] leading-5 text-muted">
        Five trials. Wait for the panel to turn lime, then respond as quickly as possible with a
        click, tap, Space or Enter. Delays are randomised so the signal cannot be anticipated.
      </p>

      <div
        role="button"
        tabIndex={0}
        aria-label={
          phase === 'signal'
            ? 'Respond now'
            : phase === 'waiting'
              ? 'Wait for the signal'
              : 'Reaction-time test surface'
        }
        onClick={() => {
          if (active) press();
        }}
        onKeyDown={(event) => {
          if ((event.key === 'Enter' || event.key === ' ') && active) {
            event.preventDefault();
            press();
          }
        }}
        className={cn(
          'flex h-52 select-none flex-col items-center justify-center border text-center outline-none transition-colors',
          phase === 'signal'
            ? 'border-accent bg-accent text-bg'
            : phase === 'waiting'
              ? 'border-line bg-bg text-muted'
              : phase === 'between'
                ? 'border-line bg-surface2 text-muted'
                : 'border-line bg-bg text-muted',
          active ? 'cursor-pointer' : 'cursor-default',
        )}
      >
        {phase === 'idle' && (
          <>
            <span className="font-display text-lg text-ink">Visual response check</span>
            <span className="mt-1 font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
              5 trials · randomised delay
            </span>
            <span className="mt-4 font-mono text-[10px] uppercase tracking-[0.08em] text-accent">
              Press “Begin check” below
            </span>
          </>
        )}
        {phase === 'waiting' && (
          <>
            <span className="font-mono text-[28px] tracking-[0.2em] text-ink">HOLD</span>
            <span className="mt-2 font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
              Trial {progress + 1} of {TRIAL_COUNT} · wait for lime
            </span>
          </>
        )}
        {phase === 'signal' && (
          <>
            <span className="font-display text-[34px] font-semibold tracking-[0.06em]">RESPOND</span>
            <span className="mt-2 font-mono text-[9px] uppercase tracking-[0.1em] text-bg/70">
              Click · tap · space
            </span>
          </>
        )}
        {phase === 'between' && (
          <>
            <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-muted">
              Preparing next trial
            </span>
            <span className="mt-2 font-mono text-[9px] text-muted/60">Reset your attention</span>
          </>
        )}
        {phase === 'done' && (
          <div className="w-full px-4">
            {saved ? (
              <>
                <div className="font-mono text-3xl text-ink numeric">{saved.medianMs} ms</div>
                <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
                  median · {saved.changePct > 0 ? '+' : ''}
                  {saved.changePct.toFixed(1)}% vs personal baseline
                </div>
                <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 font-mono text-[9px] uppercase tracking-[0.05em] text-muted">
                  <span>best {saved.bestMs} ms</span>
                  <span>{saved.missed} missed</span>
                  <span>{saved.falseStarts} false starts</span>
                  <span>{formatMET(saved.missionMinute)}</span>
                </div>
                <p className="mt-3 text-[9px] leading-4 text-muted/70">
                  Saved to {profile.name}’s local history. Browser timing, input hardware and attention
                  affect results.
                </p>
              </>
            ) : (
              <p className="mx-auto max-w-xs text-[11px] leading-5 text-muted">{message}</p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant={phase === 'idle' ? 'primary' : 'secondary'}
          onClick={start}
          disabled={phase === 'waiting' || phase === 'signal'}
        >
          {phase === 'idle' ? <Play size={13} /> : <RotateCcw size={13} />}
          {phase === 'idle' ? 'Begin check' : 'Run again'}
        </Button>
        <span className="font-mono text-[8px] uppercase tracking-[0.05em] text-muted">
          {validTrials.length}/{TRIAL_COUNT} valid trials
          {median !== null ? ` · median ${median} ms` : ''}
        </span>
      </div>

      <div className="flex gap-1" aria-hidden="true">
        {Array.from({ length: TRIAL_COUNT }).map((_, index) => {
          const trial = trials[index];
          return (
            <span
              key={index}
              className={cn(
                'h-1 flex-1',
                trial
                  ? trial.missed || trial.falseStart
                    ? 'bg-critical'
                    : 'bg-ok'
                  : 'bg-surface2',
              )}
            />
          );
        })}
      </div>

      <p className="text-[9px] leading-4 text-muted/70">
        This is not a clinically validated cognitive assessment. A single result should prompt a
        repeat measurement and contextual review, not a conclusion.
      </p>
    </div>
  );
}
