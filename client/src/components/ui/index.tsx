import {
  type ButtonHTMLAttributes,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useReducedMotion } from 'framer-motion';
import clsx, { type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function AnimatedNumber({
  value,
  digits = 0,
  className,
}: {
  value: number;
  digits?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);

  useEffect(() => {
    if (reduceMotion) {
      setDisplay(value);
      fromRef.current = value;
      return;
    }
    const from = fromRef.current;
    const start = performance.now();
    const duration = 420;
    let frame = 0;
    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (value - from) * eased);
      if (progress < 1) frame = requestAnimationFrame(step);
      else fromRef.current = value;
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, reduceMotion]);

  return <span className={cn('numeric', className)}>{display.toFixed(digits)}</span>;
}

export function Panel({
  title,
  meta,
  action,
  children,
  className,
  bodyClassName,
  id,
}: {
  title?: ReactNode;
  meta?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  id?: string;
}) {
  return (
    <section className={cn('panel', className)} id={id}>
      {(title || meta || action) && (
        <header className="panel-head">
          <div className="flex min-w-0 items-baseline gap-2">
            {title && <h2 className="label text-ink">{title}</h2>}
            {meta && <span className="truncate font-mono text-2xs text-muted">{meta}</span>}
          </div>
          {action}
        </header>
      )}
      <div className={cn('p-4', bodyClassName)}>{children}</div>
    </section>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-5 flex flex-col gap-4 border-b border-line pb-5 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <p className="label mb-2 flex items-center gap-2">
          <span aria-hidden className="inline-block h-1.5 w-1.5 bg-accent" />
          {eyebrow}
        </p>
        <h1 className="font-display text-2xl font-medium tracking-[-0.02em] text-ink md:text-[30px]">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-3xl text-[13px] leading-6 text-muted">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Button({
  children,
  className,
  variant = 'secondary',
  size = 'md',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
}) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        'btn',
        variant === 'primary' && 'btn-primary',
        variant === 'secondary' && 'btn-secondary',
        variant === 'ghost' && 'btn-ghost',
        variant === 'danger' && 'btn-danger',
        size === 'sm' && 'px-2 py-1 text-[11px]',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Badge({
  children,
  tone = 'muted',
  className,
}: {
  children: ReactNode;
  tone?: 'muted' | 'accent' | 'ok' | 'caution' | 'critical';
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 border px-2 py-[3px] font-mono text-[10px] uppercase leading-none tracking-[0.12em]',
        tone === 'muted' && 'border-line bg-surface2 text-muted',
        tone === 'accent' && 'border-accent/40 bg-accent/10 text-accent',
        tone === 'ok' && 'border-ok/40 bg-ok/10 text-ok',
        tone === 'caution' && 'border-caution/40 bg-caution/10 text-caution',
        tone === 'critical' && 'border-critical/40 bg-critical/10 text-critical',
        className,
      )}
      style={{ borderRadius: 2 }}
    >
      {children}
    </span>
  );
}

export function StatusDot({
  tone = 'ok',
  pulse = false,
  className,
}: {
  tone?: 'ok' | 'caution' | 'critical' | 'muted' | 'accent';
  pulse?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-block h-1.5 w-1.5 shrink-0',
        tone === 'ok' && 'bg-ok',
        tone === 'caution' && 'bg-caution',
        tone === 'critical' && 'bg-critical',
        tone === 'muted' && 'bg-muted',
        tone === 'accent' && 'bg-accent',
        pulse && 'animate-pulse-soft',
        className,
      )}
      style={{ borderRadius: 999 }}
    />
  );
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: {
  options: { value: T; label: string; title?: string }[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn('inline-flex border border-line bg-bg p-[2px]', className)}
      style={{ borderRadius: 2 }}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          title={option.title}
          onClick={() => onChange(option.value)}
          className={cn(
            'px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] transition-colors',
            option.value === value
              ? 'bg-elevated text-ink'
              : 'text-muted hover:text-ink',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function Meter({
  value,
  max = 100,
  tone = 'accent',
  label,
  className,
}: {
  value: number;
  max?: number;
  tone?: 'accent' | 'ok' | 'caution' | 'critical' | 'muted';
  label?: string;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      className={cn('h-1 w-full bg-surface2', className)}
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Number(value.toFixed(1))}
    >
      <div
        className={cn(
          'h-full transition-[width] duration-500',
          tone === 'accent' && 'bg-accent',
          tone === 'ok' && 'bg-ok',
          tone === 'caution' && 'bg-caution',
          tone === 'critical' && 'bg-critical',
          tone === 'muted' && 'bg-muted',
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function StatTile({
  label,
  value,
  unit,
  hint,
  tone = 'ink',
  digits = 0,
  className,
}: {
  label: string;
  value: number;
  unit?: string;
  hint?: ReactNode;
  tone?: 'ink' | 'ok' | 'caution' | 'critical' | 'accent' | 'muted';
  digits?: number;
  className?: string;
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <div className="label mb-2 truncate">{label}</div>
      <div className="flex items-baseline gap-1.5">
        <span
          className={cn(
            'value-lg',
            tone === 'ok' && 'text-ok',
            tone === 'caution' && 'text-caution',
            tone === 'critical' && 'text-critical',
            tone === 'accent' && 'text-accent',
            tone === 'muted' && 'text-muted',
          )}
        >
          <AnimatedNumber value={value} digits={digits} />
        </span>
        {unit && <span className="font-mono text-[10px] uppercase text-muted">{unit}</span>}
      </div>
      {hint && <div className="mt-2 text-[11px] leading-4 text-muted">{hint}</div>}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center border border-dashed border-line px-6 py-10 text-center">
      {icon && <div className="mb-3 text-muted">{icon}</div>}
      <p className="font-display text-sm text-ink">{title}</p>
      <p className="mt-1 max-w-sm text-xs leading-5 text-muted">{description}</p>
    </div>
  );
}

export function KeyValue({
  label,
  value,
  mono = true,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-line/60 py-2 last:border-0">
      <span className="text-[11px] uppercase tracking-[0.08em] text-muted">{label}</span>
      <span className={cn('text-right text-[12px] text-ink', mono && 'font-mono')}>{value}</span>
    </div>
  );
}

export function InlineNote({
  children,
  tone = 'muted',
}: {
  children: ReactNode;
  tone?: 'muted' | 'caution';
}) {
  return (
    <p
      className={cn(
        'border-l-2 py-1 pl-3 text-[11px] leading-5',
        tone === 'muted' ? 'border-line text-muted' : 'border-caution/60 text-caution/90',
      )}
    >
      {children}
    </p>
  );
}
