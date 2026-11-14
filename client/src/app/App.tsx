import { Component, type ErrorInfo, type ReactNode, useEffect } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { Activity } from 'lucide-react';
import { AppShell } from './AppShell';
import { useOrbitStore, toPersistedWorkspace } from '../store/orbitStore';
import { loadWorkspace, saveWorkspace } from '../services/persistence';
import Intro from '../pages/Intro';
import Dashboard from '../pages/Dashboard';
import Astronauts from '../pages/Astronauts';
import AstronautDetail from '../pages/AstronautDetail';
import Simulation from '../pages/Simulation';
import Alerts from '../pages/Alerts';
import Assessments from '../pages/Assessments';
import Reports from '../pages/Reports';
import ReportDetail from '../pages/ReportDetail';
import Research from '../pages/Research';
import Settings from '../pages/Settings';
import Presentation from '../pages/Presentation';

export default function App() {
  const ready = useOrbitStore((s) => s.ready);
  const hydrate = useOrbitStore((s) => s.hydrate);
  const tick = useOrbitStore((s) => s.tick);
  const running = useOrbitStore((s) => s.running);
  const speed = useOrbitStore((s) => s.settings.speed);
  const reducedMotion = useOrbitStore((s) => s.settings.reducedMotion);
  const location = useLocation();

  // Restore the authoritative workspace snapshot. If IndexedDB is unavailable
  // the seeded in-memory mission is used and the application still works.
  useEffect(() => {
    let cancelled = false;
    loadWorkspace()
      .then((workspace) => {
        if (!cancelled) hydrate(workspace);
      })
      .catch(() => {
        if (!cancelled) hydrate(null);
      })
      .finally(() => {
        navigator.storage?.persist?.().catch(() => undefined);
      });
    return () => {
      cancelled = true;
    };
  }, [hydrate]);

  // Simulation loop. `tick` converts elapsed real seconds into simulated
  // minutes from the configured speed; engine calculations never run in a
  // render or animation frame.
  useEffect(() => {
    if (!running || !ready) return;
    const interval = window.setInterval(() => tick(1), 1000);
    return () => window.clearInterval(interval);
  }, [running, ready, speed, tick]);

  // Batched autosave of the authoritative snapshot. A pending save is not
  // pushed back by new ticks, otherwise a continuously running simulation
  // could starve persistence forever. Comparing a few top-level references
  // avoids serialising the workspace for unrelated UI state changes.
  useEffect(() => {
    let timer: number | null = null;
    let previous = useOrbitStore.getState();

    const persistNow = () => {
      const state = useOrbitStore.getState();
      if (!state.ready) return;
      saveWorkspace(toPersistedWorkspace(state)).catch(() => undefined);
    };

    const unsubscribe = useOrbitStore.subscribe((state) => {
      const changed =
        state.sim !== previous.sim ||
        state.observations !== previous.observations ||
        state.alerts !== previous.alerts ||
        state.assessments !== previous.assessments ||
        state.cognitiveTests !== previous.cognitiveTests ||
        state.decisions !== previous.decisions ||
        state.reports !== previous.reports ||
        state.settings !== previous.settings ||
        state.selectedAstronautId !== previous.selectedAstronautId ||
        state.mission !== previous.mission;
      previous = state;
      if (!changed || !state.ready) return;
      if (timer !== null) return;
      timer = window.setTimeout(() => {
        timer = null;
        persistNow();
      }, 1500);
    });

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') persistNow();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      unsubscribe();
      if (timer !== null) window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return (
    <ErrorBoundary>
      <MotionConfig reducedMotion={reducedMotion ? 'always' : 'user'}>
        <div className={reducedMotion ? 'reduce-motion min-h-screen' : 'min-h-screen'}>
          {!ready && location.pathname !== '/' ? (
            <BootScreen />
          ) : (
            <Routes>
              <Route path="/" element={<Intro />} />
              <Route path="/presentation" element={<Presentation />} />
              <Route element={<AppShell />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/astronauts" element={<Astronauts />} />
                <Route path="/astronauts/:astronautId" element={<AstronautDetail />} />
                <Route path="/simulation" element={<Simulation />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/assessments" element={<Assessments />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/reports/:reportId" element={<ReportDetail />} />
                <Route path="/research" element={<Research />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          )}
        </div>
      </MotionConfig>
    </ErrorBoundary>
  );
}

function BootScreen() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-bg px-6"
      role="status"
      aria-live="polite"
    >
      <Activity size={24} className="text-accent" />
      <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
        Restoring local workspace
      </p>
      <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.08em] text-muted/50">
        IndexedDB · deterministic mission state
      </p>
      <div className="mt-5 h-px w-48 overflow-hidden bg-line">
        <div className="h-full w-1/3 animate-sweep bg-accent" />
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-[65vh] flex-col items-start justify-center">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-critical">
        404 · Off-nominal route
      </p>
      <h1 className="mt-3 font-display text-3xl text-ink">This section is not on the flight plan.</h1>
      <p className="mt-2 max-w-md text-[12px] leading-6 text-muted">
        The requested route does not exist in this build of ORBIT. Return to the health intelligence
        overview to continue the monitoring workflow.
      </p>
      <Link to="/dashboard" className="btn btn-primary mt-5">
        Return to overview
      </Link>
    </div>
  );
}

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ORBIT runtime error', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg px-6">
        <div className="w-full max-w-lg border border-critical/30 bg-surface p-5">
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-critical">
            ORBIT runtime fault
          </p>
          <h1 className="mt-2 font-display text-xl text-ink">The interface could not continue.</h1>
          <p className="mt-2 text-[11px] leading-5 text-muted">
            Your locally stored mission data is separate from this interface error. Reload to restore
            the last saved workspace. If the fault repeats, export or reset local data from Settings
            after reloading.
          </p>
          <pre className="mt-3 max-h-40 overflow-auto border border-line bg-bg p-2 font-mono text-[9px] leading-4 text-muted">
            {this.state.error.message}
          </pre>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn btn-primary mt-4"
          >
            Reload ORBIT
          </button>
        </div>
      </div>
    );
  }
}
