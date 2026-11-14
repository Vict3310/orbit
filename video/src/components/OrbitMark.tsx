import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, F } from '../styles/brand';

export function OrbitGlyph({
  size = 220,
  start = 0,
  draw = true,
  showWordmark = false,
}: {
  size?: number;
  start?: number;
  draw?: boolean;
  showWordmark?: boolean;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - start;
  const entrance = spring({
    frame: local,
    fps,
    config: { damping: 15, mass: 0.9, stiffness: 90 },
  });
  const ringProgress = draw
    ? interpolate(local, [0, 38], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : 1;
  const circumference = 2 * Math.PI * 88;
  const rotate = local * 0.42;
  const satelliteAngle = ((local * 1.15 - 40) * Math.PI) / 180;
  const satelliteX = 120 + Math.cos(satelliteAngle) * 88;
  const satelliteY = 120 + Math.sin(satelliteAngle) * 88;
  const coreScale = 0.7 + entrance * 0.3;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: size * 0.05,
        transform: `scale(${0.85 + entrance * 0.15})`,
        opacity: entrance,
      }}
    >
      <svg width={size} height={size} viewBox="0 0 240 240" role="img" aria-label="ORBIT orbital mark">
        <rect x="1" y="1" width="238" height="238" fill={C.bg} stroke={C.line} strokeWidth="1" />
        <g transform={`rotate(${rotate} 120 120)`}>
          <circle
            cx="120"
            cy="120"
            r="88"
            fill="none"
            stroke={C.accent}
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - ringProgress)}
          />
        </g>
        <circle cx="120" cy="120" r="31" fill={C.surface} stroke={C.line} strokeWidth="1.5" />
        <circle
          cx="120"
          cy="120"
          r={10 * coreScale}
          fill={C.accent}
          opacity={interpolate(local, [18, 42], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })}
        />
        <circle
          cx={satelliteX}
          cy={satelliteY}
          r="5.5"
          fill={C.ink}
          opacity={interpolate(local, [28, 46], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })}
        />
        <path d="M20 44h16M28 36v16M204 196h16M212 188v16" stroke={C.line} strokeWidth="1.5" />
      </svg>
      {showWordmark && (
        <div
          style={{
            fontFamily: F.display,
            fontSize: size * 0.3,
            fontWeight: 600,
            letterSpacing: '0.16em',
            color: C.ink,
            lineHeight: 1,
          }}
        >
          ORBIT
        </div>
      )}
    </div>
  );
}
