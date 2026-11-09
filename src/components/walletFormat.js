// Shared formatting for the Wallets tab and the Attribution view

export const pct = (x, digits = 1) =>
  (x === null || x === undefined ? "--" : (x * 100).toFixed(digits) + "%");

export const signedPct = (x) =>
  (x === null || x === undefined ? "--" : (x >= 0 ? "+" : "") + (x * 100).toFixed(1) + "%");

export const returnClass = (x) =>
  (x === null || x === undefined ? "wl-muted" : x > 0 ? "wl-pos" : x < 0 ? "wl-neg" : "");
