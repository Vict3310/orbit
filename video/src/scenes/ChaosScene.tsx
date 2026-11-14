import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { BackgroundGrid } from '../components/BackgroundGrid';
import { Fragments } from '../components/Fragments';
import { KineticText } from '../components/KineticText';
import { SceneGate } from '../components/SceneGate';
import { C, F } from '../styles/brand';

export function ChaosScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const explosion = spring({
    frame: frame - 78,
    fps,
    config: { damping: 19, mass: 1.2, stiffness: 52 },
    durationInFrames: 90,
  });
  const dim = interpolate(frame, [244, 292], [0, 0.72], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const titleExit = interpolate(frame, [230, 258], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const ekgDraw = interpolate(frame, [8, 62], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const lineSweep = interpolate(frame, [236, 276], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <SceneGate />
      <BackgroundGrid />
      <div style={{ opacity: 1 - dim }}>
        <Fragments
          spread={explosion}
          opacity={interpolate(frame, [72, 118], [0, 0.92], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })}
        />
      </div>

      {/* A single physiological trace, pulled apart by the noise. */}
      <svg
        width="1920"
        height="300"
        viewBox="0 0 1920 300"
        style={{ position: 'absolute', top: 390, left: 0, opacity: 0.34 * (1 - dim) }}
      >
        <path
          d="M0 170 H400 L430 170 L448 128 L468 224 L492 92 L516 206 L540 170 H790 L812 170 L830 146 L850 196 L870 112 L894 212 L912 170 H1260 L1288 170 L1310 120 L1334 230 L1358 80 L1384 210 L1408 170 H1920"
          fill="none"
          stroke={C.accent}
          strokeWidth={1.5}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={ekgDraw}
        />
      </svg>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 1 - titleExit,
          transform: `scale(${1 + explosion * 0.025})`,
        }}
      >
        <KineticText
          text="MONITORING ISN'T"
          start={6}
          size={104}
          weight={500}
          color={C.ink}
          align="center"
          stagger={4}
          letterSpacing="-0.045em"
        />
        <KineticText
          text="UNDERSTANDING."
          start={24}
          size={104}
          weight={600}
          color={C.accent}
          align="center"
          stagger={3}
          letterSpacing="-0.045em"
        />
        <div
          style={{
            marginTop: 28,
            fontFamily: F.mono,
            fontSize: 14,
            letterSpacing: '0.18em',
            color: C.muted,
            opacity: interpolate(frame, [52, 72], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        >
          ASTRONAUT HEALTH IS NOT A SINGLE NUMBER
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 120,
          bottom: 110,
          display: 'flex',
          gap: 26,
          fontFamily: F.mono,
          fontSize: 10,
          letterSpacing: '0.13em',
          color: C.muted,
          opacity: interpolate(frame, [20, 40], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }) * (1 - dim),
        }}
      >
        <span>3 CREW</span>
        <span>14 CHANNELS</span>
        <span>7 SIMULATED DAYS</span>
        <span style={{ color: C.accent }}>ALL SYNTHETIC</span>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 540,
          height: 2,
          background: C.ink,
          transform: `scaleX(${lineSweep})`,
          transformOrigin: 'left center',
          opacity: lineSweep > 0 ? 0.65 : 0,
        }}
      />
    </AbsoluteFill>
  );
}
