import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { BackgroundGrid } from '../components/BackgroundGrid';
import { BrowserFrame } from '../components/BrowserFrame';
import { Chip } from '../components/Cards';
import { KineticText } from '../components/KineticText';
import { LineGraph } from '../components/LineGraph';
import { SceneGate } from '../components/SceneGate';
import { C, F } from '../styles/brand';

export function DecisionScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const card = spring({
    frame: frame - 120,
    fps,
    config: { damping: 20, mass: 0.9, stiffness: 80 },
  });
  const chip = interpolate(frame, [236, 260], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const push = interpolate(frame, [0, 420], [1, 1.035], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ background: C.bg, overflow: 'hidden' }}>
      <SceneGate />
      <BackgroundGrid />
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${push})`, transformOrigin: '52% 48%' }}>
        <KineticText
          text={'SIMULATE\nTHE\nDECISION.'}
          start={12}
          size={82}
          weight={500}
          color={C.ink}
          accentWords={['DECISION.']}
          accentColor={C.accent}
          lineHeight={0.93}
          style={{ position: 'absolute', left: 86, top: 124 }}
        />

        <BrowserFrame
          image="screens/simulation.png"
          label="orbit.local / simulation"
          x={548}
          y={214}
          width={1290}
          height={690}
          start={22}
          rotateY={-7}
          rotateX={2}
          z={2}
        >
          <Chip tone={C.caution} start={150} x={22} y={20}>
            SCENARIO 01 · FATIGUE
          </Chip>
        </BrowserFrame>

        <div
          style={{
            position: 'absolute',
            left: 82,
            top: 432,
            width: 420,
            border: `1px solid ${C.line}`,
            background: C.surface,
            padding: 18,
            zIndex: 20,
            opacity: card,
            transform: `translateY(${(1 - card) * 26}px)`,
            boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: '0.14em', color: C.ink }}>
              PROJECTION · 12 H
            </span>
            <span style={{ fontFamily: F.mono, fontSize: 9, color: C.muted }}>FATIGUE /100</span>
          </div>

          <div style={{ marginTop: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: '0.1em', color: C.muted }}>
                AS PLANNED
              </span>
              <span style={{ fontFamily: F.mono, fontSize: 13, color: C.critical }}>84</span>
            </div>
            <LineGraph
              values={[42, 47, 53, 58, 64, 70, 76, 80, 84]}
              width={380}
              height={74}
              color={C.muted}
              start={135}
              showAxis={false}
              strokeWidth={2}
            />
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: '0.1em', color: C.muted }}>
                WITH REST
              </span>
              <span style={{ fontFamily: F.mono, fontSize: 13, color: C.accent }}>58</span>
            </div>
            <LineGraph
              values={[42, 46, 51, 53, 49, 45, 42, 44, 47]}
              width={380}
              height={74}
              color={C.accent}
              start={156}
              showAxis={false}
              strokeWidth={2.4}
            />
          </div>

          <div
            style={{
              marginTop: 14,
              borderTop: `1px solid ${C.line}`,
              paddingTop: 11,
              fontFamily: F.body,
              fontSize: 10,
              lineHeight: 1.55,
              color: C.muted,
            }}
          >
            Same state. Two deterministic branches. A model illustration, not a physiological forecast.
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            left: 560,
            top: 912,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            border: `1px solid ${C.accent}`,
            background: C.accent,
            color: C.bg,
            padding: '11px 16px',
            fontFamily: F.mono,
            fontSize: 11,
            letterSpacing: '0.1em',
            opacity: chip,
            transform: `translateY(${(1 - chip) * 12}px)`,
          }}
        >
          <span style={{ width: 6, height: 6, background: C.bg }} />
          SCHEDULE ADDITIONAL REST · 10 H RECOVERY + 8 H SLEEP
        </div>

        <div
          style={{
            position: 'absolute',
            right: 88,
            top: 930,
            fontFamily: F.mono,
            fontSize: 10,
            letterSpacing: '0.11em',
            color: C.muted,
            opacity: chip,
          }}
        >
          DECISION RECORDED · CONSEQUENCE MODELLED
        </div>
      </div>
    </AbsoluteFill>
  );
}
