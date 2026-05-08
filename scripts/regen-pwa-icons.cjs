/**
 * Regenerate PWA icons from the existing logo.svg (no text version).
 * Run: node scripts/regen-pwa-icons.cjs
 */
const { Resvg } = require("@resvg/resvg-js");
const fs   = require("fs");
const path = require("path");

const PUBLIC  = path.join(__dirname, "..", "public");
const logoSvg = fs.readFileSync(path.join(PUBLIC, "logo.svg"), "utf8");

function renderPng(svgStr, size) {
  const resvg = new Resvg(svgStr, {
    fitTo: { mode: "width", value: size },
    font:  { loadSystemFonts: false },
  });
  return Buffer.from(resvg.render().asPng());
}

fs.writeFileSync(path.join(PUBLIC, "icon-512.png"), renderPng(logoSvg, 512));
console.log("✓ icon-512.png (no text, 512×512)");

fs.writeFileSync(path.join(PUBLIC, "icon-192.png"), renderPng(logoSvg, 192));
console.log("✓ icon-192.png (no text, 192×192)");

console.log("\nPWA icons regenerated from logo.svg — no text.");
