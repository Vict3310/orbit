import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { BackgroundGrid } from '../components/BackgroundGrid';
import { OrbitGlyph } from '../components/OrbitMark';
import { SceneGate } from '../components/SceneGate';
import { C, F } from '../styles/brand';

export function FinalScene() {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const line = interpolate(frame, [28, 62], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const tagline = interpolate(frame, [54, 92], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const footer = interpolate(frame, [112, 146], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fadeOut = interpolate(frame, [274, 300], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ background: C.bg, overflow: 'hidden' }}>
      <SceneGate />
      <BackgroundGrid dense />
      <AbsoluteFill style={{ opacity: fadeIn * fadeOut, alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <OrbitGlyph size={170} start={0} draw={false} />
          <div
            style={{
              marginTop: 22,
              fontFamily: F.display,
              fontSize: 54,
              fontWeight: 600,
              letterSpacing: '0.24em',
              color: C.ink,
              lineHeight: 1,
              paddingLeft: '0.24em',
            }}
          >
            ORBIT
          </div>
          <div
            style={{
              marginTop: 12,
              fontFamily: F.mono,
              fontSize: 10,
              letterSpacing: '0.22em',
              color: C.muted,
            }}
          >
            AUTONOMOUS ASTRONAUT HEALTH INTELLIGENCE
          </div>

          <div
            style={{
              marginTop: 38,
              width: 460 * line,
              height: 1,
              background: C.accent,
              opacity: 0.8,
            }}
          />

          <div
            style={{
              marginTop: 36,
              textAlign: 'center',
              opacity: tagline,
              transform: `translateY(${(1 - tagline) * 16}px)`,
            }}
          >
            <div
              style={{
                fontFamily: F.display,
                fontSize: 68,
                fontWeight: 500,
                letterSpacing: '-0.035em',
                lineHeight: 1.06,
                color: C.ink,
              }}
            >
              BEYOND MONITORING.
            </div>
            <div
              style={{
                fontFamily: F.display,
                fontSize: 68,
                fontWeight: 500,
                letterSpacing: '-0.035em',
                lineHeight: 1.06,
                color: C.accent,
              }}
            >
              TOWARD MISSION RESILIENCE.
            </div>
          </div>

          <div
            style={{
              marginTop: 54,
              display: 'flex',
              alignItems: 'center',
              gap: 28,
              opacity: footer,
              fontFamily: F.mono,
              fontSize: 10,
              letterSpacing: '0.16em',
              color: C.muted,
            }}
          >
            <span>NASA SPACE APPS CHALLENGE 2026</span>
            <span style={{ width: 4, height: 4, background: C.accent }} />
            <span>MIVA UNIVERSITY</span>
          </div>
          <div
            style={{
              marginTop: 16,
              fontFamily: F.mono,
              fontSize: 9,
              letterSpacing: '0.13em',
              color: C.muted,
              opacity: footer * 0.7,
            }}
          >
            EDUCATIONAL PROTOTYPE · SYNTHETIC CREW &amp; TELEMETRY · NOT A MEDICAL DEVICE
          </div>

          <div
            style={{
              position: 'absolute',
              left: 120,
              right: 120,
              bottom: 116,
              borderTop: `1px solid ${C.line}`,
              paddingTop: 16,
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 24,
              opacity: footer,
            }}
          >
            {[
              ['MISSION', 'SELENE-4'],
              ['CREW', '3 FICTIONAL ASTRONAUTS'],
              ['HISTORY', '7 SIMULATED DAYS'],
              ['RUNTIME', 'OFFLINE-FIRST'],
            ].map(([label, value]) => (
              <div key={label}>
                <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: '0.16em', color: C.muted }}>
                  {label}
                </div>
                <div
                  style={{
                    marginTop: 7,
                    fontFamily: F.mono,
                    fontSize: 11,
                    letterSpacing: '0.06em',
                    color: C.ink,
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
