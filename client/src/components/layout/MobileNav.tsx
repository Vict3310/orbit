import { NavLink } from 'react-router-dom';
import { FileText, LayoutGrid, Orbit, TriangleAlert, Users } from 'lucide-react';
import { useOrbitStore } from '../../store/orbitStore';
import { cn } from '../ui';

const ITEMS = [
  { to: '/dashboard', label: 'Overview', icon: LayoutGrid },
  { to: '/astronauts', label: 'Crew', icon: Users },
  { to: '/simulation', label: 'Simulator', icon: Orbit },
  { to: '/alerts', label: 'Alerts', icon: TriangleAlert },
  { to: '/reports', label: 'Reports', icon: FileText },
];

export function MobileNav() {
  const alerts = useOrbitStore((s) => s.alerts);
  const activeCount = alerts.filter((a) => !a.acknowledged).length;

  return (
    <nav
      className="mobile-nav fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface lg:hidden"
      aria-label="Mobile primary navigation"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="grid grid-cols-5">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'relative flex min-h-[56px] flex-col items-center justify-center gap-1 text-[9px] uppercase tracking-[0.06em] transition-colors',
                    isActive ? 'text-accent' : 'text-muted',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span aria-hidden className="absolute left-3 right-3 top-0 h-[2px] bg-accent" />
                    )}
                    <Icon size={18} strokeWidth={1.7} />
                    <span className="font-mono">{item.label}</span>
                    {item.to === '/alerts' && activeCount > 0 && (
                      <span className="absolute right-[22%] top-2 min-w-[14px] bg-critical px-1 text-center font-mono text-[8px] leading-[14px] text-bg">
                        {activeCount > 9 ? '9+' : activeCount}
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
  );
}
