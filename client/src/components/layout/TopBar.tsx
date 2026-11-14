import { Link, useNavigate } from 'react-router-dom';
import { Bell, Menu, Pause, Play, Radio, Sparkles } from 'lucide-react';
import { useOrbitStore } from '../../store/orbitStore';
import { ASTRONAUT_BY_ID } from '../../data/astronauts';
import { formatClock, formatMET, missionDate, missionDay } from '../../lib/format';
import { cn, StatusDot } from '../ui';
import { CrewAvatar } from '../astronauts/CrewAvatar';

export function TopBar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const navigate = useNavigate();
  const mission = useOrbitStore((s) => s.mission);
  const clock = useOrbitStore((s) => s.sim.clock);
  const comms = useOrbitStore((s) => s.sim.env.comms);
  const running = useOrbitStore((s) => s.running);
  const selectedId = useOrbitStore((s) => s.selectedAstronautId);
  const alerts = useOrbitStore((s) => s.alerts);
  const setRunning = useOrbitStore((s) => s.setRunning);
  const setComms = useOrbitStore((s) => s.setComms);
  const setAssistantOpen = useOrbitStore((s) => s.setAssistantOpen);

  const profile = ASTRONAUT_BY_ID[selectedId];
  const activeAlerts = alerts.filter((a) => !a.acknowledged).length;
  const hasReview = alerts.some((a) => !a.acknowledged && a.level === 'review');
  const met = formatMET(clock).split(' ');

  const cycleComms = () => {
    setComms(comms === 'nominal' ? 'delay' : comms === 'delay' ? 'loss' : 'nominal');
  };

  return (
    <header className="app-topbar sticky top-0 z-30 border-b border-line bg-bg/95">
      <div className="flex h-[60px] items-center gap-3 px-3 md:px-5">
        <button
          type="button"
          className="btn btn-ghost px-1.5 py-1 lg:hidden"
          onClick={onOpenMenu}
          aria-label="Open navigation"
        >
          <Menu size={18} />
        </button>

        <div className="hidden min-w-0 md:block">
          <div className="font-display text-[11px] font-medium uppercase tracking-[0.12em] text-ink">
            {mission.name}
          </div>
          <div className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
            Day {missionDay(clock)} · {missionDate(clock)} · Simulated
          </div>
        </div>

        <div className="flex items-baseline gap-2 border-line md:border-l md:pl-4">
          <span className="label hidden sm:inline">MET</span>
          <span className="font-mono text-[15px] font-medium tracking-tight text-ink numeric">
            {met[0]}
          </span>
          <span className="font-mono text-[15px] tracking-tight text-ink numeric">{met[1]}</span>
          <span className="hidden font-mono text-[9px] text-muted sm:inline">
            {formatClock(clock)} LOCAL
          </span>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setRunning(!running)}
            className="btn btn-secondary hidden px-2 py-1 sm:inline-flex"
            aria-pressed={running}
            aria-label={running ? 'Pause simulation' : 'Resume simulation'}
            title={running ? 'Pause simulation clock' : 'Run simulation clock'}
          >
            {running ? <Pause size={12} /> : <Play size={12} />}
            <span className="font-mono text-[10px]">{running ? 'LIVE' : 'PAUSED'}</span>
            <StatusDot tone={running ? 'ok' : 'muted'} pulse={running} />
          </button>

          <button
            type="button"
            onClick={cycleComms}
            className={cn(
              'hidden items-center gap-1.5 border px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.06em] md:inline-flex',
              comms === 'loss'
                ? 'border-critical/40 bg-critical/10 text-critical'
                : comms === 'delay'
                  ? 'border-caution/30 bg-caution/5 text-caution'
                  : 'border-line bg-surface2 text-muted hover:text-ink',
            )}
            title="Cycle simulated communication state (nominal → delay → loss)"
          >
            <Radio size={12} />
            {comms === 'loss' ? 'LOS' : comms === 'delay' ? 'DELAY 8m' : 'COMMS OK'}
          </button>

          <Link
            to="/alerts"
            className="relative inline-flex h-8 w-8 items-center justify-center border border-line bg-surface2 text-muted hover:border-[#3b4d5f] hover:text-ink"
            aria-label={`Alerts: ${activeAlerts} active`}
          >
            <Bell size={14} />
            {activeAlerts > 0 && (
              <span
                className={cn(
                  'absolute -right-1.5 -top-1.5 min-w-[16px] px-1 text-center font-mono text-[9px] leading-4 text-bg',
                  hasReview ? 'bg-critical' : 'bg-caution',
                )}
              >
                {activeAlerts > 9 ? '9+' : activeAlerts}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setAssistantOpen(true)}
            className="inline-flex h-8 items-center gap-1.5 border border-accent/35 bg-accent/10 px-2 font-mono text-[10px] uppercase tracking-[0.06em] text-accent hover:bg-accent/15"
            aria-label="Open ORBIT MED assistant"
          >
            <Sparkles size={12} />
            <span className="hidden sm:inline">ORBIT MED</span>
          </button>

          <button
            type="button"
            onClick={() => navigate(`/astronauts/${selectedId}`)}
            className="ml-0.5 flex h-8 items-center gap-2 border border-line bg-surface2 pl-1 pr-2 text-left hover:border-[#3b4d5f]"
            aria-label={`Open profile for ${profile.name}`}
          >
            <CrewAvatar profile={profile} size={24} />
            <span className="hidden max-w-[100px] truncate font-display text-[11px] text-ink xl:block">
              {profile.name}
            </span>
          </button>
        </div>
      </div>
      <div className="flex items-center gap-3 border-t border-line/60 px-4 py-1.5 md:hidden">
        <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
          {mission.name} · Day {missionDay(clock)}
        </span>
        <span className="ml-auto flex items-center gap-1.5 font-mono text-[9px] uppercase text-muted">
          <StatusDot tone={running ? 'ok' : 'muted'} /> {running ? 'Sim live' : 'Sim paused'}
        </span>
      </div>
    </header>
  );
}
