import type { MissionEvent } from '../../types/domain';
import { formatMET } from '../../lib/format';
import { cn } from '../ui';

const SEVERITY_COLOR = {
  info: 'bg-muted',
  caution: 'bg-caution',
  critical: 'bg-critical',
};

const SEVERITY_TEXT = {
  info: 'text-muted',
  caution: 'text-caution',
  critical: 'text-critical',
};

export function MissionTimeline({
  events,
  limit = 6,
  emptyLabel = 'No mission events recorded in this window.',
}: {
  events: MissionEvent[];
  limit?: number;
  emptyLabel?: string;
}) {
  const sorted = [...events].sort((a, b) => b.minute - a.minute).slice(0, limit);
  if (sorted.length === 0) {
    return <p className="py-6 text-center text-[11px] text-muted">{emptyLabel}</p>;
  }
  return (
    <ol className="relative space-y-4 border-l border-line pl-4">
      {sorted.map((event) => (
        <li key={event.id} className="relative">
          <span
            aria-hidden
            className={cn(
              'absolute -left-[21px] top-1 h-[7px] w-[7px] border border-bg',
              SEVERITY_COLOR[event.severity],
            )}
          />
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-muted">
              {formatMET(event.minute)}
            </span>
            <span className={cn('font-mono text-[8px] uppercase tracking-[0.08em]', SEVERITY_TEXT[event.severity])}>
              {event.type}
            </span>
            {event.zone && (
              <span className="font-mono text-[8px] uppercase tracking-[0.08em] text-muted/60">
                {event.zone}
              </span>
            )}
          </div>
          <p className="mt-0.5 font-display text-[12px] leading-4 text-ink">{event.title}</p>
          <p className="mt-0.5 text-[10px] leading-4 text-muted">{event.detail}</p>
        </li>
      ))}
    </ol>
  );
}
