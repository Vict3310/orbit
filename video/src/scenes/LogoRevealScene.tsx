import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { BackgroundGrid } from '../components/BackgroundGrid';
import { Fragments } from '../components/Fragments';
import { KineticText } from '../components/KineticText';
import { OrbitGlyph } from '../components/OrbitMark';
import { SceneGate } from '../components/SceneGate';
import { C, F } from '../styles/brand';

export function LogoRevealScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const convergence = interpolate(frame, [6, 63], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fragmentOpacity = interpolate(frame, [52, 78], [0.9, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const logoEntrance = spring({
    frame: frame - 56,
    fps,
    config: { damping: 16, mass: 1, stiffness: 75 },
  });
  const tagline = interpolate(frame, [188, 212], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const card = interpolate(frame, [214, 236], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ background: C.bg, overflow: 'hidden' }}>
      <SceneGate />
      <BackgroundGrid dense />
      <Fragments spread={convergence} opacity={fragmentOpacity} frameOffset={40} />

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 92,
          display: 'flex',
          justifyContent: 'center',
          opacity: logoEntrance,
          transform: `translateY(${(1 - logoEntrance) * -24}px)`,
        }}
      >
        <OrbitGlyph size={210} start={56} />
      </div>

      <div style={{ position: 'absolute', left: 0, right: 0, top: 380, textAlign: 'center' }}>
        <KineticText
          text="MEET ORBIT"
          start={78}
          size={142}
          weight={600}
          color={C.ink}
          accentColor={C.ink}
          align="center"
          mode="char"
          stagger={2.1}
          letterSpacing="-0.055em"
        />
        <div
          style={{
            marginTop: 24,
            fontFamily: F.mono,
            fontSize: 16,
            letterSpacing: '0.24em',
            color: C.muted,
            opacity: interpolate(frame, [118, 140], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
            transform: `translateY(${interpolate(frame, [118, 140], [8, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })}px)`,
          }}
        >
          AUTONOMOUS ASTRONAUT HEALTH INTELLIGENCE
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 690,
          display: 'flex',
          justifyContent: 'center',
          opacity: tagline,
          transform: `translateY(${(1 - tagline) * 18}px)`,
        }}
      >
        <div
          style={{
            borderTop: `1px solid ${C.line}`,
            borderBottom: `1px solid ${C.line}`,
            padding: '16px 34px',
            fontFamily: F.display,
            fontSize: 26,
            fontWeight: 500,
            letterSpacing: '0.06em',
            color: C.ink,
          }}
        >
          BEYOND MONITORING. <span style={{ color: C.accent }}>TOWARD MISSION RESILIENCE.</span>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 120,
          right: 120,
          bottom: 90,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          opacity: card,
          transform: `translateY(${(1 - card) * 14}px)`,
        }}
      >
        {[
          ['MISSION', 'SELENE-4 / LUNAR OUTPOST'],
          ['CREW', '3 FICTIONAL ASTRONAUTS'],
          ['MODEL', 'DETERMINISTIC · SEEDED'],
          ['CHALLENGE', 'NASA SPACE APPS 2026'],
        ].map(([label, value], index) => (
          <div
            key={label}
            style={{
              borderLeft: `1px solid ${index === 0 ? C.accent : C.line}`,
              paddingLeft: 14,
              minWidth: 250,
            }}
          >
            <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: '0.16em', color: C.muted }}>
              {label}
            </div>
            <div
              style={{
                marginTop: 7,
                fontFamily: F.mono,
                fontSize: 12,
                letterSpacing: '0.06em',
                color: C.ink,
              }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
}
