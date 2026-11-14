import type { HealthAlert } from '../../types/domain';
import { ASTRONAUT_BY_ID } from '../../data/astronauts';
import { ALERT_META } from '../../lib/severity';
import { formatMET } from '../../lib/format';
import { Badge, cn } from '../ui';

export function AlertRow({
  alert,
  selected = false,
  onSelect,
  showAstronaut = true,
}: {
  alert: HealthAlert;
  selected?: boolean;
  onSelect?: () => void;
  showAstronaut?: boolean;
}) {
  const meta = ALERT_META[alert.level];
  const profile = ASTRONAUT_BY_ID[alert.astronautId];
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'w-full border-b border-line/60 px-3 py-2.5 text-left transition-colors last:border-0',
        selected ? 'bg-elevated' : 'hover:bg-surface2',
      )}
    >
      <div className="flex items-start gap-2.5">
        <span
          aria-hidden
          className="mt-0.5 h-7 w-[2px] shrink-0"
          style={{ background: meta.color }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-display text-[12px] leading-4 text-ink">{alert.title}</span>
            <Badge tone={meta.tone}>{meta.label}</Badge>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 font-mono text-[9px] uppercase tracking-[0.04em] text-muted">
            {showAstronaut && profile && <span>{profile.name}</span>}
            <span>·</span>
            <span>{formatMET(alert.createdAtMinute)}</span>
            <span>·</span>
            <span>
              {alert.currentValue} {alert.unit} vs {alert.baselineValue} {alert.unit}
            </span>
          </div>
        </div>
        <span className="shrink-0 font-mono text-[9px] text-muted">
          {alert.deltaPct > 0 ? '+' : ''}
          {alert.deltaPct.toFixed(0)}%
        </span>
      </div>
    </button>
  );
}

export function AlertList({
  alerts,
  onSelect,
  selectedId,
  emptyLabel = 'No alerts on record.',
  limit,
  showAstronaut = true,
}: {
  alerts: HealthAlert[];
  onSelect?: (alert: HealthAlert) => void;
  selectedId?: string;
  emptyLabel?: string;
  limit?: number;
  showAstronaut?: boolean;
}) {
  const shown = typeof limit === 'number' ? alerts.slice(0, limit) : alerts;
  if (shown.length === 0) {
    return (
      <p className="px-3 py-6 text-center text-[11px] leading-5 text-muted">{emptyLabel}</p>
    );
  }
  return (
    <div>
      {shown.map((alert) => (
        <AlertRow
          key={alert.id}
          alert={alert}
          selected={selectedId === alert.id}
          onSelect={onSelect ? () => onSelect(alert) : undefined}
          showAstronaut={showAstronaut}
        />
      ))}
    </div>
  );
}
