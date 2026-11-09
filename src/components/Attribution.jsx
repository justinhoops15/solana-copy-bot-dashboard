import { useState, useEffect } from "react";
import { getAttribution } from "../api/botApi";
import { pct, signedPct, returnClass } from "./walletFormat";

const STATUS_LABEL = { active: "Active", probation: "Probation", demoted: "Demoted", removed: "Removed" };

const usd = (x) => (x === 0 ? "$0.00" : (x > 0 ? "+$" : "-$") + Math.abs(x).toFixed(2));

export default function Attribution() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAttribution().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading attribution...</div>;

  const wallets = (data && data.wallets) || [];
  const totals  = (data && data.totals) || { pnlUsd: 0, trades: 0, netReturn: null };

  return (
    <div>
      <p className="wl-note">
        Net return after the configured slippage and fees, per wallet, so you can see which wallets add value.
        Only trades copied since slippage modeling began are counted. Shadow figures are simulated probation trades.
      </p>

      <div className="at-summary">
        <div className="at-summary-item">
          <span className={"wl-val " + returnClass(totals.netReturn)}>{signedPct(totals.netReturn)}</span>
          <span className="wl-lbl">Net return, all copied trades</span>
        </div>
        <div className="at-summary-item">
          <span className={"wl-val " + (totals.pnlUsd > 0 ? "wl-pos" : totals.pnlUsd < 0 ? "wl-neg" : "")}>{usd(totals.pnlUsd)}</span>
          <span className="wl-lbl">Net PnL</span>
        </div>
        <div className="at-summary-item">
          <span className="wl-val">{totals.trades}</span>
          <span className="wl-lbl">Copied trades</span>
        </div>
      </div>

      {wallets.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-title">No results to attribute yet</div>
          <div className="empty-state-sub">Shadow and copied trades appear here once wallets start trading</div>
        </div>
      ) : (
        <>
          <div className="at-head">
            <span>Wallet</span>
            <span>Copied trades</span>
            <span>Net return</span>
            <span>Net PnL</span>
            <span>Win rate</span>
            <span>Shadow net</span>
            <span>Share of PnL</span>
          </div>
          <div className="wl-list">
            {wallets.map((w) => {
              const short = w.address.length > 12 ? w.address.slice(0, 6) + "..." + w.address.slice(-4) : w.address;
              return (
                <div key={w.address} className="at-row">
                  <div className="wl-cell wl-cell--wallet">
                    <a href={"https://solscan.io/account/" + w.address} target="_blank" rel="noopener noreferrer" className="wallet-addr">{short}</a>
                    <span className={"wl-status wl-status--" + w.status}>{STATUS_LABEL[w.status] || w.status}</span>
                  </div>
                  <div className="wl-cell"><span className="wl-val">{w.copied.n}</span><span className="wl-lbl">Copied trades</span></div>
                  <div className="wl-cell"><span className={"wl-val " + returnClass(w.copied.netReturn)}>{signedPct(w.copied.netReturn)}</span><span className="wl-lbl">Net return</span></div>
                  <div className="wl-cell"><span className={"wl-val " + (w.copied.pnlUsd > 0 ? "wl-pos" : w.copied.pnlUsd < 0 ? "wl-neg" : "wl-muted")}>{w.copied.n ? usd(w.copied.pnlUsd) : "--"}</span><span className="wl-lbl">Net PnL</span></div>
                  <div className="wl-cell"><span className="wl-val">{pct(w.copied.winRate)}</span><span className="wl-lbl">Win rate</span></div>
                  <div className="wl-cell"><span className={"wl-val " + returnClass(w.shadow.netReturn)}>{signedPct(w.shadow.netReturn)}</span><span className="wl-lbl">Shadow net ({w.shadow.n})</span></div>
                  <div className="wl-cell"><span className="wl-val">{w.pnlShare === null ? "--" : pct(w.pnlShare, 0)}</span><span className="wl-lbl">Share of PnL</span></div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
