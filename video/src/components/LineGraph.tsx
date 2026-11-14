import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, F } from '../styles/brand';

export function LineGraph({
  width = 400,
  height = 150,
  values,
  color = C.accent,
  baseline,
  start = 0,
  label,
  showAxis = true,
  strokeWidth = 3,
}: {
  width?: number;
  height?: number;
  values: number[];
  color?: string;
  baseline?: number;
  start?: number;
  label?: string;
  showAxis?: boolean;
  strokeWidth?: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entrance = spring({
    frame: frame - start,
    fps,
    config: { damping: 22, mass: 0.8, stiffness: 80 },
  });
  const draw = interpolate(frame, [start + 6, start + 46], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const min = Math.min(...values, baseline ?? Infinity) - 8;
  const max = Math.max(...values, baseline ?? -Infinity) + 8;
  const points = values.map((value, index) => ({
    x: (index / (values.length - 1)) * width,
    y: height - ((value - min) / (max - min)) * height,
  }));
  const path = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ');
  const baselineY =
    baseline === undefined ? null : height - ((baseline - min) / (max - min)) * height;
  const last = points[points.length - 1];

  return (
    <svg
      width={width}
      height={height + (label ? 24 : 0)}
      viewBox={`0 0 ${width} ${height + (label ? 24 : 0)}`}
      style={{ overflow: 'visible', opacity: entrance }}
    >
      {showAxis &&
        [0.25, 0.5, 0.75].map((tick) => (
          <line
            key={tick}
            x1={0}
            x2={width}
            y1={height * tick}
            y2={height * tick}
            stroke={C.line}
            strokeWidth={1}
            opacity={0.45}
          />
        ))}
      {baselineY !== null && (
        <line
          x1={0}
          x2={width}
          y1={baselineY}
          y2={baselineY}
          stroke={C.muted}
          strokeWidth={1}
          strokeDasharray="5 7"
          opacity={0.65}
        />
      )}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="square"
        strokeLinejoin="miter"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - draw}
      />
      <circle
        cx={last.x}
        cy={last.y}
        r={4}
        fill={color}
        opacity={interpolate(frame, [start + 40, start + 52], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })}
      />
      {label && (
        <text
          x={0}
          y={height + 18}
          fill={C.muted}
          fontFamily={F.mono}
          fontSize={10}
          letterSpacing="0.12em"
        >
          {label}
        </text>
      )}
    </svg>
  );
}
