import type { DetectionRule, RoleKey, ZoneId } from '../../types/domain';

export const SIM_CONFIG = {
  tickMinutes: 15,
  observationIntervalMinutes: 60,
  historyHours: 168,
  missionStartMinute: 12 * 1440 + 6 * 60, // Mission Day 13, 06:00
  epochIso: '2031-08-14T00:00:00.000Z',
  defaultSeed: 20260413,
  defaultSpeed: 60, // simulated minutes per real second
  defaultCommsDelaySeconds: 480,
  maxObservationsPerCrew: 1200,
} as const;

export interface ZoneDefinition {
  id: ZoneId;
  label: string;
  short: string;
  description: string;
  /** Illustrative shielded dose rate in mSv/day. Not a measured habitat value. */
  doseRate: number;
  /** Multiplier contribution during a solar particle event. */
  speExposure: number;
  tempC: number;
  capacity: number;
  systems: string[];
}

/**
 * The outpost schematic is a demonstration environment. Dose rates are
 * illustrative values informed by published lunar surface estimates, not a
 * validated shielding analysis for a real habitat.
 */
export const ZONES: Record<ZoneId, ZoneDefinition> = {
  quarters: {
    id: 'quarters',
    label: 'Living Quarters',
    short: 'LQ',
    description: 'Crew sleep stations, galley and personal storage. Moderately shielded by regolith berms.',
    doseRate: 0.42,
    speExposure: 0.55,
    tempC: 22.4,
    capacity: 3,
    systems: ['Sleep stations', 'Galley', 'Water recovery'],
  },
  medbay: {
    id: 'medbay',
    label: 'Medical Monitoring Station',
    short: 'MED',
    description: 'Structured assessment station, sample refrigerator and the local health-intelligence terminal.',
    doseRate: 0.4,
    speExposure: 0.55,
    tempC: 22.1,
    capacity: 2,
    systems: ['Assessment terminal', 'Sample cold storage', 'Telemetry relay'],
  },
  exercise: {
    id: 'exercise',
    label: 'Exercise Area',
    short: 'EX',
    description: 'Resistive and aerobic countermeasure equipment with activity-context capture.',
    doseRate: 0.44,
    speExposure: 0.6,
    tempC: 23.0,
    capacity: 2,
    systems: ['Resistive rig', 'Aerobic module', 'Load capture'],
  },
  shelter: {
    id: 'shelter',
    label: 'Radiation Shelter',
    short: 'SH',
    description: 'Water-and-regolith shielded storm shelter. Lowest modelled dose rate in the outpost.',
    doseRate: 0.1,
    speExposure: 0.03,
    tempC: 21.2,
    capacity: 3,
    systems: ['Passive shielding', 'Emergency consumables', 'Independent comms'],
  },
  lab: {
    id: 'lab',
    label: 'Research Laboratory',
    short: 'LAB',
    description: 'Sample analysis, spectrometry and the primary science workstation.',
    doseRate: 0.46,
    speExposure: 0.6,
    tempC: 22.8,
    capacity: 2,
    systems: ['Spectrometer', 'Sample glovebox', 'Analysis compute'],
  },
  solar: {
    id: 'solar',
    label: 'Solar Power System',
    short: 'PWR',
    description: 'Deployable array and power conditioning. Partially exposed to the external environment.',
    doseRate: 0.62,
    speExposure: 1.4,
    tempC: 24.5,
    capacity: 2,
    systems: ['PV array', 'Battery bank', 'Power conditioning'],
  },
  'life-support': {
    id: 'life-support',
    label: 'Life-Support System',
    short: 'ECLSS',
    description: 'CO2 scrubbing, oxygen generation and thermal control for the pressurized habitat.',
    doseRate: 0.45,
    speExposure: 0.6,
    tempC: 25.1,
    capacity: 2,
    systems: ['CO2 removal', 'O2 generation', 'Thermal control'],
  },
  eva: {
    id: 'eva',
    label: 'External Exploration Area',
    short: 'EVA',
    description: 'Lunar surface traverse zone. Highest modelled exposure and workload.',
    doseRate: 0.95,
    speExposure: 3.5,
    tempC: -18.0,
    capacity: 2,
    systems: ['Airlock', 'Surface traverse', 'Suit telemetry'],
  },
};

/** Approximate atmospheric equivalence of NASA's 3 mmHg 1-hour ppCO2 reference at 101.3 kPa. */
export const CO2_REFERENCE_PPM = 3947;
export const CO2_ELEVATED_PPM = 6000;
export const CO2_REVIEW_PPM = 9000;
export const CO2_NOMINAL_PPM = 2600;

/**
 * Prototype radiation review bands. These are NOT NASA crew exposure limits.
 * They exist only to demonstrate an explainable monitoring workflow on
 * synthetic dose estimates.
 */
export const RADIATION_BANDS = {
  observationDaily: 1.2,
  elevatedDaily: 2.5,
  reviewDaily: 5,
  cumulativeReview: 25,
};

export interface ScheduleTemplateBlock {
  kind: 'sleep' | 'rest' | 'work' | 'exercise' | 'eva' | 'medical';
  startMinute: number;
  endMinute: number;
  label: string;
  zone: ZoneId;
}

export const CREW_SCHEDULES: Record<RoleKey, ScheduleTemplateBlock[]> = {
  commander: [
    { kind: 'sleep', startMinute: 22 * 60, endMinute: 6 * 60 + 30, label: 'Sleep window', zone: 'quarters' },
    { kind: 'rest', startMinute: 6 * 60 + 30, endMinute: 7 * 60, label: 'Morning routine', zone: 'quarters' },
    { kind: 'medical', startMinute: 7 * 60, endMinute: 7 * 60 + 30, label: 'Physiology check-in', zone: 'medbay' },
    { kind: 'work', startMinute: 7 * 60 + 30, endMinute: 12 * 60, label: 'Outpost systems review', zone: 'lab' },
    { kind: 'rest', startMinute: 12 * 60, endMinute: 13 * 60, label: 'Meal and crew conference', zone: 'quarters' },
    { kind: 'work', startMinute: 13 * 60, endMinute: 17 * 60, label: 'EVA-14 preparation', zone: 'lab' },
    { kind: 'exercise', startMinute: 17 * 60, endMinute: 18 * 60, label: 'Countermeasure session', zone: 'exercise' },
    { kind: 'work', startMinute: 18 * 60, endMinute: 20 * 60 + 30, label: 'Mission planning', zone: 'quarters' },
    { kind: 'rest', startMinute: 20 * 60 + 30, endMinute: 22 * 60, label: 'Recovery period', zone: 'quarters' },
  ],
  engineer: [
    { kind: 'sleep', startMinute: 23 * 60, endMinute: 7 * 60, label: 'Sleep window', zone: 'quarters' },
    { kind: 'rest', startMinute: 7 * 60, endMinute: 7 * 60 + 30, label: 'Morning routine', zone: 'quarters' },
    { kind: 'work', startMinute: 7 * 60 + 30, endMinute: 12 * 60 + 30, label: 'ECLSS maintenance', zone: 'life-support' },
    { kind: 'rest', startMinute: 12 * 60 + 30, endMinute: 13 * 60 + 30, label: 'Meal period', zone: 'quarters' },
    { kind: 'work', startMinute: 13 * 60 + 30, endMinute: 17 * 60 + 30, label: 'Solar array inspection', zone: 'solar' },
    { kind: 'exercise', startMinute: 17 * 60 + 30, endMinute: 18 * 60 + 30, label: 'Countermeasure session', zone: 'exercise' },
    { kind: 'work', startMinute: 18 * 60 + 30, endMinute: 21 * 60, label: 'Systems fault review', zone: 'life-support' },
    { kind: 'rest', startMinute: 21 * 60, endMinute: 23 * 60, label: 'Recovery period', zone: 'quarters' },
  ],
  science: [
    { kind: 'sleep', startMinute: 21 * 60 + 30, endMinute: 6 * 60, label: 'Sleep window', zone: 'quarters' },
    { kind: 'rest', startMinute: 6 * 60, endMinute: 6 * 60 + 30, label: 'Morning routine', zone: 'quarters' },
    { kind: 'work', startMinute: 6 * 60 + 30, endMinute: 11 * 60 + 30, label: 'Sample analysis', zone: 'lab' },
    { kind: 'rest', startMinute: 11 * 60 + 30, endMinute: 12 * 60 + 30, label: 'Meal period', zone: 'quarters' },
    { kind: 'work', startMinute: 12 * 60 + 30, endMinute: 16 * 60 + 30, label: 'Spectrometry run', zone: 'lab' },
    { kind: 'exercise', startMinute: 16 * 60 + 30, endMinute: 17 * 60 + 30, label: 'Countermeasure session', zone: 'exercise' },
    { kind: 'rest', startMinute: 17 * 60 + 30, endMinute: 19 * 60, label: 'Recovery period', zone: 'quarters' },
    { kind: 'work', startMinute: 19 * 60, endMinute: 21 * 60, label: 'Sample custody log', zone: 'lab' },
    { kind: 'rest', startMinute: 21 * 60, endMinute: 21 * 60 + 30, label: 'Pre-sleep routine', zone: 'quarters' },
  ],
};

export const ACTIVITY_WORKLOAD: Record<'sleep' | 'rest' | 'work' | 'exercise' | 'eva' | 'medical', number> = {
  sleep: 0,
  rest: 8,
  work: 58,
  exercise: 78,
  eva: 88,
  medical: 20,
};

export const ACTIVITY_LABEL: Record<'sleep' | 'rest' | 'work' | 'exercise' | 'eva' | 'medical', string> = {
  sleep: 'Sleep',
  rest: 'Rest',
  work: 'Work',
  exercise: 'Exercise',
  eva: 'EVA',
  medical: 'Medical',
};

/**
 * Default demonstration detection rules. Every value is a prototype assumption,
 * configurable from Settings, and is not a clinical threshold.
 */
export const DEFAULT_RULES: DetectionRule[] = [
  {
    id: 'rhr-elevated',
    metric: 'restingHeartRate',
    label: 'Resting heart rate above personal baseline',
    direction: 'up',
    pctThreshold: 8,
    zThreshold: 2,
    consecutive: 3,
    level: 'elevated',
    rationale:
      'Three consecutive hourly resting heart-rate samples at least 8% (or 2 standard deviations) above the personal baseline.',
  },
  {
    id: 'hrv-suppressed',
    metric: 'hrv',
    label: 'Heart-rate variability below personal baseline',
    direction: 'down',
    pctThreshold: 18,
    zThreshold: 2,
    consecutive: 3,
    level: 'observation',
    rationale:
      'Three consecutive hourly HRV samples at least 18% below the personal baseline. HRV can be affected by many factors and is treated here as an exploratory signal.',
  },
  {
    id: 'sleep-reduced',
    metric: 'sleepHours',
    label: 'Sleep duration below personal baseline',
    direction: 'down',
    pctThreshold: 12,
    zThreshold: 2,
    consecutive: 2,
    level: 'elevated',
    rationale:
      'Two consecutive hourly observations with trailing-24-hour sleep at least 12% below the personal baseline.',
  },
  {
    id: 'fatigue-elevated',
    metric: 'fatigue',
    label: 'Fatigue indicator above personal baseline',
    direction: 'up',
    pctThreshold: 22,
    zThreshold: 2,
    consecutive: 3,
    level: 'elevated',
    rationale:
      'Three consecutive modelled fatigue samples at least 22% above the personal baseline. The indicator combines sleep debt, workload and self-report.',
  },
  {
    id: 'reaction-slower',
    metric: 'reactionTime',
    label: 'Reaction time slower than personal baseline',
    direction: 'up',
    pctThreshold: 10,
    zThreshold: 2,
    consecutive: 2,
    level: 'observation',
    rationale:
      'Two consecutive modelled reaction-time samples at least 10% slower than the personal baseline. Browser timing and model assumptions limit interpretation.',
  },
  {
    id: 'stress-elevated',
    metric: 'stress',
    label: 'Stress indicator above personal baseline',
    direction: 'up',
    pctThreshold: 30,
    zThreshold: 2.5,
    consecutive: 3,
    level: 'observation',
    rationale:
      'Three consecutive modelled stress samples at least 30% above the personal baseline. This is an illustrative composite, not a clinical measure.',
  },
  {
    id: 'spo2-low',
    metric: 'spo2',
    label: 'Peripheral oxygen saturation below prototype review threshold',
    direction: 'down',
    pctThreshold: 100,
    zThreshold: 4,
    consecutive: 2,
    level: 'review',
    absoluteBelow: 94,
    rationale:
      'Two consecutive simulated SpO2 samples below 94%. This is a demonstration review band, not a validated clinical or cabin-safety threshold.',
  },
  {
    id: 'cognitive-decline',
    metric: 'cognitiveScore',
    label: 'Cognitive performance index below personal baseline',
    direction: 'down',
    pctThreshold: 15,
    zThreshold: 2,
    consecutive: 3,
    level: 'observation',
    rationale:
      'Three consecutive modelled cognitive-index samples at least 15% below the personal baseline. The index is illustrative, not a neurocognitive test score.',
  },
];

export const SYSTEM_DEFAULT_RULES: DetectionRule[] = DEFAULT_RULES.map((r) => ({ ...r }));
