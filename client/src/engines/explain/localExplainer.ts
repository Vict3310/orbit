import type { BaselineSnapshot, HealthObservation } from '../../types/domain';

export interface ExplainerContext {
  profileName: string;
  role: string;
  latest: HealthObservation | null;
  baseline: BaselineSnapshot;
  fatigue: number;
  stress: number;
  sleepHours: number;
  reactionTime: number;
  restingHeartRate: number;
  hrv: number;
  dailyDose: number;
  cumulativeDose: number;
  envCo2: number;
  envO2: number;
  eclssStatus: string;
  comms: string;
  activeAlerts: { title: string; level: string; summary: string }[];
  scenarioLabel: string | null;
}

export interface LocalExplanation {
  text: string;
  suggestions: string[];
  sources: { label: string; url: string }[];
  mode: 'local';
}

const SOURCES = {
  sleep: {
    label: 'NASA HRP Evidence Report — Sleep',
    url: 'https://humanresearchroadmap.nasa.gov/evidence/reports/Sleep.pdf',
  },
  sleepStudy: {
    label: 'Jones et al., SLEEP (2022) — ISS sleep and neurobehavioral function',
    url: 'https://academic.oup.com/sleep/article/45/3/zsac006/6505235',
  },
  radiation: {
    label: 'NASA Human Research Program — Space Radiation',
    url: 'https://www.nasa.gov/hrp/radiation/',
  },
  co2: {
    label: 'NASA OCHMO Technical Brief — Carbon Dioxide',
    url: 'https://www.nasa.gov/ochmo-tb-004-carbon-dioxide-2',
  },
  hpr: { label: 'NASA Human Research Program', url: 'https://www.nasa.gov/hrp/' },
};

function line(label: string, value: string): string {
  return `${label}: ${value}`;
}

function contextSummary(ctx: ExplainerContext): string {
  const baselineSleep = ctx.baseline.metrics.sleepHours?.value ?? 0;
  const baselineRhr = ctx.baseline.metrics.restingHeartRate?.value ?? 0;
  return [
    line('Crew member', `${ctx.profileName} (${ctx.role})`),
    line('Latest simulated values', `${ctx.restingHeartRate.toFixed(0)} bpm resting, ${ctx.hrv.toFixed(0)} ms HRV, ${ctx.sleepHours.toFixed(1)} h sleep/24 h`),
    line('Personal baseline', `${baselineRhr.toFixed(0)} bpm, sleep ${baselineSleep.toFixed(1)} h`),
    line('Active alerts', ctx.activeAlerts.length === 0 ? 'none' : ctx.activeAlerts.map((a) => `${a.title} [${a.level}]`).join('; ')),
  ].join('\n');
}

/**
 * Offline explanation engine. It composes answers only from the state passed
 * in, and never produces a diagnosis, a treatment recommendation, or a new
 * measurement. It is the mandatory fallback when the optional cloud assistant
 * is unavailable.
 */
export function explainLocally(question: string, ctx: ExplainerContext): LocalExplanation {
  const q = question.toLowerCase();
  const suggestions = [
    'Explain this fatigue finding',
    'What changed from baseline?',
    'What does the radiation estimate mean?',
    'How should I interpret the CO2 reading?',
  ];
  const disclaimer =
    'This is a local educational explanation based only on the simulated state shown in ORBIT. It is not a diagnosis or a treatment recommendation.';

  if (q.includes('radiation') || q.includes('dose') || q.includes('exposure')) {
    return {
      mode: 'local',
      suggestions,
      sources: [SOURCES.radiation, SOURCES.hpr],
      text: [
        `The modelled 24-hour exposure estimate is ${ctx.dailyDose.toFixed(2)} mSv, with ${ctx.cumulativeDose.toFixed(2)} mSv accumulated in this simulated mission. The current habitat state is ${ctx.eclssStatus}, and the active scenario is ${ctx.scenarioLabel ?? 'none'}.`,
        'ORBIT computes this estimate from the crew member’s current module, an illustrative shielding factor and the intensity of a simulated solar particle event when one is active. The estimate is not a dosimetry measurement and does not predict an individual health outcome. Published lunar surface estimates are of the same order of magnitude but depend strongly on shielding, solar cycle and instrument.',
        'Operationally, the meaningful levers are location and time: the storm shelter has the lowest modelled dose rate, the pressurized habitat is intermediate, and surface EVA is highest. Moving earlier always reduces the integrated estimate.',
        disclaimer,
      ].join('\n\n'),
    };
  }

  if (q.includes('co2') || q.includes('carbon') || q.includes('air') || q.includes('life support') || q.includes('eclss')) {
    return {
      mode: 'local',
      suggestions,
      sources: [SOURCES.co2, SOURCES.hpr],
      text: [
        `The simulated cabin CO2 reading is ${Math.round(ctx.envCo2)} ppm with oxygen at ${ctx.envO2.toFixed(1)}%. NASA's current 1-hour reference standard is a mean partial pressure of no more than 3 mmHg, which is approximately 3,947 ppm at 101.3 kPa. This model reports a concentration proxy, not a calibrated ppCO2 measurement, and the conversion is approximate.`,
        'A rising CO2 trend is an environmental signal, not an individual medical finding. In ORBIT it increases the environmental alert band and adds a small modelled SpO2 effect. A normal oxygen saturation value alone does not establish that the cabin is safe; the environmental readings and life-support status must be assessed together.',
        'The useful operational sequence is: inspect the CO2 removal system, reduce non-essential activity, monitor the trend, and record the decision. NASA sources note that cognitive effects of CO2 at spacecraft-relevant levels are mixed, so ORBIT avoids asserting a performance effect.',
        disclaimer,
      ].join('\n\n'),
    };
  }

  if (q.includes('sleep') || q.includes('fatigue') || q.includes('tired') || q.includes('rest')) {
    const baselineSleep = ctx.baseline.metrics.sleepHours?.value ?? ctx.sleepHours;
    return {
      mode: 'local',
      suggestions,
      sources: [SOURCES.sleep, SOURCES.sleepStudy],
      text: [
        `${ctx.profileName} has ${ctx.sleepHours.toFixed(1)} h of modelled sleep in the trailing 24 hours, against a personal baseline of ${baselineSleep.toFixed(1)} h. The fatigue indicator is ${ctx.fatigue.toFixed(0)}/100 and stress is ${ctx.stress.toFixed(0)}/100. ${ctx.scenarioLabel ? `The active scenario is “${ctx.scenarioLabel}”.` : 'No scenario is currently active.'}`,
        'In ORBIT, fatigue is a deterministic composite: sleep debt contributes the largest term, with smaller contributions from scheduled workload, modelled stress and cumulative exposure. It is not a measured biomarker. The co-occurrence of low sleep, higher fatigue and slower reaction time is reported as context; the application does not claim that one caused another.',
        'For comparison, NASA HRP evidence reports that astronauts average about six hours of sleep in flight despite longer scheduled opportunities, and a 2022 ISS study reported 6.5 hours against an 8.5-hour opportunity, with lower sustained-attention performance in those sleeping under six hours. ORBIT uses those findings to motivate the baseline comparison, not to set a clinical threshold.',
        disclaimer,
      ].join('\n\n'),
    };
  }

  if (q.includes('reaction') || q.includes('cognitive') || q.includes('concentrat') || q.includes('mood') || q.includes('stress')) {
    return {
      mode: 'local',
      suggestions,
      sources: [SOURCES.hpr, SOURCES.sleepStudy],
      text: [
        `The modelled reaction time is ${ctx.reactionTime.toFixed(0)} ms and the illustrative cognitive index is derived from modelled fatigue and stress. The stress indicator is ${ctx.stress.toFixed(0)}/100. These are simulated values, not results from a validated neurocognitive battery.`,
        'The in-app reaction-time check measures simple visual response latency over multiple trials with randomised delays. Browser scheduling, display refresh, input device and practice effects all add uncertainty. A single result should never be interpreted as a cognitive deficit.',
        'ORBIT treats a change as a prompt for a repeat measurement and contextual review — sleep, workload, environment and self-report — rather than as a conclusion. NASA behavioral-health research supports monitoring sleep and workload together with performance, because multiple factors interact during long missions.',
        disclaimer,
      ].join('\n\n'),
    };
  }

  if (q.includes('alert') || q.includes('anomaly') || q.includes('why') || q.includes('baseline') || q.includes('deviation')) {
    const alertText =
      ctx.activeAlerts.length === 0
        ? 'There are currently no active alerts.'
        : ctx.activeAlerts
            .map((a) => `• ${a.title} (${a.level}) — ${a.summary}`)
            .join('\n');
    return {
      mode: 'local',
      suggestions,
      sources: [SOURCES.hpr],
      text: [
        `${alertText}`,
        'Each ORBIT alert is produced by a deterministic rule that compares recent observations with the crew member’s personal baseline. The alert detail shows the triggering values, the rule, the time window, the data-quality caveats and the factors that co-occurred in that window. No language model decides whether an alert exists.',
        'The baseline is the trailing 72-hour mean when at least eight synthetic observations are available; otherwise the profile baseline is used. Alerts are prototype classifications, not clinical risk categories, and they never establish a diagnosis.',
        contextSummary(ctx),
        disclaimer,
      ].join('\n\n'),
    };
  }

  return {
    mode: 'local',
    suggestions,
    sources: [SOURCES.hpr, SOURCES.sleep, SOURCES.radiation],
    text: [
      `ORBIT MED (local mode) can explain the simulated state for ${ctx.profileName}. Ask about fatigue, sleep, reaction time, radiation exposure, cabin CO2, an alert, or the personal baseline.`,
      contextSummary(ctx),
      'The local engine composes explanations from the current deterministic state only. When the optional AI service is configured and communication is available, ORBIT can phrase the same evidence more flexibly, but it still cannot create alerts, change the simulation, or diagnose.',
      disclaimer,
    ].join('\n\n'),
  };
}

export const SUGGESTED_QUESTIONS = [
  'Explain this fatigue finding',
  'What changed from my baseline?',
  'What does the radiation estimate mean?',
  'How should I interpret the CO2 reading?',
  'Why did ORBIT raise this alert?',
];
