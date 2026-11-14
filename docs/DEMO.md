# Three-minute judging demonstration

This is the deterministic path used for the recorded demo. It requires no API key and no network after the page loads.

**Before you start:** run `npm run dev`, open <http://127.0.0.1:5173>, and use a desktop viewport. The intro sequence is under three seconds and can be skipped.

**Presentation option:** open `/presentation` for the ten-slide 16:9 judging deck, or use **Judging presentation** on the intro screen. Arrow keys or Space advance, `N` opens speaker notes, `F` enters fullscreen, and slide 09 plays the 40-second launch film in place.

---

## 0:00–0:25 — The problem

On screen: the initialization page.

Say:

> Long-duration crews cannot rely on a call to Earth for every changing measurement. Communication may be delayed or unavailable, and a value that is normal for one astronaut may be unusual for another. The hard question is not “what is the heart rate?” It is “what changed, why does it matter, and what should we do next?”

Point to the operational loop: monitor, detect, explain, assess, simulate, document.

---

## 0:25–0:50 — The solution

Click **Enter mission control** (or **Skip sequence & enter**).

On the dashboard:

> ORBIT connects synthetic telemetry to mission context. It compares each crew member with their own 72-hour baseline, explains every rule-based alert, supports structured assessment, and lets the team model operational decisions before committing to them.

Point out the **SIMULATED** labels, the seeded mission, and the offline-first indicator.

---

## 0:50–1:20 — Monitoring and baseline

1. In the crew strip, select **Commander Adaeze Okafor** if not already selected.
2. Point to the current vitals: resting heart rate, HRV, respiratory rate, SpO2, sleep, fatigue, reaction time.
3. Scroll to **Personal baseline** and the heart-rate trend.
4. Open **Astronauts → Commander** if you want the fuller profile and baseline table.

Say:

> The values are synthetic, and the source is labelled. The baseline is a transparent rolling mean with a standard deviation once enough observations exist. We are not using a hidden model or a generic population cutoff.

---

## 1:20–1:50 — Mission event

1. Click **Mission Simulator** in the sidebar.
2. In **Scenario 01 — Fatigue During a Critical Mission**, click **Activate scenario**.
3. Point to the event log and the restricted 4-hour sleep window.
4. Click **+24 h**, then **+6 h** (advance roughly 30 simulation hours).
5. Watch sleep duration, fatigue and resting heart rate change.

Say:

> The commander has been given a 14-hour inspection and only four hours of sleep. ORBIT's consequence engine changes sleep debt, modelled fatigue, cardiovascular indicators and reaction time deterministically. This is an educational model, not a physiological prediction.

---

## 1:50–2:15 — Detection and explanation

1. Click **Alerts** in the sidebar.
2. Open the newest alert (or the multi-indicator alert).
3. Walk through:
   - current value vs personal baseline and delta;
   - triggering evidence table;
   - the exact rule and 24-hour window;
   - mission context chips (activity, zone, comms, scenario);
   - contributing factors;
   - limitations;
   - recommended assessment workflow.

Say:

> The alert exists because consecutive samples crossed a configurable prototype rule. It shows the evidence, the baseline, the window and the limitations. It does not diagnose anything, and the language deliberately says “co-occurred”, not “caused”.

Optional: click **Explain with ORBIT MED** to show the assistant's constrained explanation and source links. If the API has no key, point out that the local engine answers instead.

---

## 2:15–2:40 — Decision and consequences

1. Return to **Mission Simulator**.
2. In the decision panel, select **Schedule additional rest**.
3. Read the projected vs as-planned fatigue, resting heart rate and reaction time.
4. Click **Record decision** (or the equivalent action in the panel).
5. Advance **+24 h**.
6. Point to the event log and the changed indicators.

Say:

> The simulator runs two deterministic branches from the same state: the mission as planned, and the mission with the decision applied. We record the decision, its rationale and both projections. The crew member gets a 10-hour recovery period and a protected 8-hour sleep window; the model shows partial recovery rather than an instant reset.

If the decision panel has already been resolved by the scenario, restart via **Settings → Load judging demo** and repeat the decision.

---

## 2:40–3:00 — Report and impact

1. Click **Reports**.
2. Choose the commander, keep the 7-day period, click **Generate report**.
3. Show the report: summary, baseline comparison, heart-rate and sleep charts, alerts, assessments, decisions, follow-up items, provenance and limitations.
4. Click **Print / save PDF** if demonstrating export.
5. Close with the footer disclaimer.

Say:

> This is the complete loop: mission conditions, observations, baseline comparison, detection, explanation, assessment, decision, modelled consequence and documentation. Everything runs locally, and the report states exactly what is simulated and what is not. ORBIT transforms astronaut health monitoring from isolated measurements into contextual, explainable mission intelligence.

---

## Reset and recovery

- **Restart the demo:** Settings → **Load judging demo**. This reloads the fixed seed, applies the fatigue scenario and starts the clock at 240×.
- **Fresh mission:** Settings → set a seed → **Start new mission**.
- **Clear stored data:** Settings → **Reset local data** (destructive; confirms first).
- **No API key:** everything above still works. ORBIT MED will use the local explanation engine.

---

## Timing card

| Time | Beat | Screen |
| --- | --- | --- |
| 0:00 | Problem and operational loop | Intro |
| 0:25 | Product framing | Dashboard |
| 0:50 | Crew telemetry and baseline | Dashboard / Astronaut profile |
| 1:20 | Fatigue scenario and time advance | Simulator |
| 1:50 | Evidence and limitations | Alerts |
| 2:15 | Rest decision and projection | Simulator |
| 2:40 | Report and offline impact | Reports |

---

## Judge questions to expect

**“Is this real astronaut data?”**
No. Every crew member and physiological value is synthetic and labelled. A seeded model generates the history; no NASA medical records were used.

**“Did an AI decide the alert?”**
No. Detection is deterministic and local. The optional model only explains a read-only snapshot.

**“Are these clinical thresholds?”**
No. Every rule and band is a configurable demonstration assumption. The app says so on the alert, in Settings and in the report.

**“What happens without internet?”**
Monitoring, simulation, alerts, assessments, local explanations and reports continue. The service worker caches the shell; IndexedDB stores the workspace. Nothing claims to sync with Earth.

**“How is this different from a dashboard?”**
The same state drives monitoring, detection, assessment, a counterfactual simulator and the report. The alert's evidence comes from the observations, and the decision changes the modelled trajectory.
