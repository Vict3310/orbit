import type { CSSProperties } from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { F } from '../styles/brand';

interface KineticTextProps {
  text: string;
  start?: number;
  size?: number;
  color?: string;
  accentColor?: string;
  accentWords?: string[];
  stagger?: number;
  mode?: 'word' | 'char';
  weight?: number;
  font?: string;
  letterSpacing?: string;
  lineHeight?: number;
  align?: 'left' | 'center' | 'right';
  style?: CSSProperties;
  exitAt?: number;
  exitDuration?: number;
}

/**
 * Frame-driven masked typography. Every transform is derived from the current
 * frame and springs, so Remotion can render frames in any order.
 */
export function KineticText({
  text,
  start = 0,
  size = 96,
  color = '#F4F7FA',
  accentColor = '#D9F26A',
  accentWords = [],
  stagger = 3,
  mode = 'word',
  weight = 500,
  font = F.display,
  letterSpacing = '-0.035em',
  lineHeight = 0.95,
  align = 'left',
  style,
  exitAt,
  exitDuration = 12,
}: KineticTextProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lines = text.split('\n');
  const exitProgress =
    exitAt === undefined
      ? 0
      : interpolate(frame, [exitAt, exitAt + exitDuration], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

  let index = 0;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
        textAlign: align,
        fontFamily: font,
        fontSize: size,
        fontWeight: weight,
        letterSpacing,
        lineHeight,
        color,
        opacity: 1 - exitProgress,
        filter: exitProgress > 0 ? `blur(${exitProgress * 8}px)` : undefined,
        ...style,
      }}
    >
      {lines.map((line, lineIndex) => {
        const units = mode === 'char' ? Array.from(line) : line.split(' ');
        return (
          <div key={`${line}-${lineIndex}`} style={{ whiteSpace: 'pre' }}>
            {units.map((unit, unitIndex) => {
              const current = index;
              index += 1;
              const local = frame - start - current * stagger;
              const progress = spring({
                frame: local,
                fps,
                config: { damping: 20, mass: 0.7, stiffness: 130 },
              });
              const y = (1 - progress) * size * 1.05;
              const isAccent = accentWords.includes(unit.replace(/[.,]/g, ''));
              if (mode === 'char') {
                return (
                  <span
                    key={`${unit}-${unitIndex}`}
                    style={{
                      display: 'inline-block',
                      color: isAccent ? accentColor : color,
                      transform: `translateY(${y}px)`,
                      opacity: progress,
                    }}
                  >
                    {unit === ' ' ? '\u00A0' : unit}
                  </span>
                );
              }
              return (
                <span
                  key={`${unit}-${unitIndex}`}
                  style={{
                    display: 'inline-block',
                    overflow: 'hidden',
                    verticalAlign: 'top',
                    paddingBottom: size * 0.08,
                    marginBottom: -size * 0.08,
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      color: isAccent ? accentColor : color,
                      transform: `translateY(${y}px)`,
                      opacity: progress,
                    }}
                  >
                    {unit}
                  </span>
                  {unitIndex < units.length - 1 ? '\u00A0' : ''}
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
