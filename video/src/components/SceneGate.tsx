import { interpolate, useCurrentFrame } from 'remotion';
import { C } from '../styles/brand';

/** A frame-driven accent wipe that gives each scene a hard, designed entrance. */
export function SceneGate({ tone = C.accent }: { tone?: string }) {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, 9], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  if (progress <= 0) return null;
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 90,
        pointerEvents: 'none',
        background: tone,
        transform: `translateY(${-100 * (1 - progress)}%)`,
      }}
    />
  );
}
