/**
 * Generates ORBIT PWA icons as PNGs with no image dependencies.
 * Run with: node scripts/generate-icons.mjs
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, '../public/icons');
mkdirSync(outDir, { recursive: true });

const BG = [8, 13, 19];
const INK = [244, 247, 250];
const ACCENT = [217, 242, 106];
const SURFACE = [17, 25, 35];

function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c >>> 0;
    }
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePng(size, rgba) {
  const stride = size * 4 + 1;
  const raw = Buffer.alloc(stride * size);
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0;
    rgba.copy(raw, y * stride + 1, y * size * 4, (y + 1) * size * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const smooth = (edge0, edge1, x) => {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

function render(size) {
  const rgba = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const ringR = size * 0.33;
  const ringW = Math.max(2, size * 0.028);
  const satAngle = -Math.PI / 4;
  const satX = cx + Math.cos(satAngle) * ringR;
  const satY = cy + Math.sin(satAngle) * ringR;
  const satR = size * 0.052;
  const coreR = size * 0.055;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      let color = BG;
      const d = Math.hypot(px - cx, py - cy);
      // Fine registration ticks, like a mission-control reticle.
      const tick = size * 0.055;
      const edgeX = Math.min(px, size - px);
      const edgeY = Math.min(py, size - py);
      const inTickZone = edgeX < tick && edgeY < tick;
      const onTick =
        (Math.abs(px - tick) < size * 0.006 && py < tick) ||
        (Math.abs(py - tick) < size * 0.006 && px < tick) ||
        (Math.abs(px - (size - tick)) < size * 0.006 && py < tick) ||
        (Math.abs(py - (size - tick)) < size * 0.006 && px < tick) ||
        (Math.abs(px - tick) < size * 0.006 && py > size - tick) ||
        (Math.abs(py - (size - tick)) < size * 0.006 && px > size - tick) ||
        (Math.abs(px - (size - tick)) < size * 0.006 && py > size - tick) ||
        (Math.abs(py - tick) < size * 0.006 && px > size - tick);
      if (inTickZone && onTick) color = mix(color, [41, 55, 68], 0.95);

      // Planet disc with a dark rim.
      const discEdge = size * 0.145;
      if (d < discEdge) color = SURFACE;
      const discRim = Math.abs(d - discEdge);
      if (discRim < size * 0.012) color = mix(color, [41, 55, 68], 0.9);

      // Orbit ring.
      const ring = Math.abs(d - ringR);
      const ringCoverage = 1 - smooth(ringW / 2 - 0.8, ringW / 2 + 0.8, ring);
      if (ringCoverage > 0) color = mix(color, ACCENT, ringCoverage * 0.92);

      // Satellite marker.
      const sat = Math.hypot(px - satX, py - satY);
      const satCoverage = 1 - smooth(satR - 1, satR + 1, sat);
      if (satCoverage > 0) color = mix(color, INK, satCoverage);

      // Central core.
      const core = 1 - smooth(coreR - 1, coreR + 1, d);
      if (core > 0) color = mix(color, ACCENT, core);

      const i = (y * size + x) * 4;
      rgba[i] = color[0];
      rgba[i + 1] = color[1];
      rgba[i + 2] = color[2];
      rgba[i + 3] = 255;
    }
  }
  return encodePng(size, rgba);
}

for (const size of [192, 512]) {
  const file = resolve(outDir, `orbit-${size}.png`);
  writeFileSync(file, render(size));
  console.log(`wrote ${file}`);
}
