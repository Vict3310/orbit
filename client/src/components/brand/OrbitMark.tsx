import { cn } from '../ui';

export function OrbitMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label="ORBIT orbital mark"
      className={cn('shrink-0', className)}
    >
      <rect width="64" height="64" fill="#080D13" />
      <circle cx="32" cy="32" r="8.5" fill="#111923" stroke="#293744" strokeWidth="1.2" />
      <circle cx="32" cy="32" r="21" fill="none" stroke="#D9F26A" strokeWidth="1.8" />
      <circle cx="46.8" cy="17.2" r="3.4" fill="#F4F7FA" />
      <circle cx="32" cy="32" r="3.6" fill="#D9F26A" />
      <path d="M6 12h8M12 6v8M50 52h8M52 46v8" stroke="#293744" strokeWidth="1.2" />
    </svg>
  );
}

export function OrbitWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <OrbitMark size={compact ? 26 : 30} />
      <div className="leading-none">
        <div className="font-display text-[19px] font-semibold tracking-[0.14em] text-ink">
          ORBIT
        </div>
        {!compact && (
          <div className="mt-1 font-mono text-[8px] uppercase tracking-[0.16em] text-muted">
            Health Intelligence
          </div>
        )}
      </div>
    </div>
  );
}
