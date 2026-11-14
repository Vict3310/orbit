import { SIM_CONFIG } from '../engines/simulation/config';

export function formatMET(clock: number): string {
  const day = Math.floor(clock / 1440) + 1;
  const minuteOfDay = ((clock % 1440) + 1440) % 1440;
  const hours = Math.floor(minuteOfDay / 60);
  const minutes = Math.floor(minuteOfDay % 60);
  return `D${String(day).padStart(3, '0')} ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function formatClock(clock: number): string {
  const minuteOfDay = ((clock % 1440) + 1440) % 1440;
  return `${String(Math.floor(minuteOfDay / 60)).padStart(2, '0')}:${String(Math.floor(minuteOfDay % 60)).padStart(2, '0')}`;
}

export function missionDay(clock: number): number {
  return Math.floor(clock / 1440) + 1;
}

export function missionDateIso(clock: number): string {
  return new Date(Date.parse(SIM_CONFIG.epochIso) + clock * 60_000).toISOString();
}

export function missionDate(clock: number): string {
  return missionDateIso(clock).slice(0, 10);
}

export function isoForMinute(clock: number): string {
  return missionDateIso(clock);
}

export function formatSigned(value: number, digits = 1): string {
  const fixed = value.toFixed(digits);
  return value > 0 ? `+${fixed}` : fixed;
}

export function formatNumber(value: number, digits = 1): string {
  return value.toFixed(digits);
}

export function commsLabel(status: 'nominal' | 'delay' | 'loss'): string {
  switch (status) {
    case 'nominal':
      return 'Nominal';
    case 'delay':
      return 'One-way delay';
    default:
      return 'Loss of signal';
  }
}

export function relativeTimeLabel(minute: number, now: number): string {
  const delta = now - minute;
  if (delta < 60) return `${Math.max(0, Math.round(delta))} min ago`;
  const hours = delta / 60;
  if (hours < 24) return `${hours.toFixed(1)} h ago`;
  return `${(hours / 24).toFixed(1)} d ago`;
}
