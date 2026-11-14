import { useCurrentFrame } from 'remotion';
import { C, F } from '../styles/brand';

export function BackgroundGrid({ dense = false }: { dense?: boolean }) {
  const frame = useCurrentFrame();
  const step = dense ? 48 : 80;
  const verticals = Array.from({ length: Math.ceil(1920 / step) + 1 });
  const horizontals = Array.from({ length: Math.ceil(1080 / step) + 1 });

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <svg width="1920" height="1080" viewBox="0 0 1920 1080">
        {verticals.map((_, index) => (
          <line
            key={`v-${index}`}
            x1={index * step}
            x2={index * step}
            y1={0}
            y2={1080}
            stroke={C.line}
            strokeWidth={1}
            opacity={index % 4 === 0 ? 0.42 : 0.16}
          />
        ))}
        {horizontals.map((_, index) => (
          <line
            key={`h-${index}`}
            x1={0}
            x2={1920}
            y1={index * step}
            y2={index * step}
            stroke={C.line}
            strokeWidth={1}
            opacity={index % 4 === 0 ? 0.42 : 0.16}
          />
        ))}
        {[
          [120, 160],
          [1800, 160],
          [120, 920],
          [1800, 920],
        ].map(([x, y], index) => (
          <g key={index}>
            <path d={`M${x - 7} ${y}h14M${x} ${y - 7}v14`} stroke={C.muted} strokeWidth={1} opacity={0.4} />
          </g>
        ))}
        <text x={120} y={1050} fill={C.muted} opacity={0.35} fontFamily={F.mono} fontSize={9} letterSpacing="0.18em">
          LUNAR SOUTH POLAR REGION · SELENE-4 · SIMULATED
        </text>
        <text x={1600} y={1050} fill={C.muted} opacity={0.35} fontFamily={F.mono} fontSize={9} letterSpacing="0.18em">
          FRAME {String(frame).padStart(5, '0')}
        </text>
      </svg>
    </div>
  );
}
