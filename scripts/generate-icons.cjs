/**
 * CopyTradeAI icon generator
 * Produces: logo.svg, icon-192.png, icon-512.png, favicon.ico
 *
 * Run from dashboard/:  node scripts/generate-icons.js
 */

const { Resvg } = require("@resvg/resvg-js");
const fs   = require("fs");
const path = require("path");

const PUBLIC = path.join(__dirname, "..", "public");

// ─────────────────────────────────────────────────────────────────────────────
// SVG builder
// ─────────────────────────────────────────────────────────────────────────────
function buildSvg(size, includeText) {
  const r  = Math.round(size * 0.176);   // Apple-style rounded corners (~17%)
  const cx = size / 2;

  // Waveform geometry — scales with canvas size
  // Chart occupies the middle-upper 60% of canvas; shifts up when text is included
  const chartYCenter = includeText ? size * 0.42 : size * 0.50;
  const amplitude    = size * 0.14;
  const xPad         = size * 0.12;
  const xEnd         = size - xPad;
  const xSpan        = xEnd - xPad;

  // 7 control points: L→R, alternating valley/peak, overall trending UP
  const pts = [
    [xPad,                     chartYCenter + amplitude * 0.30],  // start (mid)
    [xPad + xSpan * 0.18,      chartYCenter + amplitude * 1.00],  // valley 1
    [xPad + xSpan * 0.36,      chartYCenter - amplitude * 0.20],  // peak 1
    [xPad + xSpan * 0.50,      chartYCenter + amplitude * 0.60],  // valley 2
    [xPad + xSpan * 0.66,      chartYCenter - amplitude * 0.70],  // peak 2
    [xPad + xSpan * 0.82,      chartYCenter + amplitude * 0.10],  // valley 3
    [xEnd,                     chartYCenter - amplitude * 1.10],  // final peak (highest)
  ].map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

  const sw       = size * 0.056;   // stroke width
  const glowSw   = size * 0.12;    // glow stroke width
  const textSz   = size * 0.108;
  const textY    = size * 0.91;

  return `<svg xmlns="http://www.w3.org/2000/svg"
  width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <!-- Background: purple-center, dark edges, teal accent top-right -->
    <radialGradient id="bgA" cx="38%" cy="32%" r="62%">
      <stop offset="0%"   stop-color="#7c3aed"/>
      <stop offset="48%"  stop-color="#2e1870"/>
      <stop offset="100%" stop-color="#050508"/>
    </radialGradient>
    <radialGradient id="bgB" cx="72%" cy="22%" r="55%">
      <stop offset="0%"   stop-color="#22d3ee" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="#22d3ee" stop-opacity="0"/>
    </radialGradient>

    <!-- Orb 1: teal, top-right -->
    <radialGradient id="orb1" cx="50%" cy="50%" r="50%">
      <stop offset="0%"   stop-color="#22d3ee" stop-opacity="0.50"/>
      <stop offset="100%" stop-color="#22d3ee" stop-opacity="0"/>
    </radialGradient>
    <!-- Orb 2: violet, lower-left -->
    <radialGradient id="orb2" cx="50%" cy="50%" r="50%">
      <stop offset="0%"   stop-color="#a855f7" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#a855f7" stop-opacity="0"/>
    </radialGradient>

    <!-- Glow filter for chart line -->
    <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="${(size * 0.025).toFixed(1)}" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>

    <clipPath id="clip">
      <rect width="${size}" height="${size}" rx="${r}"/>
    </clipPath>
  </defs>

  <g clip-path="url(#clip)">
    <!-- Base fill -->
    <rect width="${size}" height="${size}" fill="#050508"/>
    <!-- Purple radial -->
    <rect width="${size}" height="${size}" fill="url(#bgA)"/>
    <!-- Teal accent overlay -->
    <rect width="${size}" height="${size}" fill="url(#bgB)"/>

    <!-- Orb 1: teal glow, top-right -->
    <ellipse cx="${(size * 0.74).toFixed(0)}" cy="${(size * 0.22).toFixed(0)}"
      rx="${(size * 0.44).toFixed(0)}" ry="${(size * 0.38).toFixed(0)}"
      fill="url(#orb1)" opacity="0.85"/>

    <!-- Orb 2: violet glow, lower-left -->
    <ellipse cx="${(size * 0.23).toFixed(0)}" cy="${(size * 0.70).toFixed(0)}"
      rx="${(size * 0.38).toFixed(0)}" ry="${(size * 0.32).toFixed(0)}"
      fill="url(#orb2)" opacity="0.75"/>

    <!-- Chart glow (teal haze behind line) -->
    <polyline points="${pts}"
      fill="none" stroke="#22d3ee" stroke-width="${glowSw.toFixed(1)}"
      stroke-linecap="round" stroke-linejoin="round"
      opacity="0.22" filter="url(#glow)"/>

    <!-- Chart line (crisp white, glow filter) -->
    <polyline points="${pts}"
      fill="none" stroke="#ffffff" stroke-width="${sw.toFixed(1)}"
      stroke-linecap="round" stroke-linejoin="round"
      opacity="0.96" filter="url(#glow)"/>

    ${includeText ? `
    <!-- "CopyTradeAI" label -->
    <text x="${cx}" y="${textY.toFixed(1)}"
      text-anchor="middle"
      font-family="Arial, Helvetica, sans-serif"
      font-size="${textSz.toFixed(1)}"
      font-weight="700"
      fill="white"
      opacity="0.88"
      letter-spacing="-0.8"
      xml:space="preserve">CopyTradeAI</text>
    ` : ""}
  </g>
</svg>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Minimal ICO writer (embeds a PNG entry)
// ─────────────────────────────────────────────────────────────────────────────
function createIco(pngBuffer, size) {
  const hdr = Buffer.alloc(6);
  hdr.writeUInt16LE(0, 0);   // reserved
  hdr.writeUInt16LE(1, 2);   // type: ICO
  hdr.writeUInt16LE(1, 4);   // 1 image

  const dir = Buffer.alloc(16);
  dir.writeUInt8(size > 255 ? 0 : size, 0);  // width (0 = 256)
  dir.writeUInt8(size > 255 ? 0 : size, 1);  // height
  dir.writeUInt8(0, 2);      // color count
  dir.writeUInt8(0, 3);      // reserved
  dir.writeUInt16LE(1,  4);  // color planes
  dir.writeUInt16LE(32, 6);  // bits per pixel
  dir.writeUInt32LE(pngBuffer.length, 8);   // image data size
  dir.writeUInt32LE(22, 12); // offset (6 + 16 = 22)

  return Buffer.concat([hdr, dir, pngBuffer]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Render SVG → PNG buffer via resvg
// ─────────────────────────────────────────────────────────────────────────────
function renderPng(svgStr, size) {
  const resvg = new Resvg(svgStr, {
    fitTo: { mode: "width", value: size },
    font:  { loadSystemFonts: true },
  });
  return Buffer.from(resvg.render().asPng());
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  if (!fs.existsSync(PUBLIC)) fs.mkdirSync(PUBLIC, { recursive: true });

  // logo.svg — no text, used in app header and browser tab
  const logoSvg = buildSvg(512, false);
  fs.writeFileSync(path.join(PUBLIC, "logo.svg"), logoSvg, "utf8");
  console.log("✓ logo.svg");

  // icon-512.png — with text, PWA splash
  const svg512 = buildSvg(512, true);
  fs.writeFileSync(path.join(PUBLIC, "icon-512.png"), renderPng(svg512, 512));
  console.log("✓ icon-512.png");

  // icon-192.png — with text, PWA home screen
  const svg192 = buildSvg(192, true);
  fs.writeFileSync(path.join(PUBLIC, "icon-192.png"), renderPng(svg192, 192));
  console.log("✓ icon-192.png");

  // favicon.ico — 32px, no text, ICO wrapper around PNG
  const svg32    = buildSvg(32, false);
  const png32    = renderPng(svg32, 32);
  const icoData  = createIco(png32, 32);
  fs.writeFileSync(path.join(PUBLIC, "favicon.ico"), icoData);
  console.log("✓ favicon.ico");

  console.log("\nAll icons written to", PUBLIC);
}

main().catch((err) => { console.error(err); process.exit(1); });
