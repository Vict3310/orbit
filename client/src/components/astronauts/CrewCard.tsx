import type { AstronautProfile, BaselineSnapshot, HealthAlert, HealthObservation } from '../../types/domain';
import { ALERT_META, worstLevel } from '../../lib/severity';
import { formatMET } from '../../lib/format';
import { CrewAvatar } from './CrewAvatar';
import { Badge, StatusDot, cn } from '../ui';
import { MetricDelta, deviationPct } from '../telemetry/MetricDelta';

/**
 * Crew overview card. Selecting it changes the active monitoring target; the
 * dashboard and all derived charts update from the same store selection.
 */
export function CrewCard({
  profile,
  latest,
  baseline,
  alerts,
  selected,
  onSelect,
  onOpenProfile,
}: {
  profile: AstronautProfile;
  latest: HealthObservation | null;
  baseline: BaselineSnapshot;
  alerts: HealthAlert[];
  selected: boolean;
  onSelect: () => void;
  onOpenProfile: () => void;
}) {
  const active = alerts.filter((alert) => !alert.acknowledged);
  const level = worstLevel(active.map((alert) => alert.level));
  const meta = ALERT_META[level];

  return (
    <article
      className={cn(
        'panel transition-colors',
        selected ? 'border-accent/60' : 'hover:border-[#3b4d5f]',
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className="w-full p-3 text-left"
      >
        <div className="flex items-start gap-3">
          <CrewAvatar profile={profile} size={48} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-display text-[13px] font-medium text-ink">
                {profile.name}
              </h3>
              {selected && <StatusDot tone="accent" />}
            </div>
            <p className="mt-0.5 truncate font-mono text-[9px] uppercase tracking-[0.06em] text-muted">
              {profile.callSign} · {profile.role}
            </p>
            <div className="mt-2">
              <Badge tone={meta.tone}>{meta.label}</Badge>
            </div>
          </div>
        </div>

        <dl className="mt-3 grid grid-cols-3 gap-px border border-line bg-line">
          <div className="bg-surface2 px-2 py-2">
            <dt className="label text-[8px]">Rest HR</dt>
            <dd className="mt-1 flex items-baseline gap-1">
              <span className="font-mono text-[15px] text-ink numeric">
                {latest ? latest.restingHeartRate.toFixed(0) : '—'}
              </span>
              <span className="font-mono text-[8px] text-muted">bpm</span>
            </dd>
            {latest && (
              <MetricDelta
                pct={deviationPct(latest.restingHeartRate, baseline.metrics.restingHeartRate?.value ?? 0)}
                worseWhen="up"
                className="mt-0.5 block"
              />
            )}
          </div>
          <div className="bg-surface2 px-2 py-2">
            <dt className="label text-[8px]">Sleep</dt>
            <dd className="mt-1 flex items-baseline gap-1">
              <span className="font-mono text-[15px] text-ink numeric">
                {latest ? latest.sleepHours.toFixed(1) : '—'}
              </span>
              <span className="font-mono text-[8px] text-muted">h</span>
            </dd>
            {latest && (
              <MetricDelta
                pct={deviationPct(latest.sleepHours, baseline.metrics.sleepHours?.value ?? 0)}
                worseWhen="down"
                className="mt-0.5 block"
              />
            )}
          </div>
          <div className="bg-surface2 px-2 py-2">
            <dt className="label text-[8px]">Fatigue</dt>
            <dd className="mt-1 flex items-baseline gap-1">
              <span className="font-mono text-[15px] text-ink numeric">
                {latest ? latest.fatigue.toFixed(0) : '—'}
              </span>
              <span className="font-mono text-[8px] text-muted">/100</span>
            </dd>
            {latest && (
              <MetricDelta
                pct={deviationPct(latest.fatigue, baseline.metrics.fatigue?.value ?? 0)}
                worseWhen="up"
                className="mt-0.5 block"
              />
            )}
          </div>
        </dl>

        <div className="mt-2.5 flex items-center justify-between gap-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-muted">
            {latest ? `Last obs ${formatMET(latest.missionMinute)}` : 'No observations'}
          </span>
          <span
            className={cn(
              'font-mono text-[9px] uppercase tracking-[0.06em]',
              active.length > 0 ? 'text-caution' : 'text-ok',
            )}
          >
            {active.length > 0 ? `${active.length} active alert${active.length === 1 ? '' : 's'}` : 'No active alerts'}
          </span>
        </div>
      </button>
      <div className="border-t border-line px-3 py-1.5">
        <button
          type="button"
          onClick={onOpenProfile}
          className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted hover:text-accent"
        >
          Open health profile →
        </button>
      </div>
    </article>
  );
}
