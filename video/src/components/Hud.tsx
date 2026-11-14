import { useCurrentFrame, useVideoConfig } from 'remotion';
import { C, F, SCENES, TOTAL_FRAMES } from '../styles/brand';

export function Hud() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const seconds = Math.floor(frame / fps);
  const timecode = `00:${String(seconds).padStart(2, '0')}:${String(frame % fps).padStart(2, '0')}`;
  const active = SCENES.find((scene) => frame >= scene.from && frame < scene.from + scene.duration);
  const progress = frame / TOTAL_FRAMES;

  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: 30,
          left: 46,
          right: 46,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 50,
          pointerEvents: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 6, height: 6, background: C.accent }} />
          <span
            style={{
              fontFamily: F.mono,
              fontSize: 11,
              letterSpacing: '0.2em',
              color: C.ink,
            }}
          >
            ORBIT / LAUNCH FILM
          </span>
          <span
            style={{
              fontFamily: F.mono,
              fontSize: 10,
              letterSpacing: '0.13em',
              color: C.muted,
            }}
          >
            {active?.label ?? 'RESILIENCE'}
          </span>
        </div>
        <div
          style={{
            fontFamily: F.mono,
            fontSize: 10,
            letterSpacing: '0.16em',
            color: C.muted,
          }}
        >
          NASA SPACE APPS 2026 · MIVA UNIVERSITY
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 46,
          right: 46,
          bottom: 26,
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          zIndex: 50,
          pointerEvents: 'none',
        }}
      >
        <span style={{ fontFamily: F.mono, fontSize: 10, color: C.ink, letterSpacing: '0.08em' }}>
          {timecode}
        </span>
        <div style={{ flex: 1, height: 1, background: C.line, position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              width: `${progress * 100}%`,
              background: C.accent,
            }}
          />
          {SCENES.map((scene) => (
            <div
              key={scene.label}
              style={{
                position: 'absolute',
                left: `${(scene.from / TOTAL_FRAMES) * 100}%`,
                top: -2,
                width: 1,
                height: 5,
                background: C.muted,
                opacity: 0.55,
              }}
            />
          ))}
        </div>
        <span
          style={{
            fontFamily: F.mono,
            fontSize: 9,
            letterSpacing: '0.12em',
            color: C.muted,
          }}
        >
          SIMULATED · EDUCATIONAL
        </span>
      </div>
    </>
  );
}
