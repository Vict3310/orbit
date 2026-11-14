import type { AssessmentDimension, AssessmentItem } from '../types/domain';

/**
 * ORBIT Self-Report v1 — a short, transparent, non-clinical check-in.
 * Items use a 0–10 scale. This is not a validated clinical instrument and
 * must not be presented as one.
 */
export const ASSESSMENT_ITEMS: AssessmentItem[] = [
  {
    id: 'sleep_quality',
    dimension: 'sleepQuality',
    prompt: 'How restorative was your last sleep period?',
    lowLabel: 'Not restorative',
    highLabel: 'Fully restorative',
    direction: 'higher_better',
  },
  {
    id: 'fatigue',
    dimension: 'fatigue',
    prompt: 'How physically fatigued do you feel right now?',
    lowLabel: 'Alert and rested',
    highLabel: 'Exhausted',
    direction: 'higher_worse',
  },
  {
    id: 'stress',
    dimension: 'stress',
    prompt: 'How much task-related stress are you carrying?',
    lowLabel: 'None',
    highLabel: 'Severe',
    direction: 'higher_worse',
  },
  {
    id: 'discomfort',
    dimension: 'discomfort',
    prompt: 'How much physical discomfort are you experiencing?',
    lowLabel: 'None',
    highLabel: 'Severe',
    direction: 'higher_worse',
  },
  {
    id: 'workload',
    dimension: 'workload',
    prompt: 'How demanding is your current workload?',
    lowLabel: 'Light',
    highLabel: 'Overwhelming',
    direction: 'higher_worse',
  },
  {
    id: 'mood',
    dimension: 'mood',
    prompt: 'How would you describe your current mood?',
    lowLabel: 'Very low',
    highLabel: 'Very positive',
    direction: 'higher_better',
  },
  {
    id: 'concentration',
    dimension: 'concentration',
    prompt: 'How well are you able to concentrate on your task?',
    lowLabel: 'Very poorly',
    highLabel: 'Very well',
    direction: 'higher_better',
  },
];

export const ASSESSMENT_DIMENSIONS: AssessmentDimension[] = [
  'sleepQuality',
  'fatigue',
  'stress',
  'discomfort',
  'workload',
  'mood',
  'concentration',
];

export const DIMENSION_LABELS: Record<AssessmentDimension, string> = {
  sleepQuality: 'Sleep quality',
  fatigue: 'Fatigue',
  stress: 'Stress',
  discomfort: 'Discomfort',
  workload: 'Workload',
  mood: 'Mood',
  concentration: 'Concentration',
};

/** Converts raw 0–10 responses into 0–100 dimension scores used by the UI and model. */
export function scoreAssessment(responses: { itemId: string; value: number }[]): Record<AssessmentDimension, number> {
  const scores: Record<AssessmentDimension, number> = {
    sleepQuality: 50,
    fatigue: 50,
    stress: 50,
    discomfort: 50,
    workload: 50,
    mood: 50,
    concentration: 50,
  };
  for (const item of ASSESSMENT_ITEMS) {
    const response = responses.find((r) => r.itemId === item.id);
    if (!response) continue;
    const clamped = Math.max(0, Math.min(10, response.value));
    let value = clamped * 10;
    if (item.direction === 'higher_better') value = 100 - value;
    scores[item.dimension] = Math.round(value);
  }
  return scores;
}

export function assessmentCompositeNote(scores: Record<AssessmentDimension, number>): string {
  const flagged = ASSESSMENT_ITEMS.filter((item) => {
    const score = scores[item.dimension];
    return item.direction === 'higher_worse' ? score >= 65 : score >= 55;
  });
  if (flagged.length === 0) {
    return 'All self-reported dimensions are within the crew member’s usual reporting pattern.';
  }
  return `${flagged.length} self-reported dimension${flagged.length === 1 ? '' : 's'} at or above the configured review band: ${flagged
    .map((item) => item.dimension)
    .join(', ')}.`;
}
