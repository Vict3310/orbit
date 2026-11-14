import type { AstronautProfile } from '../types/domain';

/**
 * Fictional crew of the ORBIT lunar research outpost demonstration.
 * These are not real NASA astronauts and the baselines are illustrative
 * synthetic values, not clinical norms.
 */
export const ASTRONAUTS: AstronautProfile[] = [
  {
    id: 'cdr-okafor',
    name: 'Amara Okafor',
    callSign: 'ORBIT-1',
    role: 'Mission Commander',
    roleKey: 'commander',
    age: 43,
    origin: 'Lagos, Nigeria · Mission Commander, 2nd lunar deployment',
    bio: 'Former flight-test engineer and deep-space operations lead. Amara commands the Selene-4 outpost and is responsible for crew safety, schedule authority, and communication with the Earth support team. She has a documented tendency to under-report fatigue during high-tempo operations.',
    specialty: 'Flight operations · Crew resource management',
    baseline: {
      heartRate: 64,
      restingHeartRate: 58,
      hrv: 62,
      respiratoryRate: 13,
      spo2: 98.4,
      systolic: 116,
      diastolic: 74,
      sleepHours: 7.4,
      sleepConsistency: 82,
      fatigue: 24,
      stress: 26,
      mood: 76,
      reactionTime: 242,
      cognitiveScore: 78,
    },
    baselineNote:
      'Synthetic personal baseline derived from the profile and seven days of simulated observations. It is not a clinical reference range.',
    avatar: { suit: '#E7EDF2', visor: '#22303C', strap: '#F2BA68', patch: '#D9F26A' },
    assignments: [
      'Outpost command authority',
      'EVA-14 surface inspection lead',
      'Medical review liaison (simulated)',
    ],
  },
  {
    id: 'fe-lindqvist',
    name: 'Elias Lindqvist',
    callSign: 'ORBIT-2',
    role: 'Flight Engineer',
    roleKey: 'engineer',
    age: 38,
    origin: 'Kiruna, Sweden · Flight Engineer, 1st lunar deployment',
    bio: 'Spacecraft systems engineer specialising in environmental control and power distribution. Elias maintains the outpost life-support chain and solar array, and frequently works extended maintenance shifts when the habitat is in a degraded configuration.',
    specialty: 'ECLSS · Power systems · Maintenance',
    baseline: {
      heartRate: 68,
      restingHeartRate: 64,
      hrv: 55,
      respiratoryRate: 14,
      spo2: 98.1,
      systolic: 122,
      diastolic: 78,
      sleepHours: 7.0,
      sleepConsistency: 74,
      fatigue: 30,
      stress: 32,
      mood: 70,
      reactionTime: 258,
      cognitiveScore: 74,
    },
    baselineNote:
      'Synthetic personal baseline derived from the profile and seven days of simulated observations. It is not a clinical reference range.',
    avatar: { suit: '#D9E2EA', visor: '#19232E', strap: '#65D6A5', patch: '#F2BA68' },
    assignments: [
      'Life-support and power systems',
      'ECLSS fault response (simulated)',
      'Exercise countermeasure scheduling',
    ],
  },
  {
    id: 'so-raman',
    name: 'Meera Raman',
    callSign: 'ORBIT-3',
    role: 'Science Officer',
    roleKey: 'science',
    age: 35,
    origin: 'Bengaluru, India · Science Officer, 1st lunar deployment',
    bio: 'Astrobiologist and planetary sample specialist. Meera runs the research laboratory, manages sample custody, and leads the behavioural-health self-monitoring routine for the crew. Her sleep window is deliberately shifted to match laboratory thermal constraints.',
    specialty: 'Astrobiology · Sample analysis · Behavioural health monitoring',
    baseline: {
      heartRate: 66,
      restingHeartRate: 61,
      hrv: 68,
      respiratoryRate: 12,
      spo2: 98.6,
      systolic: 112,
      diastolic: 71,
      sleepHours: 8.0,
      sleepConsistency: 88,
      fatigue: 20,
      stress: 22,
      mood: 80,
      reactionTime: 231,
      cognitiveScore: 81,
    },
    baselineNote:
      'Synthetic personal baseline derived from the profile and seven days of simulated observations. It is not a clinical reference range.',
    avatar: { suit: '#F1F4F7', visor: '#22303C', strap: '#D9F26A', patch: '#65D6A5' },
    assignments: [
      'Lunar sample laboratory',
      'Crew behavioural-health routine',
      'Radiation dosimetry review (simulated)',
    ],
  },
];

export const ASTRONAUT_BY_ID: Record<string, AstronautProfile> = ASTRONAUTS.reduce(
  (acc, astronaut) => {
    acc[astronaut.id] = astronaut;
    return acc;
  },
  {} as Record<string, AstronautProfile>,
);

export const DEFAULT_ASTRONAUT_ID = ASTRONAUTS[0].id;
