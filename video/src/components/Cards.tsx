import type { ReactNode } from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, F } from '../styles/brand';

export function StatCard({
  label,
  value,
  unit,
  note,
  start = 0,
  accent = false,
  x,
  y,
  width = 260,
  children,
}: {
  label: string;
  value: string;
  unit?: string;
  note?: string;
  start?: number;
  accent?: boolean;
  x?: number;
  y?: number;
  width?: number;
  children?: ReactNode;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entrance = spring({
    frame: frame - start,
    fps,
    config: { damping: 18, mass: 0.8, stiffness: 110 },
  });
  return (
    <div
      style={{
        position: x === undefined ? 'relative' : 'absolute',
        left: x,
        top: y,
        width,
        border: `1px solid ${accent ? C.accent : C.line}`,
        background: C.surface,
        padding: 18,
        transform: `translateY(${(1 - entrance) * 28}px)`,
        opacity: entrance,
        zIndex: 10,
      }}
    >
      <div
        style={{
          fontFamily: F.mono,
          fontSize: 10,
          letterSpacing: '0.16em',
          color: accent ? C.accent : C.muted,
          textTransform: 'uppercase',
          marginBottom: 12,
        }}
      >
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontFamily: F.mono, fontSize: 38, lineHeight: 1, color: C.ink }}>{value}</span>
        {unit && (
          <span style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: '0.1em', color: C.muted }}>
            {unit}
          </span>
        )}
      </div>
      {note && (
        <div style={{ marginTop: 10, fontFamily: F.body, fontSize: 11, lineHeight: 1.5, color: C.muted }}>
          {note}
        </div>
      )}
      {children}
    </div>
  );
}

export function Chip({
  children,
  tone = C.muted,
  start = 0,
  x,
  y,
}: {
  children: ReactNode;
  tone?: string;
  start?: number;
  x?: number;
  y?: number;
}) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [start, start + 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: x === undefined ? 'relative' : 'absolute',
        left: x,
        top: y,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        border: `1px solid ${C.line}`,
        background: C.surface2,
        padding: '7px 10px',
        fontFamily: F.mono,
        fontSize: 10,
        letterSpacing: '0.12em',
        color: tone,
        opacity,
        width: 'fit-content',
      }}
    >
      <span style={{ width: 5, height: 5, background: tone }} />
      {children}
    </div>
  );
}

export function EvidenceCard({ start = 0 }: { start?: number }) {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [start, start + 24], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const rows = [
    ['RULE', 'rhr-elevated · 3 consecutive'],
    ['CURRENT', '82 bpm  ·  +28.1%'],
    ['BASELINE', '64 bpm  ·  72 h rolling'],
    ['WINDOW', 'D014 00:00 → 06:00'],
  ];
  return (
    <div
      style={{
        position: 'absolute',
        right: 70,
        bottom: 150,
        width: 620,
        border: `1px solid ${C.line}`,
        background: C.surface,
        zIndex: 30,
        transform: `translateY(${(1 - progress) * 30}px)`,
        opacity: progress,
        boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `1px solid ${C.line}`,
          padding: '12px 16px',
        }}
      >
        <span style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: '0.16em', color: C.ink }}>
          EVIDENCE / ALERT ANATOMY
        </span>
        <span style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: '0.1em', color: C.caution }}>
          ELEVATED CONCERN
        </span>
      </div>
      {rows.map(([key, value], index) => {
        const rowProgress = interpolate(frame, [start + 8 + index * 5, start + 18 + index * 5], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        return (
          <div
            key={key}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '9px 16px',
              borderBottom: `1px solid ${C.line}`,
              opacity: rowProgress,
              transform: `translateX(${(1 - rowProgress) * 14}px)`,
            }}
          >
            <span style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: '0.12em', color: C.muted }}>
              {key}
            </span>
            <span style={{ fontFamily: F.mono, fontSize: 12, color: C.ink }}>{value}</span>
          </div>
        );
      })}
      <div style={{ padding: '11px 16px', fontFamily: F.body, fontSize: 10, lineHeight: 1.5, color: C.muted }}>
        Prototype rule, not a clinical threshold. Synthetic observations. Correlation is not causation.
      </div>
    </div>
  );
}
