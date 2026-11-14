/**
 * Deterministic hash-based noise. ORBIT never calls Math.random inside the
 * simulation engine, so identical seeds and decisions reproduce identical
 * missions across reloads and test runs.
 */
export function hashNoise(seed: number, ...parts: (string | number)[]): number {
  let h = 2166136261 >>> 0;
  const feed = (value: string) => {
    for (let i = 0; i < value.length; i += 1) {
      h ^= value.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    h ^= 0x9e3779b9;
    h = Math.imul(h, 2654435761);
  };
  feed(String(seed));
  for (const part of parts) feed(String(part));
  return (h >>> 0) / 0xffffffff * 2 - 1;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function round(value: number, digits = 1): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
