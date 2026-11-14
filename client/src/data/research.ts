export type ReferenceKind = 'research' | 'approximation' | 'synthetic' | 'hypothesis';
export type ReferenceCategory =
  | 'Sleep & fatigue'
  | 'Cardiovascular'
  | 'Radiation'
  | 'Environmental'
  | 'Behavioural & cognitive'
  | 'Methods & data';

export interface ResearchReference {
  id: string;
  category: ReferenceCategory;
  kind: ReferenceKind;
  claim: string;
  finding: string;
  source: string;
  url?: string;
  application: string;
  limitation: string;
}

/**
 * Source register. Only links that were verified are included. Internal
 * simulation assumptions are explicitly labelled as such rather than being
 * attributed to NASA.
 */
export const RESEARCH_REFERENCES: ResearchReference[] = [
  {
    id: 'jones-2022-sleep',
    category: 'Sleep & fatigue',
    kind: 'research',
    claim: 'ISS crew slept about 6.5 hours per night in flight despite an 8.5-hour scheduled sleep opportunity.',
    finding:
      'A 2022 study of 23 astronauts and 1,418 sleep estimates reported in-flight sleep averaging 6.5 ± 1.4 hours; crew slept the full scheduled opportunity on only 5.9% of nights. Those sleeping under six hours performed worse on a brief sustained-attention task and reported more stress and workload.',
    source: 'Jones et al., SLEEP 45(3), 2022 — Sleep deficiency in spaceflight is associated with degraded neurobehavioral functions and elevated stress',
    url: 'https://academic.oup.com/sleep/article/45/3/zsac006/6505235',
    application:
      'Motivates the trailing-24-hour sleep indicator, the 8-hour default target, and the fatigue scenario with restricted sleep.',
    limitation:
      'Observational sleep estimates from a small astronaut sample; the reported associations are not individual predictions and do not establish causation.',
  },
  {
    id: 'hrp-sleep-evidence',
    category: 'Sleep & fatigue',
    kind: 'research',
    claim: 'NASA evidence syntheses report astronauts averaging about six hours of sleep in flight, below the eight hours referenced by NASA-STD-3001.',
    finding:
      'The NASA Human Research Program sleep evidence report summarises multiple shuttle, Mir and ISS studies with in-flight averages near six hours, and notes that this is below the eight hours recommended for astronauts.',
    source: 'NASA Human Research Program — Evidence Report: Risk of Sleep Loss and Circadian Desynchronization',
    url: 'https://humanresearchroadmap.nasa.gov/evidence/reports/Sleep.pdf',
    application:
      'Provides mission-relevant context for why ORBIT treats sleep duration and consistency as core monitoring domains.',
    limitation:
      'An evidence synthesis, not a clinical guideline for an individual; measurement methods and mission profiles differ across the included studies.',
  },
  {
    id: 'hrp-radiation',
    category: 'Radiation',
    kind: 'research',
    claim: 'Space radiation is a principal human health risk for missions outside Earth’s protective atmosphere.',
    finding:
      'NASA’s Space Radiation Element characterises health outcomes associated with ionizing radiation exposure and supports strategies to protect astronaut health during exploration missions.',
    source: 'NASA Human Research Program — Space Radiation Element',
    url: 'https://www.nasa.gov/hrp/radiation/',
    application:
      'Frames radiation as a monitoring and operational-planning domain rather than an acute physiological vital sign.',
    limitation:
      'Risk characterisation is an active research area with substantial uncertainty; ORBIT does not implement NASA risk models.',
  },
  {
    id: 'zhang-2020-lunar-dose',
    category: 'Radiation',
    kind: 'research',
    claim: 'The lunar surface receives chronic galactic cosmic ray and neutron exposure, measured at roughly 13 μGy/hour absorbed dose in silicon.',
    finding:
      'The Lunar Lander Neutrons and Dosimetry experiment reported an average total absorbed dose rate in silicon of 13.2 ± 1 μGy/hour, with 3.1 ± 0.5 μGy/hour from neutral particles.',
    source: 'Zhang et al., Science Advances, 2020 — First measurements of the radiation dose on the lunar surface',
    url: 'https://www.science.org/doi/10.1126/sciadv.aaz1334',
    application:
      'Provides an order-of-magnitude anchor for the illustrative external dose rate used in the habitat model.',
    limitation:
      'Absorbed dose in silicon is not equivalent to tissue dose equivalent; shielding, solar cycle and habitat design change exposure substantially.',
  },
  {
    id: 'artemis-2024-radiation',
    category: 'Radiation',
    kind: 'research',
    claim: 'Galactic cosmic ray dose-equivalent rates of roughly 1 mSv per day were measured during the Artemis I lunar mission.',
    finding:
      'The Artemis I radiation measurements reported calculated GCR dose-equivalent rates of 0.96–1.24 mSv/day in the shielded locations studied, lower than some more lightly shielded instruments.',
    source: 'Space radiation measurements during the Artemis I lunar mission, Nature, 2024',
    url: 'https://www.nature.com/articles/s41586-024-07927-7',
    application:
      'Informs the order of magnitude of the external EVA dose rate in the demonstration environment.',
    limitation:
      'The reported values depend on vehicle shielding and solar cycle; the ORBIT habitat is fictional and its shielding is illustrative.',
  },
  {
    id: 'matthia-2024-shielding',
    category: 'Radiation',
    kind: 'research',
    claim: 'Shielding substantially reduces solar particle event dose, while additional regolith mass does not reduce galactic cosmic ray dose much further.',
    finding:
      'A 2024 lunar shielding analysis estimated that more than 4 g/cm² of regolith would reduce expected solar particle event dose below current 30-day limits, while added mass shielding did not significantly reduce GCR absorbed dose.',
    source: 'Matthiä et al., Space Weather, 2024 — Radiation Exposure and Shielding Effects on the Lunar Surface',
    url: 'https://agupubs.onlinelibrary.wiley.com/doi/full/10.1029/2024SW004095',
    application:
      'Supports the shelter mechanic: sheltering lowers the modelled dose rate strongly during a solar particle event.',
    limitation:
      'Results depend on event spectra, geometry and material assumptions; ORBIT uses a simplified location multiplier, not a transport calculation.',
  },
  {
    id: 'ochmo-co2',
    category: 'Environmental',
    kind: 'research',
    claim: 'NASA’s current 1-hour CO2 reference is an average partial pressure no greater than 3 mmHg in the habitable volume.',
    finding:
      'NASA OCHMO documentation identifies a 3 mmHg 1-hour average ppCO2 reference. The same technical brief notes that studies of cognition at spacecraft-relevant CO2 levels have shown mixed results and no clear dose-response pattern.',
    source: 'NASA OCHMO Technical Brief — Carbon Dioxide (OCHMO-TB-004)',
    url: 'https://www.nasa.gov/ochmo-tb-004-carbon-dioxide-2',
    application:
      'The 3,947 ppm value used for the CO2 reference band is an approximate atmospheric conversion of 3 mmHg at 101.3 kPa. ORBIT labels it as a proxy.',
    limitation:
      'The simulation reports ppm, not calibrated ppCO2. Total pressure, humidity and sensor placement affect the conversion, and a cabin reading is not an individual exposure measurement.',
  },
  {
    id: 'hrp-bmed-2025',
    category: 'Behavioural & cognitive',
    kind: 'research',
    claim: 'Sleep loss and high workload can co-occur with changes in attention and self-reported stress during spaceflight.',
    finding:
      'NASA HRP behavioural-health evidence describes in-flight sleep averaging about six hours, and reports that crew sleeping under six hours performed worse on sustained attention while reporting greater stress and workload.',
    source: 'NASA HRP Evidence Report — Adverse Cognitive or Behavioral Changes and Psychiatric Disorders',
    url: 'https://humanresearchroadmap.nasa.gov/evidence/reports/HRP-ER-BMED-HFBP-20250210.pdf',
    application:
      'Justifies evaluating sleep, fatigue, stress and reaction time together while explicitly avoiding causal language.',
    limitation:
      'Evidence is heterogeneous and does not establish that one indicator causes another for a specific crew member.',
  },
  {
    id: 'spaceflight-standard-measures-2025',
    category: 'Behavioural & cognitive',
    kind: 'research',
    claim: 'Cognitive performance is generally stable across six-month ISS missions, with some changes in processing speed, working memory and sustained attention.',
    finding:
      'An analysis of cognitive test battery data from astronauts found no evidence of a systematic overall decline, but reported slowed performance early in flight on some tasks and reductions in specific domains.',
    source: 'Spaceflight Standard Measures, npj Microgravity, 2025',
    url: 'https://www.nature.com/articles/s41526-025-00532-6',
    application:
      'Motivates presenting cognitive results as within-person trends and repeated measurements rather than a single pass/fail score.',
    limitation:
      'Group-level findings; individual trajectories vary and the test battery is not the same as ORBIT’s reaction-time check.',
  },
  {
    id: 'hrp-home',
    category: 'Cardiovascular',
    kind: 'research',
    claim: 'NASA’s Human Research Program treats cardiovascular and other physiological changes as central human-system risks for spaceflight.',
    finding:
      'The HRP portfolio characterises and mitigates risks to astronaut health and performance, including cardiovascular, behavioural, sleep and radiation risks, to support safe human spaceflight.',
    source: 'NASA Human Research Program',
    url: 'https://www.nasa.gov/hrp/',
    application:
      'Provides the framing for the cardiovascular domain and for pairing measurements with mission context.',
    limitation:
      'A programme overview, not a source for any specific numerical threshold used in this prototype.',
  },
  {
    id: 'osdr',
    category: 'Methods & data',
    kind: 'research',
    claim: 'NASA’s Open Science Data Repository makes space biology and spaceflight health data available for secondary research.',
    finding:
      'OSDR provides open access to space-relevant datasets and analysis resources. The ORBIT prototype did not download, train on, or derive parameters from these records.',
    source: 'NASA Open Science Data Repository',
    url: 'https://osdr.nasa.gov/',
    application:
      'Identifies a credible future pathway for validating or recalibrating any model against real, consented datasets.',
    limitation:
      'ORBIT makes no claim of using OSDR data. Any future use would require careful governance and clinical validation.',
  },
  {
    id: 'twins-study',
    category: 'Methods & data',
    kind: 'research',
    claim: 'A year-long spaceflight study found multi-system biological changes and substantial inter-individual variability.',
    finding:
      'The NASA Twins Study integrated multi-omic, physiological and cognitive measurements from a twin pair during a one-year mission, reporting changes across several systems and highlighting the value of longitudinal, individualized monitoring.',
    source: 'Garrett-Bakelman et al., Science, 2019 — The NASA Twins Study',
    url: 'https://www.science.org/doi/10.1126/science.aau8650',
    application:
      'Supports ORBIT’s decision to compare crew members with personal baselines instead of a single population threshold.',
    limitation:
      'A twin-pair case study with limited generalisability; ORBIT does not use its measurements or derive its thresholds from it.',
  },
  {
    id: 'orbit-fatigue-composite',
    category: 'Sleep & fatigue',
    kind: 'synthetic',
    claim: 'ORBIT’s fatigue indicator is a demonstration composite, not a measured physiological quantity.',
    finding:
      'Fatigue is calculated from modelled sleep debt, scheduled workload, stress and cumulative exposure, then smoothed over 15-minute ticks. Self-report can pull the indicator toward the crew member’s stated fatigue.',
    source: 'ORBIT internal model assumption',
    application:
      'Produces a responsive signal for the fatigue scenario and chart exploration.',
    limitation:
      'The coefficients are illustrative. No claim of predictive validity or clinical meaning is made.',
  },
  {
    id: 'orbit-radiation-bands',
    category: 'Radiation',
    kind: 'synthetic',
    claim: 'ORBIT’s radiation review bands are prototype configuration values, not NASA crew exposure limits.',
    finding:
      'The demonstration alerts when modelled 24-hour dose exceeds 1.2 mSv, escalates at 2.5 mSv and flags a review band at 5 mSv. These values are set for the scenario to be observable.',
    source: 'ORBIT internal model assumption',
    application:
      'Creates an interpretable exposure-monitoring workflow during a simulated solar particle event.',
    limitation:
      'Must never be presented as regulatory or clinical radiation limits. NASA uses separate, risk-based standards outside this prototype.',
  },
  {
    id: 'orbit-thresholds',
    category: 'Methods & data',
    kind: 'approximation',
    claim: 'Percentage and standardised-deviation thresholds are configurable demonstration rules.',
    finding:
      'Resting heart rate escalates after three consecutive hourly samples at least 8% above baseline; sleep escalates after two samples at least 12% below baseline; fatigue uses 22%. These are not derived from a clinical guideline.',
    source: 'ORBIT internal detection configuration',
    application:
      'Makes the anomaly engine transparent, adjustable and testable.',
    limitation:
      'No clinical validation. The rules are intentionally sensitive enough to demonstrate the workflow.',
  },
  {
    id: 'orbit-co2-bands',
    category: 'Environmental',
    kind: 'approximation',
    claim: 'The CO2 warning bands convert a pressure standard to a concentration proxy for display.',
    finding:
      'A 3 mmHg ppCO2 reference at 101.3 kPa is approximately 3,947 ppm. ORBIT uses 6,000 ppm for an elevated flag and 9,000 ppm for a review flag to demonstrate an environmental escalation.',
    source: 'ORBIT internal model assumption, informed by NASA OCHMO-TB-004',
    application:
      'Allows environmental alerts to be compared with a familiar concentration unit.',
    limitation:
      'The conversion is approximate, the elevated/review bands are not NASA limits, and the cabin reading is not an individual exposure measure.',
  },
  {
    id: 'orbit-baseline-method',
    category: 'Methods & data',
    kind: 'approximation',
    claim: 'The personal baseline is a rolling 72-hour mean, with a standard deviation when enough samples exist.',
    finding:
      'When at least eight observations exist, ORBIT reports the trailing mean and standard deviation. Otherwise it uses the synthetic profile baseline. No regression or machine-learning model is fitted.',
    source: 'ORBIT internal baseline method',
    application:
      'Keeps every alert inspectable and reproducible.',
    limitation:
      'A short rolling window can adapt to a sustained change and mask a deviation; the simulation has less data than a real monitoring programme.',
  },
  {
    id: 'orbit-causality',
    category: 'Behavioural & cognitive',
    kind: 'hypothesis',
    claim: 'Co-occurring changes may share an operational cause, but ORBIT does not test that hypothesis.',
    finding:
      'Multi-indicator alerts state that changes co-occurred in the same window. The alert lists possible contributing factors drawn from mission context but performs no causal inference.',
    source: 'ORBIT design position',
    application:
      'Prompts a structured assessment and contextual review rather than a diagnostic conclusion.',
    limitation:
      'Unvalidated. Any causal hypothesis would require controlled data and formal analysis outside this prototype.',
  },
];

export const REFERENCE_CATEGORIES: ReferenceCategory[] = [
  'Sleep & fatigue',
  'Cardiovascular',
  'Radiation',
  'Environmental',
  'Behavioural & cognitive',
  'Methods & data',
];

export const KIND_LABEL: Record<ReferenceKind, string> = {
  research: 'Research-supported',
  approximation: 'Educational approximation',
  synthetic: 'Synthetic parameter',
  hypothesis: 'Unvalidated hypothesis',
};
