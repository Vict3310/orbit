import { interpolate, useCurrentFrame } from 'remotion';
import { C, F } from '../styles/brand';

const FRAGMENT_TEXTS = [
  'HR 82',
  'SpO₂ 97%',
  'SLEEP 4.2 h',
  'RHR +18',
  'CO₂ 3,947',
  'FATIGUE 57',
  'HRV 42',
  'RR 14',
  'DOSE 0.95',
  'RT 313 ms',
  'BASELINE 64',
  'Δ +28%',
  'RULE 3/3',
  'D014 06:00',
  'STRESS 66',
  'MOOD 52',
  '0.96 mSv',
  'SLEEP DEBT 3.8',
  'ALERT',
  'OBSERVATION',
  'ECG',
  'NASA HRP',
  'SIMULATED',
  '∫ f(t) dt',
  'Σ Δx',
  '?',
  'RHR 64',
  'SpO₂ 98%',
  'TEMP 22.4',
  'O₂ 20.9%',
  'EVA 04:12',
  'SHELTER',
  'CO₂ 6,000',
  'Δ 24h',
  'BASELINE',
  'EVIDENCE',
  'LIMIT',
  '129 bpm',
  '97.1%',
  '22:30',
];

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Fragment {
  x: number;
  y: number;
  depth: number;
  size: number;
  rotation: number;
  text: string;
  kind: 'text' | 'box' | 'circle' | 'line';
  tone: string;
}

const random = mulberry32(20260413);
const FRAGMENTS: Fragment[] = Array.from({ length: 118 }, (_, index) => {
  const depth = 0.35 + random() * 1.2;
  const kindRoll = random();
  const kind: Fragment['kind'] =
    kindRoll < 0.58 ? 'text' : kindRoll < 0.72 ? 'box' : kindRoll < 0.86 ? 'circle' : 'line';
  const toneRoll = random();
  return {
    x: random() * 2 - 1,
    y: random() * 2 - 1,
    depth,
    size: (10 + random() * 16) * (0.7 + depth * 0.5),
    rotation: (random() * 2 - 1) * 24,
    text: FRAGMENT_TEXTS[index % FRAGMENT_TEXTS.length],
    kind,
    tone: toneRoll < 0.12 ? C.accent : toneRoll < 0.22 ? C.caution : toneRoll < 0.3 ? C.critical : C.muted,
  };
});

export function Fragments({
  spread,
  opacity = 1,
  frameOffset = 0,
}: {
  spread: number;
  opacity?: number;
  frameOffset?: number;
}) {
  const frame = useCurrentFrame() + frameOffset;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', opacity }}>
      {FRAGMENTS.map((fragment, index) => {
        const driftX = Math.sin(frame * 0.011 + index) * 10;
        const driftY = Math.cos(frame * 0.009 + index * 1.7) * 8;
        const x = fragment.x * 980 * fragment.depth * spread + driftX;
        const y = fragment.y * 520 * fragment.depth * spread + driftY;
        const rotation = fragment.rotation * spread + Math.sin(frame * 0.006 + index) * 2;
        const scale = 0.55 + fragment.depth * 0.65;
        const base = {
          position: 'absolute' as const,
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${scale})`,
          opacity: interpolate(spread, [0, 0.35, 1], [0, 0.85, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
          zIndex: Math.round(fragment.depth * 10),
        };

        if (fragment.kind === 'box') {
          return (
            <div
              key={index}
              style={{
                ...base,
                width: 22 + fragment.size * 2.4,
                height: 14 + fragment.size,
                border: `1px solid ${fragment.tone}`,
                background: C.surface2,
                opacity: base.opacity * 0.55,
              }}
            />
          );
        }
        if (fragment.kind === 'circle') {
          return (
            <div
              key={index}
              style={{
                ...base,
                width: 8 + fragment.size * 0.8,
                height: 8 + fragment.size * 0.8,
                borderRadius: '50%',
                border: `1px solid ${fragment.tone}`,
                opacity: base.opacity * 0.6,
              }}
            />
          );
        }
        if (fragment.kind === 'line') {
          return (
            <div
              key={index}
              style={{
                ...base,
                width: 40 + fragment.size * 3,
                height: 1,
                background: fragment.tone,
                opacity: base.opacity * 0.35,
              }}
            />
          );
        }
        return (
          <div
            key={index}
            style={{
              ...base,
              fontFamily: F.mono,
              fontSize: fragment.size,
              letterSpacing: '0.04em',
              color: fragment.tone,
              whiteSpace: 'nowrap',
              opacity: base.opacity * (fragment.depth > 0.9 ? 0.8 : 0.5),
            }}
          >
            {fragment.text}
          </div>
        );
      })}
    </div>
  );
}
