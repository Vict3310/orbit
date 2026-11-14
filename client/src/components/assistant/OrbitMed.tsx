import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Send, Sparkles, X } from 'lucide-react';
import { useOrbitStore, profileFor } from '../../store/orbitStore';
import { askOrbitMed } from '../../services/api';
import { buildMedContext } from '../../services/medContext';
import { explainLocally, SUGGESTED_QUESTIONS } from '../../engines/explain/localExplainer';
import { Badge, Button, cn } from '../ui';
import { formatMET } from '../../lib/format';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mode: 'local' | 'cloud';
  sources?: { label: string; url: string }[];
}

const GREETING: Message = {
  id: 'greeting',
  role: 'assistant',
  mode: 'local',
  content:
    'ORBIT MED ready. I explain the simulated health state and the evidence behind deterministic alerts. I cannot diagnose, prescribe, or change the mission.\n\nAsk me about fatigue, sleep, reaction time, radiation exposure, cabin CO2, or a specific alert.',
  sources: [
    { label: 'NASA Human Research Program', url: 'https://www.nasa.gov/hrp/' },
  ],
};

export function OrbitMedDrawer() {
  const open = useOrbitStore((s) => s.assistantOpen);
  const setOpen = useOrbitStore((s) => s.setAssistantOpen);
  const selectedId = useOrbitStore((s) => s.selectedAstronautId);
  const profile = useOrbitStore((s) => profileFor(s));
  const comms = useOrbitStore((s) => s.sim.env.comms);
  const useCloud = useOrbitStore((s) => s.settings.useCloudAI);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const offline = comms === 'loss' || !useCloud;

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 120);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, setOpen]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, pending]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || pending) return;
    setInput('');
    setNotice(null);
    const userMessage: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: question,
      mode: 'local',
    };
    setMessages((prev) => [...prev, userMessage]);
    setPending(true);

    const state = useOrbitStore.getState();
    const bundle = buildMedContext(state);

    if (offline) {
      const explanation = explainLocally(question, bundle.local);
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: explanation.text,
          mode: 'local',
          sources: explanation.sources,
        },
      ]);
      setPending(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const answer = await askOrbitMed(
        question,
        bundle.payload,
        messages.slice(-6).map((message) => ({ role: message.role, content: message.content })),
        controller.signal,
      );
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: answer.answer,
          mode: 'cloud',
          sources: answer.sources,
        },
      ]);
    } catch (error) {
      if (controller.signal.aborted) return;
      const explanation = explainLocally(question, bundle.local);
      setNotice(
        error instanceof Error
          ? `${error.message} Local explanation used instead.`
          : 'Cloud explanation unavailable. Local explanation used instead.',
      );
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: explanation.text,
          mode: 'local',
          sources: explanation.sources,
        },
      ]);
    } finally {
      setPending(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            aria-label="Close assistant overlay"
            className="fixed inset-0 z-40 bg-bg/70"
          />
          <motion.aside
            initial={{ x: 32, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 24, opacity: 0 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="orbit-med-title"
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[430px] flex-col border-l border-line bg-surface"
          >
            <header className="flex items-center justify-between border-b border-line px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center border border-accent/40 bg-accent/10 text-accent">
                  <Sparkles size={14} />
                </span>
                <div>
                  <h2 id="orbit-med-title" className="font-display text-sm tracking-wide text-ink">
                    ORBIT MED
                  </h2>
                  <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
                    Explanation layer · read-only
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={offline ? 'muted' : 'accent'}>{offline ? 'Local' : 'Cloud ready'}</Badge>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close ORBIT MED"
                  className="p-1.5 text-muted hover:text-ink"
                >
                  <X size={16} />
                </button>
              </div>
            </header>

            <div className="border-b border-line bg-surface2/40 px-4 py-2.5">
              <div className="flex items-center justify-between">
                <span className="label">Context</span>
                <span className="font-mono text-[9px] text-muted">{formatMET(useOrbitStore.getState().sim.clock)}</span>
              </div>
              <p className="mt-1 text-[11px] text-muted">
                {profile.name} · {profile.role} · {offline ? 'local state snapshot' : 'validated state snapshot'}
              </p>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
              {messages.map((message) => (
                <div key={message.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="label">{message.role === 'user' ? 'You' : 'ORBIT MED'}</span>
                    {message.role === 'assistant' && (
                      <Badge tone={message.mode === 'cloud' ? 'accent' : 'muted'}>
                        {message.mode === 'cloud' ? 'Cloud' : 'Local'}
                      </Badge>
                    )}
                  </div>
                  <div
                    className={cn(
                      'whitespace-pre-line border px-3 py-2.5 text-[12px] leading-[1.65]',
                      message.role === 'user'
                        ? 'border-line bg-surface2 text-ink'
                        : 'border-line/70 bg-bg text-muted',
                    )}
                  >
                    {message.content}
                  </div>
                  {message.sources && message.sources.length > 0 && (
                    <ul className="space-y-1 pl-1">
                      {message.sources.slice(0, 4).map((source) => (
                        <li key={source.url}>
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noreferrer"
                            className="link-underline font-mono text-[9px] uppercase tracking-[0.06em] text-muted hover:text-accent"
                          >
                            {source.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
              {pending && (
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
                  <span className="h-1.5 w-1.5 animate-pulse-soft bg-accent" />
                  Composing explanation from the state snapshot
                </div>
              )}
            </div>

            {notice && (
              <div className="border-t border-caution/30 bg-caution/5 px-4 py-2 text-[10px] leading-4 text-caution">
                {notice}
              </div>
            )}

            <div className="border-t border-line p-3">
              <div className="mb-2 flex flex-wrap gap-1.5">
                {SUGGESTED_QUESTIONS.slice(0, 3).map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => void send(question)}
                    disabled={pending}
                    className="border border-line bg-bg px-2 py-1 text-left font-mono text-[9px] uppercase tracking-[0.04em] text-muted hover:border-accent/40 hover:text-accent disabled:opacity-40"
                  >
                    {question}
                  </button>
                ))}
              </div>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void send(input);
                }}
                className="flex items-center gap-2"
              >
                <label htmlFor="orbit-med-input" className="sr-only">
                  Ask ORBIT MED a question about the simulated health state
                </label>
                <input
                  id="orbit-med-input"
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ask about the current simulated state…"
                  maxLength={600}
                  className="input text-[12px]"
                />
                <Button
                  type="submit"
                  variant="primary"
                  disabled={input.trim().length < 3 || pending}
                  aria-label="Send question"
                  className="h-9 w-9 shrink-0 px-0"
                >
                  <Send size={14} />
                </Button>
              </form>
              <p className="mt-2 text-[9px] leading-4 text-muted/70">
                Educational prototype. Simulated data. Not a diagnosis or medical advice. Alerts are
                produced deterministically and cannot be overridden by this assistant.
                {offline && comms === 'loss' ? ' Communication loss: local engine only.' : ''}
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
