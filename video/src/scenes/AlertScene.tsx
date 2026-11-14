import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { BackgroundGrid } from '../components/BackgroundGrid';
import { BrowserFrame } from '../components/BrowserFrame';
import { EvidenceCard } from '../components/Cards';
import { KineticText } from '../components/KineticText';
import { SceneGate } from '../components/SceneGate';
import { C, F } from '../styles/brand';

export function AlertScene() {
  const frame = useCurrentFrame();
  const push = interpolate(frame, [0, 360], [1.02, 1.08], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const note = interpolate(frame, [250, 280], [0, 1], {
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
          transform: `scale(${push})`,
          transformOrigin: '58% 48%',
        }}
      >
        <BrowserFrame
          image="screens/alerts.png"
          label="orbit.local / alerts"
          x={-110}
          y={188}
          width={1130}
          height={636}
          start={8}
          rotateY={15}
          rotateX={3}
          z={2}
        />

        <KineticText
          text={'EVERY\nALERT\nEXPLAINS\nITSELF.'}
          start={22}
          size={94}
          weight={500}
          color={C.ink}
          accentWords={['EXPLAINS']}
          accentColor={C.accent}
          lineHeight={0.87}
          style={{ position: 'absolute', right: 76, top: 142, width: 690 }}
        />

        <div
          style={{
            position: 'absolute',
            right: 78,
            top: 512,
            width: 640,
            fontFamily: F.body,
            fontSize: 13,
            lineHeight: 1.7,
            color: C.muted,
            opacity: interpolate(frame, [140, 168], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        >
          Triggering observations. Personal baseline. Exact rule. Time window. Mission context.
          Contributing factors. Data limitations. An assessment path.
        </div>

        <EvidenceCard start={120} />

        <div
          style={{
            position: 'absolute',
            left: 104,
            top: 858,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            opacity: note,
          }}
        >
          <span style={{ width: 6, height: 6, background: C.caution }} />
          <span
            style={{
              fontFamily: F.mono,
              fontSize: 11,
              letterSpacing: '0.12em',
              color: C.muted,
            }}
          >
            DETERMINISTIC RULE · LOCAL ENGINE · NOT A DIAGNOSIS
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
}
