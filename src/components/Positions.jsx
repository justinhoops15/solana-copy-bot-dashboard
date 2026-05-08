import { useState, useEffect } from "react";
import { getPositions } from "../api/botApi";

export default function Positions() {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const load = () =>
      getPositions().then(setPositions).catch(console.error).finally(() => setLoading(false));
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  if (loading) return <div className="loading">Loading positions...</div>;

  return (
    <div>
      <div className="section-head">
        <span className="section-title">Positions</span>
        <span className="section-count">{positions.length} open</span>
      </div>

      {positions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-title">No open positions</div>
          <div className="empty-state-sub">Approve wallets on the Wallets tab to start copy-trading</div>
        </div>
      ) : (
        <>
          <div className="pos-col-head">
            <span>Token</span>
            <span>Entry Price</span>
            <span>Current Price</span>
            <span>PnL</span>
            <span>Opened</span>
          </div>
          <div className="position-list">
            {positions.map((p) => {
              const pnl   = parseFloat(p.pnl_percent) || 0;
              const isPos = pnl >= 0;
              const openDate = new Date(p.opened_at * 1000);
              const timeStr  = openDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
              const dateStr  = openDate.toLocaleDateString([], { month: "short", day: "numeric" });
              return (
                <div key={p.id} className="position-row">

                  {/* Token info — always first */}
                  <div className="pos-token-info">
                    <div className="pos-token-name">
                      {p.token_symbol || p.token_address.slice(0, 8) + "..."}
                    </div>
                    <div className="pos-token-from">
                      {p.wallet_address.slice(0, 6)}...{p.wallet_address.slice(-4)}
                    </div>
                    {p.paper_trade === 1 && <div className="pos-badge-paper">Paper</div>}
                  </div>

                  {/* pos-cell-grid: display:contents on desktop (grid sees children directly);
                      becomes a 2×2 grid on mobile */}
                  <div className="pos-cell-grid">
                    <div className="pos-cell">
                      <div className="pos-cell-val muted">
                        {p.buy_price_usd > 0 ? "$" + p.buy_price_usd.toFixed(6) : "--"}
                      </div>
                      <div className="pos-cell-lbl">Entry</div>
                    </div>

                    <div className="pos-cell">
                      <div className="pos-cell-val muted">
                        {p.current_price > 0 ? "$" + p.current_price.toFixed(6) : "--"}
                      </div>
                      <div className="pos-cell-lbl">Current</div>
                    </div>

                    <div className="pos-cell">
                      <div className={"pos-cell-val " + (isPos ? "pos" : "neg")}>
                        {isPos ? "+" : ""}{pnl.toFixed(2)}%
                      </div>
                      <div className="pos-cell-lbl">PnL</div>
                    </div>

                    <div className="pos-cell">
                      <div className="pos-cell-val muted" style={{ fontSize: "12px", fontWeight: 500 }}>
                        {timeStr}
                      </div>
                      <div className="pos-cell-lbl">{dateStr}</div>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
