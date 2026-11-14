# ORBIT

**Autonomous Astronaut Health Intelligence & Mission Simulation**
*Beyond monitoring. Toward mission resilience.*

ORBIT is a working educational prototype built for the **NASA International Space Apps Challenge 2026**, registered to the **Health Monitoring Software for Astronauts on Space Missions** challenge by **Miva University**.

It connects clearly labelled synthetic physiological telemetry to mission context: personal baselines, deterministic anomaly detection, explainable alerts, structured assessment, an interactive lunar-outpost simulator, operational decision support, and locally generated mission health reports.

> **Educational prototype. All crew, telemetry and mission conditions are synthetic. ORBIT is not a medical device and must not be used for clinical or real mission decisions.**

---

## The problem

Long-duration crews operate with communication delays, limited access to specialists, and long stretches where a trend matters more than a single reading. A conventional monitor can display heart rate, sleep and environmental values, but it does not answer the operational questions:

- Is this value unusual **for this astronaut**?
- Which measurements changed together, and what mission context surrounded them?
- Why did the system raise an alert, and how much confidence should we place in it?
- What assessment would add useful context?
- If we change the schedule or move the crew member, what might happen next?
- How do we document the decision and its rationale for later review?

## The solution

ORBIT implements a complete, inspectable workflow:

```
Mission conditions → synthetic observations → personal baseline
→ deterministic detection → explainable alert → structured assessment
→ operational decision → modelled consequences → health report
```

Every step is connected to the same local state. Alerts are not hardcoded; they are produced by rules over observations. Decisions fork the simulation deterministically. Reports are generated from the retained history.

### Primary capability: health monitoring

| Capability | What it does |
| --- | --- |
| Crew dashboard | Cardiovascular, respiratory, sleep/recovery, behavioural and environmental telemetry with units, source labels and baseline deltas |
| Personal baselines | 72-hour rolling mean and standard deviation per crew member, with a synthetic profile fallback |
| Anomaly engine | Configurable percentage and standardised-deviation rules with consecutive-sample confirmation |
| Explainable alerts | Triggering evidence, baseline value, rule, time window, context, contributing factors, limitations, recommended assessment workflow |
| Multi-indicator intelligence | Flags three or more co-occurring indicator changes without asserting causation |
| Assessments | ORBIT Self-Report v1 (seven 0–10 dimensions) and a five-trial visual reaction-time check |
| Reports | Printable, locally generated mission health report with provenance and explicit limitations |
| ORBIT MED | Optional cloud explanation layer with a complete local fallback and source references |

### Supporting capability: mission simulation

A fictional lunar south-polar outpost with eight interactive modules, three deterministic scenarios, a habitat schematic, environmental exposure estimates, scheduling controls, and counterfactual decision projections.

The simulation exists to make the health-consequence chain visible. It is not a survival game, and the majority of the interface is dedicated to monitoring, explanation, assessment and documentation.

---

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Mission initialization sequence and demo entry |
| `/presentation` | Full-screen 16:9 judging deck with embedded launch film |
| `/dashboard` | Primary health intelligence overview |
| `/astronauts` | Crew profiles and personal baselines |
| `/astronauts/:astronautId` | Individual monitoring history and assessments |
| `/simulation` | Habitat operations, scenarios and decision support |
| `/alerts` | Alert queue with full evidence and workflow |
| `/assessments` | Self-report and reaction-time assessment |
| `/reports` | Report generation and local archive |
| `/reports/:reportId` | Printable mission health report |
| `/research` | Source register, assumptions and non-claims |
| `/settings` | Seed, rules, communication state, persistence and accessibility |

---

## Judging presentation and launch film

ORBIT ships with a presentation built for a 16:9 judging display. It is not a slide export: it is a keyboard-driven React route that uses the real product screens and plays the rendered film in place.

- Open **`/presentation`**, or use **Judging presentation** on the intro screen or in the sidebar.
- **← / →** or **Space** moves between the ten slides; **Home / End** jumps to the ends.
- **F** toggles fullscreen, **N** opens speaker notes, and **Esc** exits fullscreen.
- The final film slide embeds `/media/orbit-launch-1080p.mp4` and links to the full MP4.

### Film deliverables

| File | Specification |
| --- | --- |
| `client/public/media/orbit-launch-1080p.mp4` | 1920 × 1080, 60 fps, 40.0 s, H.264, AAC stereo 48 kHz |
| `client/public/media/orbit-launch-preview.mp4` | 1280 × 720 preview, H.264/AAC, fast-start |
| `client/public/media/orbit-launch-thumbnail.png` | 1920 × 1080 thumbnail |
| `video/` | Editable Remotion source, seven scenes, brand system and score generator |

The film is a seven-scene narrative: fragmented signals → ORBIT identity → contextual baselines → explainable alert → simulated decision → connected workflow → closing statement. It uses the real application screenshots in `client/public/presentation/`, an original procedural score, and no stock footage or licensed music.

### Rebuild the film

```bash
cd video
npm install
npm run studio          # Remotion Studio, edit scenes and preview
npm run render          # 1080p60 H.264, outputs video/out/
npm run render:preview  # 1280 × 720 preview
npm run thumbnail       # still at frame 2300
npm run audio           # regenerate the 40 s procedural score
```

After rendering, copy the three outputs into `client/public/media/`. The deck reads those paths directly. The Remotion project is intentionally separate from the app workspace so its render dependencies do not affect the client build.

## Technology

**Frontend:** React 18, TypeScript, Vite 6, Tailwind CSS, Zustand, Motion (Framer Motion), Recharts, Lucide React, React Router, Zod, Dexie / IndexedDB, `vite-plugin-pwa`.

**Backend (optional):** Node.js, Express, TypeScript, Zod, rate limiting, OpenAI API for explanation only.

**Testing:** Vitest, React Testing Library (configured), Playwright.

**Deployment target:** static frontend on Cloudflare Pages or Vercel; optional Node host for the explanation service.

---

## Quick start

Requirements: Node.js **20 or newer**, npm 10+.

```bash
npm install
npm run dev
```

- Web application: <http://127.0.0.1:5173>
- Optional explanation API: <http://127.0.0.1:8787>

The application starts with a deterministic seven-day synthetic history, so the dashboard is populated immediately. No API key, account or network connection is required for monitoring, detection, simulation, assessments, reports or the local explanation engine.

### Production build

```bash
npm run build
npm run preview        # static frontend on http://127.0.0.1:4173
```

`npm run build` typechecks and builds the client, builds the service worker and web manifest, then compiles the server to `server/dist`.

### Tests

```bash
npm test               # Vitest: engines, scenarios, detection, reporting
npm run typecheck      # client and server TypeScript
npm run test:e2e       # Playwright browser journey
```

Playwright needs a browser once: `npx playwright install chromium`.

The Vitest suite includes the critical integration path: seeded mission → crew selection and baseline → fatigue scenario → advanced simulated time → changed telemetry → detection → explained alert → rest decision → modelled recovery → report.

---

## Environment variables

Copy `.env.example` to `.env` at the repository root if you want the optional AI explanation service. The frontend never receives these values.

| Variable | Required | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` | No | Enables cloud explanations. Without it ORBIT MED uses the local engine and the app is fully functional. |
| `OPENAI_MODEL` | No | Model name used by the server; defaults to `gpt-4o-mini`. |
| `PORT` | No | API port, default `8787`. |
| `CLIENT_ORIGIN` | No | Comma-separated allowed browser origins. Defaults cover local development on ports 5173 and 4173. |

Never commit a real key. The server validates requests with Zod, limits body size to 64 kB, rate-limits the explanation endpoint, and constrains the model to an educational, read-only role.

---

## Offline behaviour

`vite-plugin-pwa` precaches the application shell. IndexedDB stores the authoritative workspace snapshot plus queryable domain tables. Simulation, baseline comparison, detection, assessment scoring, local explanations and report generation run in the browser.

The top bar can simulate **nominal**, **one-way delay** and **loss of signal**. Under loss of signal, cloud explanations are unavailable and the local engine answers instead; nothing claims to synchronise with Earth.

The development server does not register a service worker. Offline installation and caching apply to a production build served over HTTPS (or localhost).

---

## Deployment

### Frontend

- **Build command:** `npm run build:client`
- **Output directory:** `client/dist`
- **SPA routing:** rewrite all unknown paths to `/index.html`
- **HTTPS:** required for service-worker installation outside localhost

Cloudflare Pages and Vercel both support this configuration. The build already contains the generated `sw.js`, `manifest.webmanifest` and icons.

### Optional explanation API

- **Build:** `npm run build:server`
- **Start:** `npm start` (runs `node server/dist/index.js`)
- **Bind address:** the server listens on `127.0.0.1`; place it behind your platform's proxy or adjust the bind for a container.
- **Variables:** set `OPENAI_API_KEY` and `CLIENT_ORIGIN` in the host's secret/environment settings.

If the API is unavailable, the frontend continues to work; ORBIT MED falls back to local explanations.

---

## Scientific integrity

- All physiological values are generated by an educational model; no NASA astronaut medical records were used.
- Every alert states its rule, evidence, window and limitations.
- Research-supported statements are separated from educational approximations, synthetic parameters and unvalidated hypotheses in [docs/SCIENCE.md](docs/SCIENCE.md).
- The AI assistant cannot diagnose, prescribe, override deterministic alerts, modify state, or invent measurements.
- The reaction-time check is a browser measurement, not a clinically validated cognitive test.

Full assumptions are in [docs/LIMITATIONS.md](docs/LIMITATIONS.md).

---

## Documentation

- [docs/SCIENCE.md](docs/SCIENCE.md) — claim-by-claim sources, conversions and non-claims
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — modules, state flow, persistence and boundaries
- [docs/SIMULATION.md](docs/SIMULATION.md) — synthetic telemetry and consequence model
- [docs/DEMO.md](docs/DEMO.md) — three-minute judging walkthrough
- `video/` — editable Remotion launch film and procedural score
- [docs/LIMITATIONS.md](docs/LIMITATIONS.md) — clinical, scientific and technical limits

---

## Team

**Miva University** — ORBIT team.

Built for the NASA International Space Apps Challenge 2026, Health Monitoring Software for Astronauts on Space Missions.

*ORBIT transforms astronaut health monitoring from isolated measurements into contextual, explainable mission intelligence.*
