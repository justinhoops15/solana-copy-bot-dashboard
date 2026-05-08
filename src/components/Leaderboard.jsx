import { useState, useEffect } from "react";
import { getWallets, approveWallet, pinWallet } from "../api/botApi";

function WinBar({ rate }) {
  const pct = Math.min(100, Math.max(0, rate * 100));
  return (
    <div className="wallet-winrate-cell">
      <span className="wallet-winrate-pct" style={{ color: "#4caf84" }}>{pct.toFixed(1)}%</span>
      <div className="win-bar-track">
        <div className="win-bar-fill" style={{ width: pct + "%" }} />
      </div>
    </div>
  );
}

export default function Leaderboard() {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () =>
    getWallets(20).then(setWallets).catch(console.error).finally(() => setLoading(false));

  useEffect(() => {
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, []);

  const toggle    = async (w) => { await approveWallet(w.address, !w.approved); load(); };
  const togglePin = async (w) => { await pinWallet(w.address, !w.pinned);   load(); };

  if (loading) return <div className="loading">Loading wallets...</div>;

  return (
    <div>
      <div className="section-head">
        <span className="section-title">Wallets</span>
        <span className="section-count">{wallets.length} scored</span>
      </div>

      <div className="lb-col-head">
        <span>#</span>
        <span>Address</span>
        <span>Win Rate</span>
        <span>Score</span>
        <span>Trades</span>
        <span>Realized PnL</span>
        <span></span>
      </div>

      {wallets.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-title">No wallets scored yet</div>
          <div className="empty-state-sub">Run npm run score inside /bot to populate this list</div>
        </div>
      ) : (
        <div className="wallet-list">
          {wallets.map((w, i) => {
            const pnl    = parseFloat(w.realized_pnl) || 0;
            const pinned = !!w.pinned;
            const auto   = !!w.approved && !pinned;
            return (
              <div key={w.address} className={"wallet-row" + (w.approved ? " approved" : "")}>

                <span className="wallet-rank">{i + 1}</span>

                {/* address + badges — display:contents on desktop so grid sees children */}
                <div className="wallet-addr-col">
                  <a
                    href={"https://solscan.io/account/" + w.address}
                    target="_blank" rel="noopener noreferrer"
                    className="wallet-addr"
                  >
                    {w.address.slice(0, 6)}...{w.address.slice(-4)}
                  </a>
                  {pinned && <span className="badge-pinned">PINNED</span>}
                  {auto   && <span className="badge-auto">AUTO</span>}
                </div>

                <WinBar rate={w.win_rate} />

                {/* wallet-row-meta: display:contents on desktop keeps grid intact;
                    becomes a visible flex row on mobile */}
                <div className="wallet-row-meta">
                  <div className="wallet-cell">
                    <div className="wallet-cell-val wallet-cell-val--score">{w.score.toFixed(1)}</div>
                    <div className="wallet-cell-lbl">Score</div>
                  </div>
                  <div className="wallet-cell">
                    <div className="wallet-cell-val">{w.trade_count.toLocaleString()}</div>
                    <div className="wallet-cell-lbl">Trades</div>
                  </div>
                  <div className="wallet-cell">
                    <div className="wallet-cell-val pos">
                      ${Math.abs(pnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                    <div className="wallet-cell-lbl">Realized</div>
                  </div>
                </div>

                {/* wallet-row-actions: flex row on both desktop and mobile */}
                <div className="wallet-row-actions">
                  <button
                    className={"btn-pin" + (pinned ? " pinned" : "")}
                    onClick={() => togglePin(w)}
                    title={pinned ? "Unpin wallet" : "Pin wallet (always copy)"}
                  >
                    📌
                  </button>
                  <button
                    className={"btn-copy" + (w.approved ? " copying" : "")}
                    onClick={() => toggle(w)}
                  >
                    {w.approved ? "Copying" : "Copy"}
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
