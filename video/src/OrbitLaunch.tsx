import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion';
import { Hud } from './components/Hud';
import { AlertScene } from './scenes/AlertScene';
import { ChaosScene } from './scenes/ChaosScene';
import { ContextScene } from './scenes/ContextScene';
import { DecisionScene } from './scenes/DecisionScene';
import { FinalScene } from './scenes/FinalScene';
import { LogoRevealScene } from './scenes/LogoRevealScene';
import { WorkflowScene } from './scenes/WorkflowScene';
import { C } from './styles/brand';

/**
 * ORBIT — 40 seconds at 60 fps.
 * Every scene is frame-driven; the score is an original procedural composition.
 */
export function OrbitLaunch() {
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Audio src={staticFile('audio/orbit-score.wav')} volume={0.9} />
      <Sequence from={0} durationInFrames={300} name="01 · Signals">
        <ChaosScene />
      </Sequence>
      <Sequence from={300} durationInFrames={300} name="02 · Meet ORBIT">
        <LogoRevealScene />
      </Sequence>
      <Sequence from={600} durationInFrames={360} name="03 · Context">
        <ContextScene />
      </Sequence>
      <Sequence from={960} durationInFrames={360} name="04 · Explain">
        <AlertScene />
      </Sequence>
      <Sequence from={1320} durationInFrames={420} name="05 · Decide">
        <DecisionScene />
      </Sequence>
      <Sequence from={1740} durationInFrames={360} name="06 · Workflow">
        <WorkflowScene />
      </Sequence>
      <Sequence from={2100} durationInFrames={300} name="07 · Resilience">
        <FinalScene />
      </Sequence>
      <Hud />
    </AbsoluteFill>
  );
}
