import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Gauge,
  Pause,
  Play,
  Radiation,
  ShieldCheck,
  SlidersHorizontal,
  Wind,
} from 'lucide-react';
import type { ZoneId } from '../types/domain';
import { ASTRONAUT_BY_ID } from '../data/astronauts';
import { useOrbitStore } from '../store/orbitStore';
import { CO2_REFERENCE_PPM, ZONES } from '../engines/simulation/config';
import { doseRateFor, sleep24Hours } from '../engines/simulation/healthModel';
import { formatMET, missionDay } from '../lib/format';
import { Badge, Button, InlineNote, Meter, PageHeader, Panel, Segmented, cn } from '../components/ui';
import { CrewAvatar } from '../components/astronauts/CrewAvatar';
import { HabitatMap, ZoneSelector } from '../components/simulation/HabitatMap';
import { ScenarioDeck } from '../components/simulation/ScenarioDeck';
import { DecisionPanel } from '../components/simulation/DecisionPanel';
import { MissionTimeline } from '../components/mission/MissionTimeline';

export default function Simulation() {
  const sim = useOrbitStore((s) => s.sim);
  const selectedId = useOrbitStore((s) => s.selectedAstronautId);
  const running = useOrbitStore((s) => s.running);
  const speed = useOrbitStore((s) => s.settings.speed);
  const setRunning = useOrbitStore((s) => s.setRunning);
  const setSpeed = useOrbitStore((s) => s.setSpeed);
  const advance = useOrbitStore((s) => s.advance);
  const selectAstronaut = useOrbitStore((s) => s.selectAstronaut);
  const moveAstronaut = useOrbitStore((s) => s.moveAstronaut);
  const scheduleRest = useOrbitStore((s) => s.scheduleRest);
  const setWorkload = useOrbitStore((s) => s.setWorkloadMultiplier);
  const setComms = useOrbitStore((s) => s.setComms);

  const [selectedZone, setSelectedZone] = useState<ZoneId>('quarters');
  const zone = ZONES[selectedZone];
  const dose = doseRateFor(selectedZone, sim.env);
  const occupants = sim.crewOrder
    .map((id) => sim.crew[id])
    .filter((crew) => crew.location === selectedZone);
  const profile = ASTRONAUT_BY_ID[selectedId];

  const selectedCrew = sim.crew[selectedId];
  const sleep = selectedCrew ? sleep24Hours(selectedCrew) : 0;

  const environmentalLevel = useMemo(() => {
    if (sim.env.eclssStatus === 'critical') return 'critical' as const;
    if (sim.env.co2 > 6000) return 'elevated' as const;
    if (sim.env.co2 > CO2_REFERENCE_PPM) return 'observation' as const;
    return 'normal' as const;
  }, [sim.env]);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Mission simulator"
        title="Selene-4 habitat operations"
        description="Change mission conditions and watch the deterministic health-consequence engine respond. Every number produced here is clearly labelled synthetic."
        actions={
          <>
            <Badge tone={sim.env.spe?.active ? 'critical' : 'muted'}>
              {sim.env.spe?.active ? 'SPE ACTIVE' : `DAY ${missionDay(sim.clock)} · SIM`}
            </Badge>
            <Button variant={running ? 'secondary' : 'primary'} onClick={() => setRunning(!running)}>
              {running ? <Pause size={13} /> : <Play size={13} />}
              {running ? 'Pause mission' : 'Run mission'}
            </Button>
          </>
        }
      />

      <div className="grid gap-3 xl:grid-cols-12">
        <Panel
          className="xl:col-span-8"
          title="Habitat schematic"
          meta={`${zone.label} · select a module`}
          action={
            <div className="flex items-center gap-2">
              <Badge tone={sim.env.spe?.active ? 'critical' : 'ok'}>
                {sim.env.spe?.active ? 'SHELTER RECOMMENDED' : 'ENV NOMINAL'}
              </Badge>
              <span className="font-mono text-[9px] text-muted">{formatMET(sim.clock)}</span>
            </div>
          }
          bodyClassName="p-0"
        >
          <HabitatMap sim={sim} selectedZone={selectedZone} onSelectZone={setSelectedZone} />
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-3 py-2">
            <ZoneSelector sim={sim} selectedZone={selectedZone} onSelectZone={setSelectedZone} />
            <span className="font-mono text-[8px] uppercase tracking-[0.05em] text-muted/60">
              Dose rates are illustrative · not a shielding analysis
            </span>
          </div>
        </Panel>

        <div className="space-y-3 xl:col-span-4">
          <Panel title="Mission controls" meta="Clock independent of frame rate">
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="label mb-1">Mission elapsed time</div>
                <div className="font-mono text-[24px] leading-none text-ink numeric">
                  {formatMET(sim.clock)}
                </div>
              </div>
              <Button size="sm" variant={running ? 'secondary' : 'primary'} onClick={() => setRunning(!running)}>
                {running ? <Pause size={12} /> : <Play size={12} />}
                {running ? 'Pause' : 'Run'}
              </Button>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="label">Speed</span>
              <Segmented
                ariaLabel="Simulation speed"
                value={speed}
                onChange={setSpeed}
                options={[
                  { value: 15, label: '15m/s' },
                  { value: 60, label: '1h/s' },
                  { value: 240, label: '4h/s' },
                  { value: 480, label: '8h/s' },
                ]}
              />
            </div>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              <Button size="sm" onClick={() => advance(60)}>
                +1 h
              </Button>
              <Button size="sm" onClick={() => advance(360)}>
                +6 h
              </Button>
              <Button size="sm" onClick={() => advance(1440)}>
                +24 h
              </Button>
            </div>
            <div className="mt-4 border-t border-line pt-3">
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="workload" className="label">
                  Workload multiplier
                </label>
                <span className="font-mono text-[10px] text-ink">×{sim.workloadMultiplier.toFixed(2)}</span>
              </div>
              <input
                id="workload"
                type="range"
                min={0.5}
                max={1.4}
                step={0.05}
                value={sim.workloadMultiplier}
                onChange={(event) => setWorkload(Number(event.target.value))}
                className="w-full"
                aria-describedby="workload-hint"
              />
              <p id="workload-hint" className="mt-1 text-[9px] leading-4 text-muted">
                Scales modelled task load for all crew. Applies on the next tick; it does not rewrite
                historical observations.
              </p>
            </div>
            <div className="mt-3 border-t border-line pt-3">
              <span className="label mb-1.5 block">Earth communication</span>
              <Segmented
                ariaLabel="Communication status"
                value={sim.env.comms}
                onChange={(value) => setComms(value)}
                options={[
                  { value: 'nominal', label: 'Nominal' },
                  { value: 'delay', label: 'Delay' },
                  { value: 'loss', label: 'Loss' },
                ]}
              />
              <p className="mt-1.5 text-[9px] leading-4 text-muted">
                Loss of signal demonstrates local autonomy: monitoring, alerts, simulation, reports
                and the local explanation engine keep running.
              </p>
            </div>
          </Panel>

          <Panel title="Selected crew" meta={profile.name} bodyClassName="p-3">
            <div className="flex items-center gap-3">
              <CrewAvatar profile={profile} size={46} />
              <div className="min-w-0">
                <div className="font-display text-[13px] text-ink">{profile.name}</div>
                <div className="font-mono text-[9px] uppercase tracking-[0.05em] text-muted">
                  {selectedCrew?.activity} · {selectedCrew?.location}
                </div>
                <div className="mt-1 font-mono text-[9px] text-muted">
                  Fatigue {(selectedCrew?.fatigue ?? 0).toFixed(0)} · sleep {sleep.toFixed(1)} h · dose{' '}
                  {(selectedCrew?.cumulativeDose ?? 0).toFixed(2)} mSv
                </div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-1.5">
              <Button size="sm" variant="secondary" onClick={() => scheduleRest(selectedId, 6)}>
                Schedule rest · 6 h
              </Button>
              <Link to={`/astronauts/${selectedId}`} className="btn btn-secondary py-1 text-[11px]">
                Health profile
              </Link>
            </div>
            <InlineNote>
              Rest provides partial recovery before sleep debt is repaid. The model is illustrative.
            </InlineNote>
          </Panel>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-12">
        <Panel
          className="xl:col-span-5"
          title={zone.label}
          meta={`${zone.short} · ${occupants.length}/${zone.capacity} crew`}
          action={
            <Badge tone={sim.env.spe?.active && selectedZone === 'eva' ? 'critical' : 'muted'}>
              {dose.toFixed(2)} mSv/d
            </Badge>
          }
        >
          <p className="text-[11px] leading-5 text-muted">{zone.description}</p>
          <div className="mt-3 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
            <Readout label="Dose rate" value={dose.toFixed(2)} unit="mSv/d" tone={sim.env.spe?.active ? 'caution' : 'ink'} />
            <Readout label="Temperature" value={sim.env.tempC.toFixed(1)} unit="°C" />
            <Readout label="Occupancy" value={`${occupants.length}/${zone.capacity}`} unit="crew" />
            <Readout
              label="CO₂"
              value={Math.round(sim.env.co2).toString()}
              unit="ppm"
              tone={environmentalLevel === 'critical' ? 'critical' : 'ink'}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-1">
            {zone.systems.map((system) => (
              <span key={system} className="chip">
                {system}
              </span>
            ))}
          </div>
          <div className="mt-3 border-t border-line pt-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="label">Crew assignment</span>
              <span className="font-mono text-[8px] uppercase text-muted">3 h override</span>
            </div>
            <div className="space-y-1.5">
              {sim.crewOrder.map((id) => {
                const crew = sim.crew[id];
                const crewProfile = ASTRONAUT_BY_ID[id];
                const here = crew.location === selectedZone;
                return (
                  <div key={id} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 font-mono text-[10px] text-muted">
                      <span
                        aria-hidden
                        className="inline-block h-1.5 w-1.5"
                        style={{ background: crewProfile.avatar.patch }}
                      />
                      {crewProfile.name}
                    </span>
                    <Button
                      size="sm"
                      variant={here ? 'ghost' : 'secondary'}
                      disabled={here}
                      onClick={() => moveAstronaut(id, selectedZone, 3)}
                      className="py-0.5 text-[9px]"
                    >
                      {here ? 'Present' : 'Move here'}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
          {selectedZone === 'shelter' && sim.env.spe?.active && (
            <div className="mt-3 border border-caution/30 bg-caution/5 p-2 text-[10px] leading-4 text-caution">
              Sheltering now reduces the modelled integrated dose. Actual shielding performance depends
              on the habitat design and event spectrum.
            </div>
          )}
        </Panel>

        <Panel
          className="xl:col-span-3"
          title="Environmental control"
          meta={sim.env.eclssStatus.toUpperCase()}
          action={<Wind size={13} className={sim.env.eclssStatus === 'nominal' ? 'text-ok' : 'text-critical'} />}
        >
          <div className="space-y-3">
            <div>
              <div className="flex items-baseline justify-between">
                <span className="label">Cabin CO₂</span>
                <span className="font-mono text-[15px] text-ink numeric">{Math.round(sim.env.co2)}</span>
              </div>
              <Meter
                value={sim.env.co2}
                max={10000}
                tone={environmentalLevel === 'critical' ? 'critical' : environmentalLevel === 'elevated' ? 'caution' : 'ok'}
                label="Cabin carbon dioxide"
                className="mt-1.5"
              />
              <div className="mt-1 flex justify-between font-mono text-[8px] uppercase tracking-[0.04em] text-muted/70">
                <span>ref {CO2_REFERENCE_PPM} ppm</span>
                <span>review 9000</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Readout label="Oxygen" value={sim.env.o2.toFixed(1)} unit="%" />
              <Readout label="Pressure" value={sim.env.pressureKpa.toFixed(1)} unit="kPa" />
              <Readout label="Temperature" value={sim.env.tempC.toFixed(1)} unit="°C" />
              <Readout label="Solar event" value={sim.env.spe?.active ? 'ACTIVE' : 'CLEAR'} unit="" tone={sim.env.spe?.active ? 'critical' : 'ink'} />
            </div>
            {sim.env.eclssStatus !== 'nominal' && (
              <div className="border border-critical/30 bg-critical/5 p-2 text-[10px] leading-4 text-critical">
                CO₂ removal performance is degraded. Use a scenario decision to investigate, reduce
                load, or follow the emergency workflow.
              </div>
            )}
            <p className="text-[9px] leading-4 text-muted/70">
              A single saturation reading is not sufficient to judge cabin safety; assess the
              environmental system together with the readings.
            </p>
          </div>
        </Panel>

        <Panel
          className="xl:col-span-4"
          title="Crew state"
          meta="Select to monitor"
          action={<Gauge size={13} className="text-muted" />}
          bodyClassName="p-0"
        >
          <div>
            {sim.crewOrder.map((id) => {
              const crew = sim.crew[id];
              const crewProfile = ASTRONAUT_BY_ID[id];
              const selected = id === selectedId;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => selectAstronaut(id)}
                  aria-pressed={selected}
                  className={cn(
                    'w-full border-b border-line/60 px-3 py-2.5 text-left last:border-0',
                    selected ? 'bg-surface2' : 'hover:bg-surface2/60',
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <CrewAvatar profile={crewProfile} size={28} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-display text-[11px] text-ink">{crewProfile.name}</span>
                        {selected && <span className="h-1 w-1 bg-accent" aria-hidden />}
                      </div>
                      <div className="font-mono text-[8px] uppercase tracking-[0.05em] text-muted">
                        {crew.activity} · {crew.location}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-[11px] text-ink">{crew.fatigue.toFixed(0)}</div>
                      <div className="font-mono text-[7px] uppercase text-muted">fatigue</div>
                    </div>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Meter
                      value={crew.fatigue}
                      tone={crew.fatigue > 65 ? 'caution' : 'accent'}
                      label={`${crewProfile.name} fatigue`}
                    />
                    <span className="shrink-0 font-mono text-[8px] text-muted">
                      {sleep24Hours(crew).toFixed(1)} h
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between border-t border-line px-3 py-2">
            <span className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.05em] text-muted">
              <ShieldCheck size={11} /> {sim.env.spe?.active ? 'Shelter available' : 'Dose monitored'}
            </span>
            <span className="font-mono text-[8px] text-muted/60">SIM</span>
          </div>
        </Panel>
      </div>

      <Panel
        title="Mission scenarios"
        meta="Three deterministic operational situations"
        action={<Badge tone="muted">SCENARIO 1 RECOMMENDED FOR DEMO</Badge>}
      >
        <ScenarioDeck />
      </Panel>

      <Panel
        title="Decision support"
        meta="Explain, compare, decide, document"
        action={<SlidersHorizontal size={13} className="text-muted" />}
      >
        <DecisionPanel />
      </Panel>

      <div className="grid gap-3 xl:grid-cols-12">
        <Panel className="xl:col-span-7" title="Mission events" meta="Newest first">
          <MissionTimeline events={sim.events} limit={8} />
        </Panel>
        <Panel className="xl:col-span-5" title="Simulation notes" meta="Model boundaries">
          <div className="space-y-3 text-[11px] leading-5 text-muted">
            <p>
              The simulator runs on 15-minute internal ticks. Observations are recorded hourly, and
              the clock is independent of rendering frame rate.
            </p>
            <p>
              Physiological changes are produced by an illustrative consequence model: sleep debt,
              workload, stress, activity and environmental context. They are not clinical predictions.
            </p>
            <p>
              Radiation exposure is estimated from location, illustrative shielding factors and a
              simulated solar particle event. It is not a validated individual dose or risk estimate.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Link to="/reports" className="btn btn-secondary py-1 text-[10px]">
                Generate report <ArrowUpRight size={11} />
              </Link>
              <Link to="/alerts" className="btn btn-secondary py-1 text-[10px]">
                Review alerts
              </Link>
            </div>
          </div>
        </Panel>
      </div>

      {sim.env.spe?.active && (
        <div className="flex flex-wrap items-center gap-2 border border-critical/30 bg-critical/5 px-4 py-3">
          <Radiation size={15} className="text-critical" />
          <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-critical">
            Solar particle event in progress
          </span>
          <span className="text-[10px] text-muted">
            Move the exposed crew member to the radiation shelter or return them to the habitat.
          </span>
        </div>
      )}
    </div>
  );
}

function Readout({
  label,
  value,
  unit,
  tone = 'ink',
}: {
  label: string;
  value: string;
  unit: string;
  tone?: 'ink' | 'caution' | 'critical';
}) {
  return (
    <div className="bg-surface px-2.5 py-2">
      <div className="label mb-1 text-[8px]">{label}</div>
      <div className="flex items-baseline gap-1">
        <span
          className={cn(
            'font-mono text-[13px] numeric',
            tone === 'caution' && 'text-caution',
            tone === 'critical' && 'text-critical',
            tone === 'ink' && 'text-ink',
          )}
        >
          {value}
        </span>
        <span className="font-mono text-[8px] uppercase text-muted">{unit}</span>
      </div>
    </div>
  );
}
