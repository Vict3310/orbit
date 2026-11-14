# Scientific basis, assumptions and non-claims

ORBIT is an educational prototype. This document separates four kinds of statement so that a judge, engineer or clinician can tell what is supported by published work and what is an invented demonstration parameter.

| Class | Meaning |
| --- | --- |
| **Research-supported** | A statement that follows the cited publication's reported findings. It is still not a clinical recommendation for an individual. |
| **Educational approximation** | A deliberate simplification of a physical or physiological relationship, used to make a concept visible. |
| **Synthetic parameter** | A number chosen for the demonstration. It has no clinical or regulatory authority. |
| **Unvalidated hypothesis** | A relationship ORBIT deliberately does not assert as fact. |

Links were checked for this build. Publication pages can change; the citation, not the URL, identifies the source.

---

## 1. Research-supported statements

### 1.1 Sleep duration in spaceflight

**Claim.** Astronauts often sleep less than their scheduled opportunity. A 2022 study of 23 astronauts and 1,418 in-flight sleep estimates reported a mean of about 6.5 hours per night, with the full scheduled opportunity used on only 5.9% of nights. Crew sleeping under six hours performed worse on a brief sustained-attention task and reported higher stress and workload.

**Source.** Jones CW, et al. “Sleep deficiency in spaceflight is associated with degraded neurobehavioral functions and elevated stress.” *SLEEP* 45(3), 2022. <https://academic.oup.com/sleep/article/45/3/zsac006/6505235>

**Use in ORBIT.** Informs the trailing-24-hour sleep indicator, the eight-hour target used by the baseline model, and the fatigue scenario's restricted sleep opportunity.

**Assumptions and limits.** Observational estimates from a small astronaut sample; associations are group-level and do not establish causation or predict an individual. Sleep was estimated rather than measured by polysomnography in every case.

### 1.2 NASA sleep evidence synthesis

**Claim.** NASA Human Research Program evidence synthesis reports in-flight sleep averaging about six hours, below the eight hours referenced in NASA-STD-3001.

**Source.** NASA HRP, *Evidence Report: Risk of Sleep Loss and Circadian Desynchronization*. <https://humanresearchroadmap.nasa.gov/evidence/reports/Sleep.pdf>

**Use.** Frames sleep duration and consistency as core monitoring domains rather than optional wellness data.

**Assumptions and limits.** An evidence synthesis across heterogeneous missions and measurement methods, not an individual clinical guideline.

### 1.3 Space radiation as a health risk

**Claim.** Space radiation is a principal health risk for crews outside Earth's atmosphere, and NASA's Space Radiation Element supports characterisation and mitigation of associated health outcomes.

**Source.** NASA Human Research Program, Space Radiation Element. <https://www.nasa.gov/hrp/radiation/>

**Use.** Frames radiation as a monitoring and operational-planning domain. ORBIT does not implement a NASA risk model and does not present an acute physiological response to radiation.

**Assumptions and limits.** Risk science is uncertain and active; the app's dose estimates are illustrative.

### 1.4 Lunar surface dose

**Claim.** The lunar surface receives chronic galactic cosmic ray and neutron exposure. The Lunar Lander Neutrons and Dosimetry experiment reported an average total absorbed dose rate in silicon of 13.2 ± 1 μGy/hour, including 3.1 ± 0.5 μGy/hour from neutral particles.

**Source.** Zhang S, et al. “First measurements of the radiation dose on the lunar surface.” *Science Advances*, 2020. <https://www.science.org/doi/10.1126/sciadv.aaz1334>

**Use.** Provides an order-of-magnitude anchor for the fictional outpost's external dose rate.

**Assumptions and limits.** Absorbed dose in silicon is not tissue dose equivalent; shielding, solar cycle and habitat design change exposure substantially.

### 1.5 Artemis I dose-equivalent rate

**Claim.** Galactic cosmic ray dose-equivalent rates of roughly 1 mSv per day were measured during the Artemis I lunar mission, with calculated values of 0.96–1.24 mSv/day in the shielded locations studied.

**Source.** “Space radiation measurements during the Artemis I lunar mission.” *Nature*, 2024. <https://www.nature.com/articles/s41586-024-07927-7>

**Use.** Informs the order of magnitude of the external EVA dose rate in the demonstration environment.

**Assumptions and limits.** Values depend on vehicle shielding and solar cycle. The ORBIT habitat is fictional.

### 1.6 Shielding behaviour

**Claim.** Shielding can substantially reduce solar particle event dose, while adding regolith mass does not greatly reduce galactic cosmic ray dose further. A 2024 lunar shielding analysis estimated that more than 4 g/cm² of regolith would reduce expected solar particle event dose below current 30-day limits, while additional mass shielding did not significantly reduce GCR absorbed dose.

**Source.** Matthiä D, et al. “Radiation Exposure and Shielding Effects on the Lunar Surface.” *Space Weather*, 2024. <https://agupubs.onlinelibrary.wiley.com/doi/full/10.1029/2024SW004095>

**Use.** Motivates the shelter mechanic: sheltering lowers the modelled dose rate strongly during a solar particle event.

**Assumptions and limits.** Results depend on event spectra, geometry and material assumptions. ORBIT uses a location multiplier, not a radiation transport calculation.

### 1.7 Cabin CO2 reference

**Claim.** NASA's current 1-hour CO2 reference is an average partial pressure no greater than 3 mmHg in the habitable volume. NASA's technical brief also notes that cognitive studies at spacecraft-relevant CO2 levels have shown mixed results without a clear dose-response pattern.

**Source.** NASA OCHMO, *Technical Brief: Carbon Dioxide* (OCHMO-TB-004). <https://www.nasa.gov/ochmo-tb-004-carbon-dioxide-2>

**Use.** The app converts 3 mmHg at 101.3 kPa to approximately **3,947 ppm** for display. The conversion is labelled a proxy, not a calibrated ppCO2 measurement.

**Assumptions and limits.** Total pressure, humidity, sensor placement and scrubbing performance affect the conversion. A cabin concentration is not an individual exposure measurement, and ORBIT does not claim that a CO2 reading alone establishes cognitive impairment or cabin safety.

### 1.8 Behavioural health evidence

**Claim.** Sleep loss and high workload can co-occur with changes in attention and self-reported stress during spaceflight.

**Source.** NASA HRP, *Evidence Report: Adverse Cognitive or Behavioral Changes and Psychiatric Disorders*. <https://humanresearchroadmap.nasa.gov/evidence/reports/HRP-ER-BMED-HFBP-20250210.pdf>

**Use.** Justifies presenting sleep, fatigue, stress and reaction time together, while avoiding causal language.

**Assumptions and limits.** Evidence is heterogeneous; co-occurrence does not establish that one indicator caused another for a specific crew member.

### 1.9 Cognitive performance across ISS missions

**Claim.** An analysis of cognitive test battery data from astronauts found no evidence of a systematic overall decline across six-month missions, but reported changes in some domains, including processing speed, working memory and sustained attention.

**Source.** “Spaceflight Standard Measures: cognitive performance during six-month International Space Station missions.” *npj Microgravity*, 2025. <https://www.nature.com/articles/s41526-025-00532-6>

**Use.** Motivates within-person trends and repeated measurements rather than a single pass/fail cognitive score.

**Assumptions and limits.** Group-level findings; individual trajectories vary. ORBIT's reaction-time check is not the same instrument.

### 1.10 Personal baselines and multi-system variability

**Claim.** A year-long spaceflight study found multi-system biological changes and substantial inter-individual variability, supporting longitudinal, individualised monitoring.

**Source.** Garrett-Bakelman FE, et al. “The NASA Twins Study: A multidimensional analysis of a year-long human spaceflight.” *Science*, 2019. <https://www.science.org/doi/10.1126/science.aau8650>

**Use.** Supports comparing each crew member with a personal baseline instead of relying only on population thresholds.

**Assumptions and limits.** A twin-pair case study with limited generalisability. ORBIT does not derive parameters from it.

### 1.11 Open data pathway

**Claim.** NASA's Open Science Data Repository provides open access to space biology and spaceflight health data for secondary research.

**Source.** NASA Open Science Data Repository. <https://osdr.nasa.gov/>

**Use.** Identifies a future pathway for validation or recalibration.

**Assumptions and limits.** ORBIT did **not** download, train on, or derive parameters from OSDR records. Any future use would require governance and clinical validation.

---

## 2. Educational approximations

| Approximation | Implementation | Why it is not a validated standard |
| --- | --- | --- |
| CO2 ppm conversion | 3 mmHg at 101.3 kPa ≈ 3,947 ppm | Assumes ideal-gas behaviour and a fixed total pressure; the simulation reports concentration, not calibrated partial pressure |
| Dose from location | Zone dose rate (mSv/day) × duration; SPE intensity multiplier | Not a transport calculation; no tissue weighting, geometry or spectrum modelling |
| Sleep duration | 15-minute sleep ticks × modelled sleep quality, summed over 24 h | Actigraphy-like estimate, not polysomnography |
| Fatigue | Weighted composite of sleep debt, workload, stress and cumulative dose | No validated fatigue instrument; coefficients are illustrative |
| Cognitive index | Linear penalty from fatigue, stress and sleep debt | Not a neurocognitive test score |
| Reaction time | Baseline reaction time scaled by fatigue, sleep debt, stress and a post-test offset | Browser timing and hardware add uncontrolled error |
| Baseline | Trailing 72-hour mean and standard deviation | A short window can adapt to a sustained change and mask a deviation |
| Multi-indicator reasoning | Counts distinct metrics triggering in the same 24-hour window | Co-occurrence is not causation and the threshold of three is arbitrary |

---

## 3. Synthetic parameters

These are chosen to make the demonstration observable. **None is a clinical threshold or a NASA crew limit.**

### 3.1 Detection rules

| Rule | Direction | Percentage | Standardised | Consecutive samples | Level |
| --- | --- | --- | --- | --- | --- |
| Resting heart rate | above baseline | ≥ 8% | ≥ 2σ | 3 | Elevated concern |
| HRV | below baseline | ≥ 18% | ≥ 2σ | 3 | Observation |
| Sleep duration (24 h) | below baseline | ≥ 12% | ≥ 2σ | 2 | Elevated concern |
| Fatigue indicator | above baseline | ≥ 22% | ≥ 2σ | 3 | Elevated concern |
| Reaction time | above baseline | ≥ 10% | ≥ 2σ | 2 | Observation |
| Stress indicator | above baseline | ≥ 30% | ≥ 2.5σ | 3 | Observation |
| SpO2 | absolute | — | — | 2 | Requires review if < 94% |
| Cognitive index | below baseline | ≥ 15% | ≥ 2σ | 3 | Observation |
| Multi-indicator | 3+ distinct metrics | — | — | same window | Elevated concern |

A standardised comparison is used only when the baseline has at least eight observations and non-zero standard deviation. The rules can be edited in Settings; the displayed thresholds update with the stored configuration.

The SpO2 band is a demonstration review flag. It is **not** a validated clinical threshold and **not** a cabin-safety determination.

### 3.2 Environmental bands

| Band | Value | Status |
| --- | --- | --- |
| CO2 nominal | 2,600 ppm | Synthetic habitat setpoint |
| CO2 reference conversion | 3,947 ppm | Approximate conversion of NASA's 3 mmHg 1-hour reference |
| CO2 elevated flag | 6,000 ppm | ORBIT demonstration band |
| CO2 review flag | 9,000 ppm | ORBIT demonstration band |
| Radiation observation | 1.2 mSv/24 h | ORBIT demonstration band |
| Radiation elevated | 2.5 mSv/24 h | ORBIT demonstration band |
| Radiation review | 5 mSv/24 h | ORBIT demonstration band |
| Cumulative review flag | 25 mSv | ORBIT demonstration band |

### 3.3 Habitat dose rates

Illustrative, shielded dose estimates by module: radiation shelter 0.10, medical station 0.40, living quarters 0.42, exercise 0.44, life-support 0.45, laboratory 0.46, solar power 0.62, external EVA 0.95 mSv/day. Solar particle event multipliers range from 0.03 (shelter) to 3.5 (EVA). These are demonstration values, not a shielding analysis.

### 3.4 ORBIT Self-Report v1

Seven dimensions (sleep quality, fatigue, stress, discomfort, workload, mood, concentration) on 0–10 scales, converted to 0–100 scores. It is an ORBIT-designed check-in, **not** a validated clinical questionnaire. It is not the Pittsburgh Sleep Quality Index, the Chalder Fatigue Scale, the Perceived Stress Scale or any other instrument.

---

## 4. Unvalidated hypotheses ORBIT does not assert

- That a specific physiological measurement causes another in an individual astronaut.
- That a co-occurring pattern represents a named medical condition.
- That a modelled fatigue value predicts real-world task performance.
- That a location-based dose estimate predicts an individual's health risk.
- That browser reaction time is a clinically meaningful cognitive assessment.
- That a cabin CO2 reading alone establishes cognitive impairment or immediate danger.
- That any ORBIT alert or decision option is appropriate medical treatment.

ORBIT presents these as context for assessment and documentation, not as conclusions.

---

## 5. What ORBIT does not use

- No real astronaut medical records.
- No NASA dataset, OSDR record or synthetic dataset attributed to NASA.
- No trained machine-learning model for detection or risk prediction.
- No diagnostic labels.
- No invented NASA protocol names or numerical limits.
- No LLM in the alerting path.

The deterministic engine decides whether an alert exists. The optional language model only explains a read-only snapshot and is constrained by the server prompt.

---

## 6. Reference list

1. Jones CW, et al. *SLEEP* 45(3), 2022. <https://academic.oup.com/sleep/article/45/3/zsac006/6505235>
2. NASA HRP. *Evidence Report: Risk of Sleep Loss and Circadian Desynchronization.* <https://humanresearchroadmap.nasa.gov/evidence/reports/Sleep.pdf>
3. NASA HRP. Space Radiation Element. <https://www.nasa.gov/hrp/radiation/>
4. Zhang S, et al. *Science Advances*, 2020. <https://www.science.org/doi/10.1126/sciadv.aaz1334>
5. *Nature*, 2024. Artemis I space radiation measurements. <https://www.nature.com/articles/s41586-024-07927-7>
6. Matthiä D, et al. *Space Weather*, 2024. <https://agupubs.onlinelibrary.wiley.com/doi/full/10.1029/2024SW004095>
7. NASA OCHMO. *Technical Brief: Carbon Dioxide.* <https://www.nasa.gov/ochmo-tb-004-carbon-dioxide-2>
8. NASA HRP. *Evidence Report: Adverse Cognitive or Behavioral Changes and Psychiatric Disorders.* <https://humanresearchroadmap.nasa.gov/evidence/reports/HRP-ER-BMED-HFBP-20250210.pdf>
9. *npj Microgravity*, 2025. Spaceflight Standard Measures. <https://www.nature.com/articles/s41526-025-00532-6>
10. Garrett-Bakelman FE, et al. *Science*, 2019. <https://www.science.org/doi/10.1126/science.aau8650>
11. NASA Open Science Data Repository. <https://osdr.nasa.gov/>
12. NASA Human Research Program. <https://www.nasa.gov/hrp/>

The in-app register at `/research` mirrors these entries and additionally labels every internal assumption.
