/**
 * ORBIT launch score — an original, procedurally generated 40-second bed.
 *
 * No third-party music or samples are used. The output is a 48 kHz, 16-bit
 * stereo WAV with a 120 BPM pulse, bass, arpeggio, impacts, whooshes and a
 * deliberate near-silence before the logo reveal. Deterministic seed.
 */
import fs from 'node:fs';
import path from 'node:path';

const SAMPLE_RATE = 48_000;
const DURATION = 40;
const TOTAL = SAMPLE_RATE * DURATION;
const left = new Float64Array(TOTAL);
const right = new Float64Array(TOTAL);

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = mulberry32(20260413);

function panGains(pan) {
  const p = Math.max(-1, Math.min(1, pan));
  return [Math.cos(((p + 1) * Math.PI) / 4), Math.sin(((p + 1) * Math.PI) / 4)];
}

function add(t, value, pan = 0) {
  const index = Math.round(t * SAMPLE_RATE);
  if (index < 0 || index >= TOTAL) return;
  const [gl, gr] = panGains(pan);
  left[index] += value * gl;
  right[index] += value * gr;
}

function env(t, attack, decay) {
  if (t < 0) return 0;
  if (t < attack) return t / attack;
  return Math.exp(-(t - attack) / decay);
}

function kick(start, gain = 0.9) {
  const length = 0.46;
  for (let i = 0; i < length * SAMPLE_RATE; i += 1) {
    const t = i / SAMPLE_RATE;
    const freq = 46 + 92 * Math.exp(-t / 0.045);
    const body = Math.sin(2 * Math.PI * freq * t) * env(t, 0.002, 0.16);
    const click = (random() * 2 - 1) * Math.exp(-t / 0.008) * 0.18;
    add(start + t, (body + click) * gain);
  }
}

function hat(start, gain = 0.12, pan = 0.2) {
  const length = 0.09;
  let previous = 0;
  for (let i = 0; i < length * SAMPLE_RATE; i += 1) {
    const t = i / SAMPLE_RATE;
    const noise = random() * 2 - 1;
    const high = noise - previous * 0.92;
    previous = noise;
    add(start + t, high * env(t, 0.001, 0.022) * gain, pan);
  }
}

function pluck(start, frequency, gain = 0.16, pan = 0, decay = 0.20) {
  const length = Math.min(0.7, decay * 4);
  for (let i = 0; i < length * SAMPLE_RATE; i += 1) {
    const t = i / SAMPLE_RATE;
    const fundamental = Math.sin(2 * Math.PI * frequency * t);
    const harmonic = Math.sin(2 * Math.PI * frequency * 2 * t) * 0.24;
    add(start + t, (fundamental + harmonic) * env(t, 0.002, decay) * gain, pan);
  }
}

function bass(start, frequency, gain = 0.24) {
  const length = 0.46;
  for (let i = 0; i < length * SAMPLE_RATE; i += 1) {
    const t = i / SAMPLE_RATE;
    const value =
      Math.sin(2 * Math.PI * frequency * t) +
      Math.sin(2 * Math.PI * frequency * 2 * t) * 0.18;
    add(start + t, value * env(t, 0.006, 0.18) * gain);
  }
}

function pad(start, frequencies, duration, gain = 0.035) {
  for (let i = 0; i < duration * SAMPLE_RATE; i += 1) {
    const t = i / SAMPLE_RATE;
    const attack = Math.min(1, t / 0.8);
    const release = Math.min(1, (duration - t) / 1.2);
    let value = 0;
    for (const frequency of frequencies) {
      value += Math.sin(2 * Math.PI * frequency * t) * 0.5;
      value += Math.sin(2 * Math.PI * frequency * 1.003 * t) * 0.25;
    }
    add(start + t, value * attack * release * gain);
  }
}

function whoosh(start, duration = 0.7, gain = 0.14, reverse = false) {
  let previous = 0;
  for (let i = 0; i < duration * SAMPLE_RATE; i += 1) {
    const t = i / SAMPLE_RATE;
    const progress = t / duration;
    const envelope = reverse ? progress : 1 - progress;
    const noise = random() * 2 - 1;
    const filtered = noise * 0.55 + previous * 0.45;
    previous = filtered;
    add(start + t, filtered * envelope * envelope * gain, -0.7 + progress * 1.4);
  }
}

function impact(start, gain = 1) {
  for (let i = 0; i < 1.4 * SAMPLE_RATE; i += 1) {
    const t = i / SAMPLE_RATE;
    const low = Math.sin(2 * Math.PI * (38 + 26 * Math.exp(-t / 0.07)) * t);
    const body = low * Math.exp(-t / 0.38);
    const click = (random() * 2 - 1) * Math.exp(-t / 0.012) * 0.35;
    add(start + t, (body + click) * gain);
  }
}

function riser(start, duration, gain = 0.10) {
  let phase = 0;
  for (let i = 0; i < duration * SAMPLE_RATE; i += 1) {
    const t = i / SAMPLE_RATE;
    const progress = t / duration;
    phase += (220 + progress * 1400) / SAMPLE_RATE;
    const tone = Math.sin(2 * Math.PI * phase) * 0.4;
    const noise = (random() * 2 - 1) * 0.06;
    add(start + t, (tone + noise) * progress * progress * gain);
  }
}

/* ------------------------------------------------------------------ */
/* Intro: low drone and clockwork ticks, then a riser into the logo.   */
/* ------------------------------------------------------------------ */

pad(0, [55, 82.41, 110], 5, 0.045);
for (let t = 0; t < 4.55; t += 0.25) {
  hat(t, 0.035, 0);
  if (t % 1 === 0) kick(t, 0.32);
}
for (let t = 0; t < 4.4; t += 0.5) {
  pluck(t, 440, 0.035, -0.5, 0.06);
  pluck(t + 0.25, 660, 0.024, 0.5, 0.05);
}
riser(3.4, 1.45, 0.13);
whoosh(4.25, 0.65, 0.2, true);
// Deliberate near-silence before the reveal.
for (let t = 4.55; t < 4.98; t += 0.01) {
  const index = Math.round(t * SAMPLE_RATE);
  if (index < TOTAL) {
    left[index] *= 0.08;
    right[index] *= 0.08;
  }
}
impact(5.0, 1.05);

/* ------------------------------------------------------------------ */
/* Main bed: 120 BPM, A minor / F / C / G, from 5 s to 35 s.          */
/* ------------------------------------------------------------------ */

const BPM = 120;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;
const roots = [55, 43.65, 65.41, 49];
const chords = [
  [220, 261.63, 329.63],
  [174.61, 220, 261.63],
  [130.81, 164.81, 196],
  [196, 246.94, 293.66],
];
const arp = [
  [440, 523.25, 659.25, 523.25],
  [349.23, 440, 523.25, 440],
  [261.63, 329.63, 392, 329.63],
  [392, 493.88, 587.33, 493.88],
];

for (let bar = 0; bar < 15; bar += 1) {
  const barStart = 5 + bar * BAR;
  if (barStart >= 35) break;
  const root = roots[bar % 4];
  const chord = chords[bar % 4];
  const notes = arp[bar % 4];
  const intensity = bar < 2 ? 0.68 : bar < 8 ? 1 : bar < 12 ? 1.05 : 0.9;

  what: {
    for (let beat = 0; beat < 4; beat += 1) {
      const t = barStart + beat * BEAT;
      if (t >= 34.5) break what;
      kick(t, 0.72 * intensity);
      hat(t + BEAT / 2, 0.085 * intensity, beat % 2 === 0 ? 0.3 : -0.3);
    }
  }

  for (let eighth = 0; eighth < 8; eighth += 1) {
    const t = barStart + eighth * (BEAT / 2);
    if (t >= 34.5) break;
    bass(t, root, eighth % 2 === 0 ? 0.21 : 0.14);
  }

  for (let sixteenth = 0; sixteenth < 16; sixteenth += 1) {
    const t = barStart + sixteenth * (BEAT / 4);
    if (t >= 34.5) break;
    if (sixteenth % 4 === 2) continue;
    pluck(
      t,
      notes[sixteenth % notes.length],
      0.055 * intensity,
      sixteenth % 2 === 0 ? -0.42 : 0.42,
      0.10,
    );
  }

  if (bar % 2 === 0) {
    pad(barStart, chord, BAR * 2, 0.028);
  }

  if (bar === 3 || bar === 7 || bar === 11) {
    whoosh(barStart + BAR - 0.55, 0.55, 0.1, true);
  }
}

// Transition accents: notes, alert reveal, simulator, workflow, final.
for (const [time, gain] of [
  [10, 0.4],
  [16, 0.45],
  [22, 0.42],
  [29, 0.8],
  [35, 0.7],
]) {
  impact(time, gain);
  whoosh(time - 0.5, 0.55, 0.1, true);
}
whoosh(34.4, 0.7, 0.12, true);
pad(35, [220, 261.63, 329.63, 440], 5, 0.06);
for (let i = 0; i < 5; i += 1) {
  pluck(35.2 + i * 0.58, [440, 523.25, 659.25, 880, 1046.5][i], 0.085, i % 2 ? 0.4 : -0.4, 0.3);
}
impact(35.0, 0.85);

/* ------------------------------------------------------------------ */
/* Master: gentle saturation, peak normalise, fade tail.              */
/* ------------------------------------------------------------------ */

let peak = 0;
for (let i = 0; i < TOTAL; i += 1) {
  left[i] = Math.tanh(left[i] * 1.15);
  right[i] = Math.tanh(right[i] * 1.15);
  peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
}
const scale = peak > 0 ? 0.88 / peak : 1;
const fadeStart = Math.round(38.6 * SAMPLE_RATE);
for (let i = 0; i < TOTAL; i += 1) {
  let gain = scale;
  if (i > fadeStart) {
    gain *= Math.max(0, 1 - (i - fadeStart) / (TOTAL - fadeStart));
  }
  left[i] *= gain;
  right[i] *= gain;
}

const bytesPerSample = 2;
const dataSize = TOTAL * 2 * bytesPerSample;
const buffer = Buffer.alloc(44 + dataSize);
buffer.write('RIFF', 0);
buffer.writeUInt32LE(36 + dataSize, 4);
buffer.write('WAVE', 8);
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20);
buffer.writeUInt16LE(2, 22);
buffer.writeUInt32LE(SAMPLE_RATE, 24);
buffer.writeUInt32LE(SAMPLE_RATE * 2 * bytesPerSample, 28);
buffer.writeUInt16LE(2 * bytesPerSample, 32);
buffer.writeUInt16LE(16, 34);
buffer.write('data', 36);
buffer.writeUInt32LE(dataSize, 40);

let offset = 44;
for (let i = 0; i < TOTAL; i += 1) {
  buffer.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(left[i] * 32767))), offset);
  buffer.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(right[i] * 32767))), offset + 2);
  offset += 4;
}

const output = path.resolve('public/audio/orbit-score.wav');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, buffer);
console.log(`wrote ${output} (${(dataSize / 1024 / 1024).toFixed(1)} MiB, ${DURATION}s)`);
