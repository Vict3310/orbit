import { Composition } from 'remotion';
import { OrbitLaunch } from './OrbitLaunch';
import { ChaosScene } from './scenes/ChaosScene';
import { LogoRevealScene } from './scenes/LogoRevealScene';
import { ContextScene } from './scenes/ContextScene';
import { AlertScene } from './scenes/AlertScene';

/**
 * Remotion workbench. Each finished scene is registered independently so it can
 * be scrubbed and art-directed before the final 40-second composition is wired.
 */
export function RemotionRoot() {
  return (
    <>
      <Composition
        id="OrbitLaunch"
        component={OrbitLaunch}
        durationInFrames={2400}
        fps={60}
        width={1920}
        height={1080}
      />
      <Composition
        id="Orbit-01-Chaos"
        component={ChaosScene}
        durationInFrames={300}
        fps={60}
        width={1920}
        height={1080}
      />
      <Composition
        id="Orbit-02-Logo"
        component={LogoRevealScene}
        durationInFrames={300}
        fps={60}
        width={1920}
        height={1080}
      />
      <Composition
        id="Orbit-03-Context"
        component={ContextScene}
        durationInFrames={360}
        fps={60}
        width={1920}
        height={1080}
      />
      <Composition
        id="Orbit-04-Alert"
        component={AlertScene}
        durationInFrames={360}
        fps={60}
        width={1920}
        height={1080}
      />
    </>
  );
}
