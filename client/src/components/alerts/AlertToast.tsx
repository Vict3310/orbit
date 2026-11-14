import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, X } from 'lucide-react';
import { useOrbitStore } from '../../store/orbitStore';
import { ASTRONAUT_BY_ID } from '../../data/astronauts';
import { ALERT_META } from '../../lib/severity';
import { formatMET } from '../../lib/format';
import { Badge } from '../ui';

export function AlertToast() {
  const toast = useOrbitStore((s) => s.latestAlert);
  const dismiss = useOrbitStore((s) => s.dismissToast);
  const navigate = useNavigate();

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(dismiss, toast.alert.level === 'review' ? 15000 : 9000);
    return () => window.clearTimeout(timeout);
  }, [toast, dismiss]);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.18 }}
          role="status"
          aria-live="polite"
          className="no-print fixed bottom-20 right-3 z-50 w-[min(390px,calc(100vw-1.5rem))] border border-line bg-surface2 p-0 lg:bottom-5 lg:right-5"
        >
          <div className="flex items-start gap-3 border-b border-line px-3 py-2.5">
            <span
              aria-hidden
              className="mt-0.5 inline-block h-2 w-2 shrink-0"
              style={{ background: ALERT_META[toast.alert.level].color }}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="label">New alert</span>
                <Badge tone={ALERT_META[toast.alert.level].tone}>{ALERT_META[toast.alert.level].label}</Badge>
                <span className="font-mono text-[9px] text-muted">{formatMET(toast.alert.createdAtMinute)}</span>
              </div>
              <p className="mt-1.5 font-display text-[12px] leading-5 text-ink">
                {toast.alert.title}
              </p>
              <p className="mt-1 text-[11px] leading-5 text-muted">
                {ASTRONAUT_BY_ID[toast.alert.astronautId]?.name ?? 'Crew member'} · {toast.alert.summary}
              </p>
            </div>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Dismiss alert notification"
              className="shrink-0 p-1 text-muted hover:text-ink"
            >
              <X size={14} />
            </button>
          </div>
          <div className="flex items-center justify-between px-3 py-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
              Deterministic rule · local
            </span>
            <button
              type="button"
              onClick={() => {
                navigate(`/alerts?focus=${encodeURIComponent(toast.alert.id)}`);
                dismiss();
              }}
              className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.06em] text-accent hover:underline"
            >
              View evidence <ArrowUpRight size={12} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
