import type { AlertLevel } from '../types/domain';

export const ALERT_META: Record<
  AlertLevel,
  { label: string; color: string; description: string; tone: 'ok' | 'muted' | 'caution' | 'critical' }
> = {
  normal: {
    label: 'Normal',
    color: '#65D6A5',
    description: 'Within the configured demonstration band.',
    tone: 'ok',
  },
  observation: {
    label: 'Observation',
    color: '#94A5B5',
    description: 'A prototype flag worth reviewing in context; not a clinical finding.',
    tone: 'muted',
  },
  elevated: {
    label: 'Elevated concern',
    color: '#F2BA68',
    description: 'A sustained deviation from the simulated personal baseline.',
    tone: 'caution',
  },
  review: {
    label: 'Requires review',
    color: '#F27676',
    description: 'A prototype rule detailed for human review; not a diagnosis.',
    tone: 'critical',
  },
};

export const ALERT_RANK: Record<AlertLevel, number> = {
  review: 3,
  elevated: 2,
  observation: 1,
  normal: 0,
};

export function worstLevel(levels: AlertLevel[]): AlertLevel {
  return levels.reduce<AlertLevel>(
    (worst, level) => (ALERT_RANK[level] > ALERT_RANK[worst] ? level : worst),
    'normal',
  );
}
