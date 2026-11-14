import { useMemo, useState } from 'react';
import { ExternalLink, FlaskConical, ShieldAlert } from 'lucide-react';
import {
  KIND_LABEL,
  REFERENCE_CATEGORIES,
  RESEARCH_REFERENCES,
  type ReferenceCategory,
  type ReferenceKind,
} from '../data/research';
import { Badge, PageHeader, Panel, cn } from '../components/ui';

const KIND_TONE: Record<ReferenceKind, 'ok' | 'caution' | 'muted' | 'critical'> = {
  research: 'ok',
  approximation: 'caution',
  synthetic: 'muted',
  hypothesis: 'critical',
};

export default function Research() {
  const [category, setCategory] = useState<ReferenceCategory | 'all'>('all');

  const references = useMemo(
    () =>
      category === 'all'
        ? RESEARCH_REFERENCES
        : RESEARCH_REFERENCES.filter((reference) => reference.category === category),
    [category],
  );

  const sources = useMemo(() => {
    const map = new Map<string, { label: string; url: string }>();
    for (const reference of RESEARCH_REFERENCES) {
      if (reference.url) map.set(reference.url, { label: reference.source, url: reference.url });
    }
    return [...map.values()];
  }, []);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Scientific integrity"
        title="Research register and assumptions"
        description="Every scientific claim in ORBIT is separated from educational approximations and synthetic parameters. Where a source is cited, the link is to a verifiable NASA or peer-reviewed publication."
        actions={
          <>
            <a
              href="https://www.nasa.gov/hrp/"
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
            >
              NASA HRP <ExternalLink size={12} />
            </a>
            <a
              href="https://osdr.nasa.gov/"
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
            >
              NASA OSDR <ExternalLink size={12} />
            </a>
          </>
        }
      />

      <div className="grid gap-3 md:grid-cols-4">
        {(
          [
            ['research', 'Research-supported statements grounded in a cited publication.'],
            ['approximation', 'Educational approximations that simplify a real system or conversion.'],
            ['synthetic', 'Parameters invented for the demonstration and labelled as such.'],
            ['hypothesis', 'Unvalidated ideas ORBIT deliberately does not treat as fact.'],
          ] as [ReferenceKind, string][]
        ).map(([kind, description]) => (
          <div key={kind} className="border border-line bg-surface p-3">
            <Badge tone={KIND_TONE[kind]}>{KIND_LABEL[kind]}</Badge>
            <p className="mt-2 text-[10px] leading-4 text-muted">{description}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setCategory('all')}
          aria-pressed={category === 'all'}
          className={cn(
            'border px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.05em]',
            category === 'all'
              ? 'border-accent/50 bg-accent/10 text-accent'
              : 'border-line bg-surface text-muted hover:text-ink',
          )}
        >
          All · {RESEARCH_REFERENCES.length}
        </button>
        {REFERENCE_CATEGORIES.map((item) => {
          const count = RESEARCH_REFERENCES.filter((reference) => reference.category === item).length;
          return (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              aria-pressed={category === item}
              className={cn(
                'border px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.05em]',
                category === item
                  ? 'border-accent/50 bg-accent/10 text-accent'
                  : 'border-line bg-surface text-muted hover:text-ink',
              )}
            >
              {item} · {count}
            </button>
          );
        })}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {references.map((reference) => (
          <article key={reference.id} className="flex flex-col border border-line bg-surface p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={KIND_TONE[reference.kind]}>{KIND_LABEL[reference.kind]}</Badge>
              <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-muted">
                {reference.category}
              </span>
            </div>
            <h2 className="mt-2 font-display text-[14px] leading-6 text-ink">{reference.claim}</h2>
            <p className="mt-2 text-[11px] leading-5 text-muted">{reference.finding}</p>

            <div className="mt-3 space-y-2 border-t border-line pt-3">
              <div>
                <span className="label mb-1 block">Source</span>
                {reference.url ? (
                  <a
                    href={reference.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-start gap-1.5 text-[10px] leading-5 text-accent hover:underline"
                  >
                    {reference.source} <ExternalLink size={10} className="mt-1 shrink-0" />
                  </a>
                ) : (
                  <span className="text-[10px] leading-5 text-muted">{reference.source}</span>
                )}
              </div>
              <div>
                <span className="label mb-1 block">How ORBIT uses it</span>
                <p className="text-[10px] leading-5 text-muted">{reference.application}</p>
              </div>
              <div>
                <span className="label mb-1 block">Assumptions & limits</span>
                <p className="text-[10px] leading-5 text-muted">{reference.limitation}</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <Panel
        title="Source register"
        meta="Unique verifiable links used by the project"
        action={<FlaskConical size={14} className="text-muted" />}
      >
        <ul className="divide-y divide-line/60">
          {sources.map((source) => (
            <li key={source.url} className="py-2 first:pt-0 last:pb-0">
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-start justify-between gap-3 text-[10px] leading-5 text-muted hover:text-accent"
              >
                <span>{source.label}</span>
                <span className="shrink-0 font-mono text-[8px] text-muted/50">
                  {new URL(source.url).hostname}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel
        title="What ORBIT does not claim"
        meta="Binding constraints for this prototype"
        action={<ShieldAlert size={14} className="text-critical" />}
      >
        <div className="grid gap-3 md:grid-cols-2">
          {[
            'ORBIT is not a medical device and has not undergone clinical validation.',
            'No model in ORBIT was trained on NASA astronaut medical records.',
            'No alert is a diagnosis, and no decision option is a treatment recommendation.',
            'Radiation values are educational estimates, not individual risk predictions.',
            'Cognitive checks are browser measurements with hardware-dependent timing error.',
            'Correlation between indicators in a window is reported without causal inference.',
            'The crew members are fictional, and every physiological value is synthetic.',
            'NASA sources inform the framing and context, not the numerical coefficients of the model.',
          ].map((item) => (
            <div key={item} className="flex gap-2 border border-line bg-bg px-3 py-2">
              <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 bg-critical" />
              <span className="text-[10px] leading-5 text-muted">{item}</span>
            </div>
          ))}
        </div>
      </Panel>

      <p className="text-[10px] leading-5 text-muted/60" id="limitations">
        Full documentation is maintained in <span className="font-mono">docs/SCIENCE.md</span>,{' '}
        <span className="font-mono">docs/SIMULATION.md</span> and{' '}
        <span className="font-mono">docs/LIMITATIONS.md</span>. If a source cannot be verified, ORBIT
        does not attribute a numerical value to it.
      </p>
    </div>
  );
}
