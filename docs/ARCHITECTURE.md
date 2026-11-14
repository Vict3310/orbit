# Architecture

ORBIT is a local-first React application with an optional explanation API. Deterministic engines sit outside the UI and are shared by the dashboard, simulator and report generator.

---

## 1. System context

```
┌──────────────────────────── Browser (offline-capable) ────────────────────────────┐
│                                                                                   │
│  React routes / components                                                        │
│        │                                                                          │
│        ▼                                                                          │
│  Zustand store  ──────────────►  Dexie / IndexedDB                                 │
│        │                         workspace snapshot + domain tables                │
│        │                                                                          │
│        ├──► simulation engine ──► health model ──► synthetic observations          │
│        ├──► baseline engine   ──► anomaly engine ──► explained alerts              │
│        ├──► projection engine ──► decision branches                                │
│        ├──► reporting engine  ──► printable health report                          │
│        └──► local explainer   ──► ORBIT MED fallback                               │
│                                                                                   │
└───────────────────────────────────┬───────────────────────────────────────────────┘
                                    │ optional HTTPS POST /api/med/explain
                                    ▼
                       ┌────────────────────────────┐
                       │ Node / Express (optional)   │
                       │ Zod → rate limit → OpenAI   │
                       │ constrained system prompt   │
                       └────────────────────────────┘
```

The browser is authoritative. Losing the API or the network never blocks monitoring, detection, simulation, assessments or reports.

---

## 2. Repository layout

```
orbit/
├── client/
│   ├── public/                     icons, favicon
│   ├── scripts/generate-icons.mjs  deterministic PNG icon writer
│   ├── src/
│   │   ├── app/                    App, AppShell, routing, bootstrap
│   │   ├── components/
│   │   │   ├── ui/                 Panel, Button, Badge, Meter, Segmented…
│   │   │   ├── telemetry/          vitals, deltas
│   │   │   ├── astronauts/         avatars, crew cards, baseline table
│   │   │   ├── alerts/             alert list, toast
│   │   │   ├── simulation/         habitat map, scenario deck, decision panel
│   │   │   ├── charts/             Recharts wrappers
│   │   │   ├── assessments/        reaction-time test
│   │   │   ├── assistant/          ORBIT MED drawer
│   │   │   ├── mission/            event timeline
│   │   │   └── layout/             sidebar, top bar, mobile navigation
│   │   ├── pages/                  one component per route
│   │   ├── engines/
│   │   │   ├── simulation/         rng, config, health model, simulator, scenarios, projection
│   │   │   ├── health/             metrics, baseline
│   │   │   ├── anomaly/            deterministic detection
│   │   │   ├── reporting/          report builder
│   │   │   └── explain/            offline explanation engine
│   │   ├── store/                  Zustand workspace and actions
│   │   ├── services/               Dexie schema, persistence, API client, AI context
│   │   ├── data/                   fictional crew, assessment items, research register
│   │   ├── types/                  domain model
│   │   ├── lib/                    formatting, severity
│   │   ├── styles/                 Tailwind layers and print styles
│   │   └── tests/                  Vitest setup and engine tests
│   ├── e2e/                        Playwright journey
│   └── vite.config.ts              React, PWA, proxy, Vitest
├── server/
│   └── src/
│       ├── index.ts                Express app, health route, error handling
│       ├── routes/med.ts           Zod validation, rate limit, OpenAI call
│       ├── services/prompt.ts      constrained system prompt
│       ├── middleware/rateLimit.ts fixed-window limiter
│       └── config/env.ts           environment parsing
├── docs/                           science, architecture, simulation, demo, limitations
└── package.json                    npm workspaces and orchestration scripts
```

---

## 3. Runtime flow

### 3.1 Bootstrap

1. `main.tsx` mounts React, `BrowserRouter`, and the global styles.
2. `App` calls `loadWorkspace()` from IndexedDB.
3. On success, `hydrate(snapshot)` restores mission, simulation, observations, alerts, assessments, tests, decisions, reports, selection and settings.
4. On failure or empty storage, the seeded in-memory workspace remains.
5. Autosave subscribes to state changes and writes the snapshot at most every 1.5 seconds (a pending write is never postponed by new simulation ticks), plus an immediate write on page hide.
6. If the simulation is running, a one-second interval calls `tick(1)`, which converts elapsed real time into simulated minutes using the configured speed.

### 3.2 A simulation advance

```
advance(minutes)
  ├─ split into 6-hour chunks
  ├─ advanceSimulation(chunk)
  │    ├─ fixed 15-minute ticks
  │    ├─ resolve activity and overrides
  │    ├─ update environment, sleep, fatigue, stress, mood, vitals
  │    ├─ accumulate radiation
  │    ├─ emit hourly synthetic observations
  │    └─ emit environmental/crew events
  ├─ trim observations to 1,200 per crew member
  ├─ runDetection(chunk end)
  │    ├─ computeBaseline (72 h rolling)
  │    ├─ evaluate all rules + environmental + multi-factor
  │    ├─ deduplicate with a 720-minute cooldown
  │    └─ append alerts
  └─ set state; optionally auto-pause on a review alert
```

Chunking is important: advancing 30 hours still evaluates detection every six hours, so a transient deviation is not lost by only checking the final state.

### 3.3 An alert

`detectAnomalies` receives the profile, observations, baseline, rules, environment, communication state, scenario id and crew context. It returns fully formed `HealthAlert` objects containing:

- rule id/label, metric, current and baseline value, percentage and z deviation;
- the time window and up to eight evidence samples;
- contributing factors from the mission context;
- limitations, including degraded data quality;
- a recommended assessment workflow and a prototype level.

The UI never constructs clinical claims. It renders these fields.

### 3.4 Decision support

`projectDecision` clones the state twice: one branch applies the operational decision, the other advances unchanged. Both run the same deterministic engine for the horizon. The store records the chosen decision with both summaries, so the report can show the counterfactual.

---

## 4. State and persistence

`useOrbitStore` is a single Zustand store. Domain state is grouped into mission, simulation, observations, alerts, assessments, cognitive tests, decisions, reports, selection and settings. Transient UI state (running, demo mode, toast, assistant drawer, intro completion) is kept alongside but excluded from persistence.

Dexie tables:

| Table | Purpose |
| --- | --- |
| `workspace` | Authoritative snapshot (`id: 'main'`) |
| `astronauts` | Profile records |
| `observations` | Recent queryable observation mirror |
| `alerts` | Alert records |
| `assessments` | Self-report records |
| `cognitiveTests` | Reaction-time records |
| `decisions` | Operational decisions |
| `reports` | Generated reports |
| `baselines` | Computed baseline snapshots |
| `events` | Mission events |

The snapshot is authoritative because it contains the complete simulation state, including schedule overrides and samples. Domain tables make records inspectable and support future querying.

Limits: 1,200 observations per crew member, 500 alerts, 200 assessments, 200 cognitive tests, 100 decisions, 30 reports, 240 events. Trimming prevents unbounded browser storage growth.

---

## 5. UI composition

- `AppShell` provides the skip link, fixed desktop sidebar, top bar, mobile bottom navigation, toast host and ORBIT MED drawer.
- Each page owns its local filters and view state. Shared domain state comes from Zustand selectors.
- Charts are Recharts wrappers with units, legends, tooltips, accessible captions and optional event markers.
- Print CSS hides navigation and the top bar, removes page padding and preserves panel colours for PDF export.
- Reduced motion is honoured both by the OS media query and by an in-app setting that sets Framer Motion's `reducedMotion="always"` and a CSS class.

Responsive behaviour is not a scaled desktop layout: the sidebar becomes a drawer, a five-item bottom navigation appears, telemetry grids collapse to single columns, and tables scroll horizontally with captions.

---

## 6. AI boundary

The client builds a read-only context bundle containing the selected profile, latest observation, baseline, active alert summaries and environment. The server:

1. accepts a bounded JSON body validated by Zod;
2. applies a fixed-window rate limit;
3. rejects disallowed origins via CORS configuration;
4. constructs a constrained system prompt that forbids diagnosis, invented protocols, state changes and fabricated measurements;
5. calls OpenAI and returns text plus fixed source references.

The API key stays on the server. If the request fails, the client shows a notice and uses the local explanation engine. The assistant cannot call store actions.

---

## 7. Failure handling

- IndexedDB unavailable → seeded in-memory mission; UI remains usable, persistence errors are swallowed after logging at the call site.
- API absent or key missing → local explanations; `/api/health` reports `aiConfigured: false`.
- Route not found → in-app 404 with return link.
- Render fault → error boundary with a reload action and a note that stored data is separate.
- Degraded ECLSS → observations flagged `dataQuality: 'degraded'`, surfaced in alert limitations.

---

## 8. Testing strategy

- **Vitest engine tests:** determinism, warmup history, baseline method, deviation classification, fatigue scenario detection, explainability, recovery branch, nominal no-alert case, radiation shelter comparison, assessment scoring, local explanation, projection branches, report contents.
- **Critical integration test:** the full product path from seeded mission to report.
- **Typecheck:** strict client and server compilation.
- **Production build:** Vite bundle, PWA service worker and Express compilation.
- **Playwright:** browser journey across initialization, dashboard, simulator and report.

---

## 9. Trade-offs

- A single Zustand store is simpler than multiple contexts and keeps the workflow coherent, at the cost of a large store file.
- A full snapshot plus mirrored tables duplicates some data, but makes restore robust and preserves inspectable records.
- Recharts adds bundle weight; the build warns about chunk size. Route-level code splitting is the obvious next optimisation.
- The simulator uses SVG/CSS rather than 3D, prioritising clarity, accessibility and time-to-demo.
- No authentication or multi-user sync: out of scope, and explicitly not faked.
