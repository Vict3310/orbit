export const C = {
  bg: '#080D13',
  surface: '#111923',
  surface2: '#19232E',
  elevated: '#22303C',
  ink: '#F4F7FA',
  muted: '#94A5B5',
  accent: '#D9F26A',
  ok: '#65D6A5',
  caution: '#F2BA68',
  critical: '#F27676',
  line: '#293744',
} as const;

export const F = {
  display: "'Space Grotesk', system-ui, sans-serif",
  body: "'Inter', system-ui, sans-serif",
  mono: "'JetBrains Mono', monospace",
} as const;

export const SCENES = [
  { from: 0, duration: 300, label: 'SIGNALS' },
  { from: 300, duration: 300, label: 'ORBIT' },
  { from: 600, duration: 360, label: 'CONTEXT' },
  { from: 960, duration: 360, label: 'EXPLAIN' },
  { from: 1320, duration: 420, label: 'DECIDE' },
  { from: 1740, duration: 360, label: 'WORKFLOW' },
  { from: 2100, duration: 300, label: 'RESILIENCE' },
] as const;

export const TOTAL_FRAMES = 2400;
export const FPS = 60;
