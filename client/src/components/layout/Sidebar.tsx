import { Link, NavLink } from 'react-router-dom';
import {
  Activity,
  ClipboardList,
  FileText,
  FlaskConical,
  LayoutGrid,
  MonitorPlay,
  Orbit,
  Settings2,
  TriangleAlert,
  Users,
  X,
} from 'lucide-react';
import { useOrbitStore } from '../../store/orbitStore';
import { OrbitWordmark } from '../brand/OrbitMark';
import { cn, StatusDot } from '../ui';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Overview', icon: LayoutGrid, hint: 'Command dashboard' },
  { to: '/astronauts', label: 'Astronauts', icon: Users, hint: 'Crew and baselines' },
  { to: '/simulation', label: 'Mission Simulator', icon: Orbit, hint: 'Habitat and scenarios' },
  { to: '/assessments', label: 'Assessments', icon: ClipboardList, hint: 'Self-report and reaction' },
  { to: '/alerts', label: 'Alerts', icon: TriangleAlert, hint: 'Explainable anomalies' },
  { to: '/reports', label: 'Reports', icon: FileText, hint: 'Mission health reports' },
  { to: '/research', label: 'Research', icon: FlaskConical, hint: 'Science and assumptions' },
  { to: '/settings', label: 'Settings', icon: Settings2, hint: 'Configuration' },
];

export function Sidebar({
  variant = 'desktop',
  onNavigate,
  onClose,
}: {
  variant?: 'desktop' | 'drawer';
  onNavigate?: () => void;
  onClose?: () => void;
}) {
  const mission = useOrbitStore((s) => s.mission);
  const comms = useOrbitStore((s) => s.sim.env.comms);
  const alerts = useOrbitStore((s) => s.alerts);
  const selectedId = useOrbitStore((s) => s.selectedAstronautId);
  const activeCount = alerts.filter((a) => !a.acknowledged).length;
  const navItems = [
    ...NAV_ITEMS.slice(0, 2),
    {
      to: `/astronauts/${selectedId}`,
      label: 'Health Intelligence',
      icon: Activity,
      hint: 'Individual monitoring and baselines',
    },
    ...NAV_ITEMS.slice(2),
  ];

  return (
    <aside
      aria-label="Primary navigation"
      className={cn(
        'flex h-full w-[236px] shrink-0 flex-col border-r border-line bg-surface',
        variant === 'desktop' && 'fixed inset-y-0 left-0 z-40 hidden lg:flex',
      )}
    >
      <div className="flex h-[60px] items-center justify-between border-b border-line px-4">
        <OrbitWordmark />
        {variant === 'drawer' && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="border border-line p-1.5 text-muted hover:text-ink"
          >
            <X size={15} />
          </button>
        )}
      </div>

      <div className="border-b border-line px-4 py-3">
        <div className="label mb-1.5">Assigned mission</div>
        <div className="font-display text-[12px] font-medium leading-4 text-ink">
          {mission.name}
        </div>
        <div className="mt-1 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
          <span>{mission.designation}</span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="chip border-accent/30 bg-accent/10 text-accent">Simulated</span>
          <span className="font-mono text-[9px] text-muted">SEED {mission.seed}</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="ORBIT sections">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/astronauts'}
                  onClick={onNavigate}
                  title={item.hint}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center gap-2.5 px-3 py-[9px] text-[12px] transition-colors',
                      isActive
                        ? 'bg-elevated text-ink'
                        : 'text-muted hover:bg-surface2 hover:text-ink',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        aria-hidden
                        className={cn(
                          'absolute left-0 top-1.5 h-[calc(100%-12px)] w-[2px]',
                          isActive ? 'bg-accent' : 'bg-transparent',
                        )}
                      />
                      <Icon
                        size={15}
                        strokeWidth={1.7}
                        className={isActive ? 'text-accent' : 'text-muted group-hover:text-ink'}
                      />
                      <span className="flex-1">{item.label}</span>
                      {item.to === '/alerts' && activeCount > 0 && (
                        <span
                          className="min-w-[18px] bg-critical px-1 text-center font-mono text-[9px] font-medium leading-[16px] text-bg"
                          aria-label={`${activeCount} active alerts`}
                        >
                          {activeCount > 99 ? '99+' : activeCount}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-line p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="label">Earth link</span>
          <StatusDot tone={comms === 'loss' ? 'critical' : comms === 'delay' ? 'caution' : 'ok'} pulse={comms !== 'nominal'} />
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
          {comms === 'loss' ? 'LOS · local autonomy' : comms === 'delay' ? 'One-way delay 08:00' : 'Nominal'}
        </div>
        <div className="mt-1 text-[10px] leading-4 text-muted/70">
          Monitoring, simulation and alerts run locally.
        </div>
        <Link
          to="/presentation"
          className="mt-3 flex items-center gap-1.5 border border-line bg-bg px-2 py-1.5 font-mono text-[9px] uppercase tracking-[0.06em] text-muted hover:border-accent/40 hover:text-accent"
        >
          <MonitorPlay size={11} /> Judging presentation
        </Link>
        <div className="mt-3 flex items-center justify-between border-t border-line/60 pt-3 font-mono text-[9px] text-muted/60">
          <span className="flex items-center gap-1.5">
            <Activity size={11} /> OFFLINE-FIRST
          </span>
          <span>v1.0</span>
        </div>
      </div>
    </aside>
  );
}
