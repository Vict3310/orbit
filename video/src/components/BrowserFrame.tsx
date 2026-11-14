import type { CSSProperties, ReactNode } from 'react';
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, F } from '../styles/brand';

export function BrowserFrame({
  image,
  label,
  x = 0,
  y = 0,
  width = 1160,
  height = 652,
  start = 0,
  rotateY = -16,
  rotateX = 4,
  z = 1,
  style,
  children,
}: {
  image: string;
  label: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  start?: number;
  rotateY?: number;
  rotateX?: number;
  z?: number;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entrance = spring({
    frame: frame - start,
    fps,
    config: { damping: 19, mass: 0.9, stiffness: 85 },
  });
  const drift = interpolate(frame, [start, start + 300], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        height,
        zIndex: z,
        transform: `perspective(1600px) translateY(${(1 - entrance) * 90}px) translateX(${(1 - entrance) * 80}px) rotateY(${rotateY * (1 - entrance * 0.35)}deg) rotateX(${rotateX}deg) scale(${0.94 + entrance * 0.06})`,
        transformOrigin: 'center center',
        opacity: entrance,
        ...style,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          border: `1px solid ${C.line}`,
          background: C.surface,
          boxShadow: '0 40px 100px rgba(0,0,0,0.55)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            height: 38,
            flexShrink: 0,
            borderBottom: `1px solid ${C.line}`,
            background: C.surface2,
            display: 'flex',
            alignItems: 'center',
            padding: '0 14px',
            gap: 7,
          }}
        >
          {[0, 1, 2].map((dot) => (
            <span
              key={dot}
              style={{
                width: 7,
                height: 7,
                borderRadius: 7,
                background: dot === 0 ? C.critical : dot === 1 ? C.caution : C.ok,
                opacity: 0.75,
              }}
            />
          ))}
          <div
            style={{
              marginLeft: 14,
              height: 22,
              flex: 1,
              maxWidth: 520,
              border: `1px solid ${C.line}`,
              background: C.bg,
              display: 'flex',
              alignItems: 'center',
              padding: '0 10px',
              fontFamily: F.mono,
              fontSize: 10,
              letterSpacing: '0.06em',
              color: C.muted,
              textTransform: 'lowercase',
            }}
          >
            {label}
          </div>
          <div
            style={{
              marginLeft: 'auto',
              fontFamily: F.mono,
              fontSize: 9,
              letterSpacing: '0.12em',
              color: C.muted,
            }}
          >
            SIMULATED
          </div>
        </div>
        <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
          <Img
            src={staticFile(image)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: `center ${18 + drift * 10}%`,
            }}
          />
          {children}
        </div>
      </div>
    </div>
  );
}
