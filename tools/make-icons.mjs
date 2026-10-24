// Erzeugt die App-Icons (PNG) ohne externe Pakete: node tools/make-icons.mjs
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";

const BG = [30, 79, 138], WHITE = [255, 255, 255], DARK = [16, 34, 58], HUB = [200, 210, 222], GLASS = [120, 160, 210];

// Formen in normierten Koordinaten (0..1). Spätere Formen übermalen frühere.
function colorAt(x, y) {
  let c = BG;
  const inRR = (x0, y0, x1, y1, r) => {
    if (x < x0 || x > x1 || y < y0 || y > y1) return false;
    const cx = Math.min(Math.max(x, x0 + r), x1 - r), cy = Math.min(Math.max(y, y0 + r), y1 - r);
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
  };
  const inTrap = (y0, y1, bx0, bx1, tx0, tx1) => {
    if (y < y0 || y > y1) return false;
    const f = (y - y0) / (y1 - y0);
    return x >= tx0 + (bx0 - tx0) * f && x <= tx1 + (bx1 - tx1) * f;
  };
  const inCircle = (cx, cy, r) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r;

  if (inTrap(0.33, 0.47, 0.29, 0.73, 0.37, 0.62) || inRR(0.2, 0.45, 0.8, 0.64, 0.05)) c = WHITE;
  if (inTrap(0.36, 0.46, 0.33, 0.69, 0.395, 0.6) && !(x > 0.495 && x < 0.52)) c = GLASS;
  if (inCircle(0.34, 0.64, 0.085)) c = DARK;
  if (inCircle(0.66, 0.64, 0.085)) c = DARK;
  if (inCircle(0.34, 0.64, 0.035) || inCircle(0.66, 0.64, 0.035)) c = HUB;
  return c;
}

function png(size) {
  const ss = 4, row = size * 4 + 1, raw = Buffer.alloc(row * size);
  for (let py = 0; py < size; py++) {
    raw[py * row] = 0;
    for (let px = 0; px < size; px++) {
      const acc = [0, 0, 0];
      for (let sy = 0; sy < ss; sy++)
        for (let sx = 0; sx < ss; sx++) {
          const c = colorAt((px + (sx + 0.5) / ss) / size, (py + (sy + 0.5) / ss) / size);
          acc[0] += c[0]; acc[1] += c[1]; acc[2] += c[2];
        }
      const o = py * row + 1 + px * 4;
      raw[o] = acc[0] / ss ** 2; raw[o + 1] = acc[1] / ss ** 2; raw[o + 2] = acc[2] / ss ** 2; raw[o + 3] = 255;
    }
  }
  const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = buf => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

const out = new URL("../icons/", import.meta.url);
mkdirSync(out, { recursive: true });
for (const [name, size] of [["icon-192.png", 192], ["icon-512.png", 512], ["apple-touch-icon.png", 180]]) {
  writeFileSync(new URL(name, out), png(size));
  console.log("geschrieben:", name);
}
