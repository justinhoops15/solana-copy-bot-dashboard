import { useState, useEffect } from "react";
import { getTrades } from "../api/botApi";

function fmt(ts) {
  const d = new Date(ts * 1000);
  return d.toLocaleDateString([], { month: "short", day: "numeric" })
    + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function TradeHistory() {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTrades(100).then(setTrades).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading trade history...</div>;

  return (
    <div>
      <div className="section-head">
        <span className="section-title">Trade History</span>
        <span className="section-count">{trades.length} trades</span>
      </div>

      {trades.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-title">No trades recorded yet</div>
          <div className="empty-state-sub">Trades will appear here as the bot copies wallets</div>
        </div>
      ) : (
        <div className="trade-table">
          <div className="trade-table-head">
            <span>Time</span>
            <span>Side</span>
            <span>Token</span>
            <span>Copied From</span>
            <span>Price</span>
            <span>SOL</span>
            <span>Mode</span>
          </div>

          {trades.map((t) => (
            <div key={t.id} className="trade-row">
              {/* trade-row-top / trade-row-main / trade-row-foot:
                  display:contents on desktop so grid children participate normally;
                  become visible flex rows on mobile */}
              <div className="trade-row-top">
                <span className="trade-time">{fmt(t.executed_at)}</span>
                <span className={t.action === "buy" ? "trade-buy" : "trade-sell"}>
                  {t.action}
                </span>
                <span className={t.paper_trade ? "trade-mode-paper" : "trade-mode-live"}>
                  {t.paper_trade ? "Paper" : "Live"}
                </span>
              </div>
              <div className="trade-row-main">
                <span className="trade-token">
                  {t.token_symbol || t.token_address.slice(0, 8) + "..."}
                </span>
                <span className="trade-wallet">
                  {t.wallet_address.slice(0, 6)}...{t.wallet_address.slice(-4)}
                </span>
              </div>
              <div className="trade-row-foot">
                <span className="trade-price">
                  {t.price_usd > 0 ? "$" + t.price_usd.toFixed(6) : "--"}
                </span>
                <span className="trade-sol">
                  {t.sol_amount != null ? t.sol_amount.toFixed(4) + " SOL" : "--"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
