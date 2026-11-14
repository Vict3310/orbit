import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { BackgroundGrid } from '../components/BackgroundGrid';
import { BrowserFrame } from '../components/BrowserFrame';
import { Chip, StatCard } from '../components/Cards';
import { KineticText } from '../components/KineticText';
import { LineGraph } from '../components/LineGraph';
import { SceneGate } from '../components/SceneGate';
import { C, F } from '../styles/brand';

export function ContextScene() {
  const frame = useCurrentFrame();
  const camera = interpolate(frame, [0, 360], [0, 18], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const caption = interpolate(frame, [250, 280], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ background: C.bg, overflow: 'hidden' }}>
      <SceneGate />
      <BackgroundGrid />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translateX(${-camera}px) scale(${1 + camera * 0.0008}) `,
          transformOrigin: 'center',
        }}
      >
        <KineticText
          text={'FROM SIGNALS\nTO CONTEXT.'}
          start={14}
          size={90}
          weight={500}
          color={C.ink}
          accentWords={['CONTEXT.']}
          accentColor={C.accent}
          lineHeight={0.94}
          style={{ position: 'absolute', left: 86, top: 150, width: 580 }}
        />
        <div
          style={{
            position: 'absolute',
            left: 90,
            top: 380,
            fontFamily: F.body,
            fontSize: 15,
            lineHeight: 1.7,
            color: C.muted,
            width: 430,
            opacity: interpolate(frame, [70, 96], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        >
          A heart rate is only a number until it is compared with this crew member&apos;s own
          baseline, recent sleep and current workload.
        </div>

        <StatCard
          label="RESTING HR"
          value="64"
          unit="bpm"
          note="Personal baseline · 72 h rolling"
          start={78}
          x={90}
          y={500}
          width={250}
        >
          <div style={{ marginTop: 14 }}>
            <LineGraph values={[62, 63, 64, 63, 64, 65, 64, 64, 63, 64]} width={212} height={52} showAxis={false} start={86} strokeWidth={2} />
          </div>
        </StatCard>
        <StatCard
          label="SLEEP / 24 H"
          value="7.8"
          unit="hours"
          note="Synthetic schedule · 8 h target"
          start={96}
          x={356}
          y={500}
          width={222}
        />
        <StatCard
          label="FATIGUE"
          value="22"
          unit="/100"
          note="Demonstration composite"
          start={114}
          x={90}
          y={690}
          width={250}
          accent
        />
        <div
          style={{
            position: 'absolute',
            left: 360,
            top: 690,
            width: 218,
            border: `1px solid ${C.line}`,
            background: C.surface,
            padding: 16,
            opacity: interpolate(frame, [128, 150], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        >
          <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: '0.14em', color: C.muted }}>
            DEVIATION
          </div>
          <div style={{ marginTop: 8, fontFamily: F.mono, fontSize: 26, color: C.ok }}>+0.0%</div>
          <div style={{ marginTop: 6, fontFamily: F.body, fontSize: 10, color: C.muted }}>
            Within band · no alert
          </div>
        </div>

        <BrowserFrame
          image="screens/dashboard.png"
          label="orbit.local / dashboard"
          x={700}
          y={180}
          width={1120}
          height={650}
          start={22}
          rotateY={-17}
          rotateX={3}
          z={5}
        >
          <Chip tone={C.accent} start={110} x={24} y={20}>
            SIMULATED TELEMETRY
          </Chip>
        </BrowserFrame>

        <div
          style={{
            position: 'absolute',
            left: 700,
            top: 862,
            fontFamily: F.mono,
            fontSize: 11,
            letterSpacing: '0.08em',
            color: C.muted,
            opacity: caption,
          }}
        >
          SAME NUMBER. DIFFERENT MEANING. <span style={{ color: C.ink }}>PERSONAL BASELINE APPLIED.</span>
        </div>
      </div>
    </AbsoluteFill>
  );
}
