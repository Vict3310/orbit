# Simulation and synthetic telemetry model

This document describes exactly how ORBIT generates synthetic observations and how mission conditions change them. Every coefficient is an illustrative educational assumption. None is a validated physiological model.

> The simulator is a supporting feature. It exists to demonstrate the health-consequence chain, not to predict real physiology.

---

## 1. Time base and determinism

| Parameter | Value |
| --- | --- |
| Base tick | 15 simulated minutes |
| Observation interval | 60 simulated minutes |
| Mission start | Day 13, 06:00 MET |
| Seeded history | 7 simulated days before mission start |
| Epoch | 2031-08-14T00:00:00Z (fictional) |
| Default seed | `20260413` |
| Retention | 1,200 observations per crew member |
| Detection cadence | every 6 simulated hours during long advances |
| Per-rule alert cooldown | 12 simulated hours |

The engine is independent of React and of frame rate. `advanceSimulation(state, minutes)` runs fixed 15-minute ticks; one simulated hour is always four ticks. UI speed changes how many minutes are requested per real second, never the tick size.

Random variation comes from a hash of `(seed, tick, astronautId, channel)`, not `Math.random()`. Re-running the same seed with the same actions reproduces the same observations and alerts. The only `Math.random()` in the product is the delay between cues in the browser reaction-time check, which is not part of the simulation.

---

## 2. State

The authoritative state is a single `SimulationState`:

```
seed, clock, tick
crewOrder[], crew{ astronautId → CrewState }
environment{ co2, o2, tempC, pressure, eclss, spe, comms }
scenario{ id, stage, primaryAstronautId, startedMinute, resolution }
events[]
workloadMultiplier
```

Each `CrewState` holds location, activity, fatigue, stress, mood, workload, trailing-24-hour sleep and dose samples, cumulative dose, recent exercise/EVA timestamps, a reaction-time offset from the browser check, subjective self-report, schedule overrides and current vitals.

All observations carry `source: 'SYNTHETIC'`.

---

## 3. Activity scheduling

Each role has a repeating daily template (sleep, rest, work, exercise, medical). Overrides added by the user or a scenario take precedence while active.

| Role | Typical sleep window | Primary work zone |
| --- | --- | --- |
| Commander | 22:00–06:30 | Laboratory / planning |
| Flight Engineer | 23:00–07:00 | Life-support / solar |
| Science Officer | 21:30–06:00 | Laboratory |

Workload baseline by activity: sleep 0, rest 8, medical 20, work 58, exercise 78, EVA 88, scaled by the global workload multiplier (0.5–1.4) and scenario modifiers.

---

## 4. Environmental model

CO2 relaxes toward a target by 8% per 15-minute tick, bounded to 400–20,000 ppm:

```
co2 ← co2 + (co2Target − co2) × 0.08
```

Oxygen relaxes 5% per tick toward 20.9% (nominal) or 20.3% (degraded ECLSS). Temperature relaxes 3% per tick toward 22.4 °C or 24.6 °C. A degraded life-support scenario raises the CO2 target and can schedule a repair; on repair, targets return to nominal and an event is recorded.

The environmental-control scenario sets the target to 8,500 ppm and `eclssStatus = 'critical'`. Decisions set a lower target and a repair time:

| Decision | CO2 target | Repair delay |
| --- | --- | --- |
| Investigate system | 4,200 ppm | 2 h |
| Reduce non-essential operations | 6,200 ppm | 4 h |
| Emergency workflow | 5,200 ppm | 90 min |

A solar particle event carries an intensity and end time. The radiation scenario starts one at intensity 6 for 6 hours and places the selected crew member outside.

---

## 5. Sleep and fatigue

### Sleep

During a sleep activity, each 15-minute tick contributes `(15/60) × sleepQuality` hours. Trailing-24-hour sleep is the sum of samples newer than 1,440 minutes. Sleep debt is:

```
debt = clamp(profile.baseline.sleepHours − sleep24h, 0, 7)
```

With an eight-hour baseline, a four-hour night creates roughly four hours of debt once the window has rolled forward.

### Fatigue

```
sleeping target  = clamp(9 + debt × 4, 0, 90)
awake target     = clamp(15 + debt × 10 + workload × 0.2
                         + stress × 0.12 + cumulativeDose × 0.06, 0, 100)
rest adjustment  = target − 12 when activity is rest
subjective pull  = target × 0.65 + selfReportedFatigue × 0.35
fatigue         += (target − fatigue) × 0.09 awake, × 0.05 sleeping
```

A recent self-assessment therefore influences the model but does not overwrite it. A protected rest period produces partial recovery before sleep debt is repaid.

### Stress

```
target = 14 + workload × 0.42 + debt × 6.5 + scenarioStress
         + 6 if communication loss
stress += (target − stress) × 0.12 awake, × 0.05 sleeping
```

Scenario stress bonuses: fatigue +8, radiation +20, ECLSS +16. A recent self-report pulls the target 40% toward the reported stress.

### Mood

Mood relaxes 5% per tick toward a profile baseline penalised by sleep debt, stress above baseline and fatigue above baseline, with a partial pull from self-report.

---

## 6. Vitals

The following are evaluated every tick from the current modelled state (all coefficients illustrative):

| Signal | Construction |
| --- | --- |
| Resting heart rate | personal baseline + fatigue × 0.13 + stress × 0.035 + circadian (±2.4) + noise |
| Heart rate | resting HR + activity offset (sleep −3, rest/medical +2, work +10, EVA +38, exercise +52) + noise |
| HRV | baseline × (1 − fatigue × 0.0032 − stress × 0.0012) × noise factor |
| Respiratory rate | baseline + fatigue × 0.012 + exercise/EVA offset + noise |
| SpO2 | baseline − CO2 penalty − 0.7 if ECLSS critical + noise; clamped 88–100% |
| Systolic / diastolic | baseline + fatigue and stress terms + noise |
| Reaction time | baseline × (1 + fatigue × 0.0035 + debt × 0.018 + stress × 0.001) × noise × post-test offset |
| Cognitive index | 100 − fatigue × 0.42 − stress × 0.18 − debt × 1.5 |

The CO2 penalty begins above the 3,947 ppm proxy and saturates at 0.8 percentage points. This is a demonstration relationship, **not** a validated exposure-response model. The app does not claim that a single SpO2 reading assesses cabin safety.

Observations add small independent noise, round to the documented precision, and carry activity, location, data-quality and environmental context.

---

## 7. Radiation

```
rate(location, env) = zone.doseRate × (1 + SPE.active ? intensity × zone.speExposure : 0)
dose per tick       = rate / 24 × (15/60)
cumulativeDose     += dose
```

Trailing-24-hour dose is the sum of the dose samples. Zone rates and SPE multipliers are listed in `SCIENCE.md` §3.3. Sheltering reduces the rate by an order of magnitude; continuing an EVA during an event increases it by several times.

Radiation is **not** modelled as an acute cause of heart-rate or other vital changes. Its modelled effects are limited to dose accumulation and a small contribution to the fatigue target (×0.06). This is deliberate: the scientific basis for acute physiological prediction is not established.

---

## 8. Detection

For each crew member, the engine computes a baseline from the trailing 72 hours (minimum eight observations for a standard deviation). Each rule checks the last 24 hours of hourly observations.

A sample breaches when either condition is met:

- percentage deviation from baseline exceeds the rule threshold in the configured direction; or
- standardised deviation exceeds the z threshold, when at least eight observations and non-zero SD exist.

An alert requires the configured number of **consecutive** breaching samples ending at the latest observation. Evidence includes up to eight breaching samples. A rule cooldown of 720 simulated minutes prevents duplicate alerts for the same rule.

Environmental rules run separately for CO2 and radiation. The multi-indicator rule requires three distinct metrics to be triggering in the same window. It is capped at **Elevated concern** because co-occurrence alone does not justify the review band; review is reserved for explicit SpO2 or high-radiation rules.

Exercise within three hours downgrades a resting-heart-rate alert one level and adds a contributing factor.

---

## 9. Decision support

`projectDecision(state, astronautId, kind, horizon)` runs two deterministic branches from the same starting state:

1. apply the decision, then advance the horizon;
2. advance unchanged.

Both branches produce hourly projection points and a summary (fatigue, resting heart rate, reaction time, sleep, cumulative dose). The UI labels them as model projections, not predictions. The decision and its projected/alternative summaries are stored and included in reports.

### Fatigue scenario

Activation adds a 14-hour extended inspection, a 4-hour restricted sleep window and a 6-hour closeout, with workload ×1.25. The decision options:

- **Continue** — inspection proceeds; sleep debt and fatigue accumulate.
- **Schedule additional rest** — 10-hour recovery, 8-hour protected sleep, workload ×0.85.
- **Reassign task** — immediate 2-hour rest, 8-hour protected sleep, low-load tasking, workload ×0.6.

### Radiation scenario

Activation starts a 6-hour SPE and places the crew member outside. Options: continue EVA (highest dose), return to habitat (habitat shielding), enter shelter (lowest dose). The scenario resolves and records the event.

### ECLSS scenario

Activation degrades CO2 removal and raises the cabin target. Options: investigate, reduce operations, or follow the emergency workflow. Each sets a different CO2 target and repair time. Data quality is marked degraded while the system is critical.

---

## 10. Reports

`buildHealthReport` snapshots the selected period:

- mission, crew and reporting period;
- summary paragraphs, observation count and statistics;
- baseline comparison rows;
- alerts, events, assessments, reaction tests and decisions inside the period;
- follow-up items derived from unresolved alerts and active scenario state;
- provenance and limitations.

Observation charts are rendered from retained observations that fall inside the period. If older observations have been pruned, the report still carries summary statistics and states the limitation.

---

## 11. Reproducing a run

1. Use the default seed `20260413`, or enter a seed in Settings.
2. Start a new mission. The seven-day history is regenerated.
3. Activate a scenario and use fixed time advances (+1 h, +6 h, +24 h).
4. The same seed and the same sequence produce the same telemetry and alerts.

The engine test uses seed `424242` and 26 hours of fatigue-scenario advancement, then verifies an explainable alert, a recovery decision and a report.

---

## 12. Deliberate simplifications

- One compartment per module; no spatial dosimetry or airflow field.
- Hourly observations, not continuous waveforms.
- Linear physiological responses with saturation bounds.
- No pharmacokinetics, illness states, injury or treatment.
- No cardiovascular adaptation to microgravity or lunar gravity.
- No individual calibration against real data.
- A single-day schedule template per role, with overrides.
- Small event vocabulary and no cascading system failures.

These are choices of scope, not claims of fidelity.
