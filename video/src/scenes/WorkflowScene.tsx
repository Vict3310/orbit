import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { BackgroundGrid } from '../components/BackgroundGrid';
import { KineticText } from '../components/KineticText';
import { SceneGate } from '../components/SceneGate';
import { C, F } from '../styles/brand';

const STAGES = [
  { label: 'MONITOR', detail: 'Synthetic telemetry with units, source and context.' },
  { label: 'DETECT', detail: 'Configurable rules over a personal baseline.' },
  { label: 'EXPLAIN', detail: 'Evidence, window, factors and limitations.' },
  { label: 'ASSESS', detail: 'Structured self-report and reaction time.' },
  { label: 'SIMULATE', detail: 'Two deterministic operational branches.' },
  { label: 'DOCUMENT', detail: 'A printable mission health report.' },
];

const STRIP = [
  'screens/dashboard.png',
  'screens/alerts.png',
  'screens/simulation.png',
  'screens/report.png',
];

export function WorkflowScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const line = interpolate(frame, [50, 240], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const active = Math.min(5, Math.max(0, Math.floor((frame - 90) / 36)));
  const strip = interpolate(frame, [94, 136], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const camera = interpolate(frame, [0, 360], [0, -24], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ background: C.bg, overflow: 'hidden' }}>
      <SceneGate />
      <BackgroundGrid />
      <div style={{ position: 'absolute', inset: 0, transform: `translateX(${camera}px)` }}>
        <KineticText
          text={'ONE CONTINUOUS\nWORKFLOW.'}
          start={12}
          size={84}
          weight={500}
          color={C.ink}
          accentWords={['WORKFLOW.']}
          accentColor={C.accent}
          lineHeight={0.93}
          style={{ position: 'absolute', left: 88, top: 118 }}
        />
        <div
          style={{
            position: 'absolute',
            right: 90,
            top: 154,
            fontFamily: F.mono,
            fontSize: 10,
            letterSpacing: '0.13em',
            color: C.muted,
            textAlign: 'right',
            lineHeight: 1.8,
          }}
        >
          SIX STAGES
          <br />
          ONE AUTHORITATIVE STATE
        </div>

        <div
          style={{
            position: 'absolute',
            left: 88,
            top: 500,
            width: 1700 * line,
            height: 1,
            background: C.accent,
            opacity: 0.75,
          }}
        />

        {STAGES.map((stage, index) => {
          const entrance = spring({
            frame: frame - 56 - index * 16,
            fps,
            config: { damping: 20, mass: 0.8, stiffness: 95 },
          });
          const isActive = index === active;
          const start = 88 + index * 286;
          return (
            <div
              key={stage.label}
              style={{
                position: 'absolute',
                left: start,
                top: 382,
                width: 250,
                opacity: entrance,
                transform: `translateY(${(1 - entrance) * 22}px)`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  fontFamily: F.mono,
                  fontSize: 10,
                  letterSpacing: '0.12em',
                  color: isActive ? C.accent : C.muted,
                }}
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                <span style={{ width: isActive ? 34 : 18, height: 1, background: isActive ? C.accent : C.line }} />
              </div>
              <div
                style={{
                  marginTop: 12,
                  fontFamily: F.display,
                  fontSize: 33,
                  fontWeight: 500,
                  letterSpacing: '-0.02em',
                  color: isActive ? C.accent : C.ink,
                }}
              >
                {stage.label}
              </div>
              <div
                style={{
                  marginTop: 9,
                  maxWidth: 226,
                  fontFamily: F.body,
                  fontSize: 11,
                  lineHeight: 1.55,
                  color: isActive ? C.ink : C.muted,
                }}
              >
                {stage.detail}
              </div>
              <div style={{ marginTop: 14, width: 34, height: 2, background: isActive ? C.accent : C.line }} />
            </div>
          );
        })}

        <div
          style={{
            position: 'absolute',
            left: 88,
            top: 590,
            display: 'flex',
            gap: 18,
            opacity: strip * 0.62,
            transform: `translateY(${(1 - strip) * 18}px)`,
          }}
        >
          {STRIP.map((image, index) => (
            <div
              key={image}
              style={{
                width: 386,
                height: 190,
                border: `1px solid ${C.line}`,
                overflow: 'hidden',
                transform: `translateY(${index % 2 === 0 ? 0 : 14}px)`,
              }}
            >
              <Img
                src={staticFile(image)}
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }}
              />
            </div>
          ))}
        </div>

        <div
          style={{
            position: 'absolute',
            left: 88,
            top: 552,
            fontFamily: F.mono,
            fontSize: 9,
            letterSpacing: '0.14em',
            color: C.muted,
            opacity: strip * 0.7,
          }}
        >
          REAL PRODUCT SURFACES · SIMULATED DATA
        </div>

        <div
          style={{
            position: 'absolute',
            left: 88,
            bottom: 108,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            opacity: strip,
          }}
        >
          <span style={{ width: 6, height: 6, background: C.accent }} />
          <span style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: '0.1em', color: C.muted }}>
            MISSION CONDITIONS → OBSERVATIONS → BASELINE → DETECTION → DECISION → REPORT
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
}
