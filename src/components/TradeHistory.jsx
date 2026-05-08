import { useState, useEffect } from "react";
import { getTrades } from "../api/botApi";

function fmtDate(ts) {
  const d = new Date(ts * 1000);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    " " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function fmtPrice(p) {
  if (!p || p <= 0) return "--";
  if (p >= 1)      return "$" + p.toFixed(4);
  if (p >= 0.0001) return "$" + p.toFixed(6);
  return "$" + p.toFixed(8);
}

function groupTrades(trades) {
  const map = new Map();

  // Sort all trades oldest-first so legs within a group are in chronological order
  const sorted = [...trades].sort((a, b) => a.executed_at - b.executed_at);

  for (const t of sorted) {
    const key = `${t.wallet_address}:${t.token_address}`;
    if (!map.has(key)) {
      map.set(key, {
        key,
        token_address:  t.token_address,
        wallet_address: t.wallet_address,
        token_symbol:   t.token_symbol,
        paper_trade:    t.paper_trade,
        legs: [],
      });
    }
    const g = map.get(key);
    g.legs.push(t);
    if (t.token_symbol) g.token_symbol = t.token_symbol;
  }

  // Keep only closed groups (at least one sell leg)
  const closed = [...map.values()].filter(
    (g) => g.legs.some((l) => l.action === "sell")
  );

  // Sort groups by most recent sell, newest first
  closed.sort((a, b) => {
    const aMax = Math.max(...a.legs.filter((l) => l.action === "sell").map((l) => l.executed_at));
    const bMax = Math.max(...b.legs.filter((l) => l.action === "sell").map((l) => l.executed_at));
    return bMax - aMax;
  });

  return closed;
}

function calcPnl(group) {
  const buys  = group.legs.filter((l) => l.action === "buy");
  const sells = group.legs.filter((l) => l.action === "sell");
  if (!buys.length || !sells.length) return { pnl_usd: 0, pnl_pct: 0 };

  const buyPrice  = buys[0].price_usd;
  const buyTokens = buys[0].amount_tokens;
  if (!buyPrice || buyPrice <= 0) return { pnl_usd: 0, pnl_pct: 0 };

  let totalPnlUsd = 0;
  for (const s of sells) {
    totalPnlUsd += s.amount_tokens * (s.price_usd - buyPrice);
  }

  const initialValue = buyTokens * buyPrice;
  const pnl_pct = initialValue > 0 ? (totalPnlUsd / initialValue) * 100 : 0;

  return { pnl_usd: totalPnlUsd, pnl_pct };
}

function pnlClass(val) {
  if (val > 0) return "th-pnl-pos";
  if (val < 0) return "th-pnl-neg";
  return "th-pnl-zero";
}

function ChevronIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PositionCard({ group }) {
  const [open, setOpen] = useState(false);

  const buys     = group.legs.filter((l) => l.action === "buy");
  const sells    = group.legs.filter((l) => l.action === "sell");
  const isPartial = sells.length > 1;

  const buyPrice = buys.length > 0 ? buys[0].price_usd : 0;

  const legSummaryParts = [];
  if (buys.length > 0)  legSummaryParts.push(`${buys.length} BUY${buys.length > 1 ? "S" : ""}`);
  if (sells.length > 0) {
    const label = isPartial ? "PARTIAL SELL" : "SELL";
    legSummaryParts.push(`${sells.length} ${label}${sells.length > 1 ? "S" : ""}`);
  }
  const legSummary = legSummaryParts.join(" · ");

  const first = group.legs[0];
  const last  = group.legs[group.legs.length - 1];
  const dateRange = first === last
    ? fmtDate(first.executed_at)
    : fmtDate(first.executed_at) + " → " + fmtDate(last.executed_at);

  const { pnl_usd, pnl_pct } = calcPnl(group);
  const cls = pnlClass(pnl_pct);
  const pnlSign = pnl_pct >= 0 ? "+" : "";
  const usdSign = pnl_usd >= 0 ? "+" : "-";

  const tokenLabel = group.token_symbol || group.token_address.slice(0, 8);

  return (
    <div className="th-card">
      <div
        className={"th-card-header" + (open ? " th-card-header--open" : "")}
        onClick={() => setOpen((o) => !o)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setOpen((o) => !o); }}
        aria-expanded={open}
      >
        <div className="th-header-main">
          <div className="th-card-left">
            <span className="th-token-name">{tokenLabel}</span>
            <span className="th-token-addr">
              {group.token_address.slice(0, 6)}...{group.token_address.slice(-4)}
            </span>
            <span className="th-wallet-addr">
              via {group.wallet_address.slice(0, 6)}...{group.wallet_address.slice(-4)}
            </span>
          </div>
          <div className="th-card-mid">
            <span className="th-leg-summary">{legSummary}</span>
            <span className="th-date-range">{dateRange}</span>
          </div>
        </div>

        <div className="th-header-side">
          <div className="th-pnl-wrap">
            <span className={`th-pnl-pct ${cls}`}>
              {pnlSign}{pnl_pct.toFixed(2)}%
            </span>
            <span className={`th-pnl-usd ${cls}`}>
              {usdSign}${Math.abs(pnl_usd).toFixed(4)}
            </span>
          </div>
          <span className="th-badge-closed">CLOSED</span>
          <div className={"th-chevron" + (open ? " th-chevron--open" : "")}>
            <ChevronIcon />
          </div>
        </div>
      </div>

      <div className={"th-legs" + (open ? " th-legs--open" : "")}>
        {group.legs.map((leg) => {
          const isSell = leg.action === "sell";

          let badgeClass = "th-leg-badge th-leg-badge--buy";
          let badgeText  = "BUY";
          if (isSell) {
            if (isPartial) {
              badgeClass = "th-leg-badge th-leg-badge--partial";
              badgeText  = "PARTIAL SELL";
            } else {
              badgeClass = "th-leg-badge th-leg-badge--sell";
              badgeText  = "SELL";
            }
          }

          const legPnlPct =
            isSell && buyPrice > 0
              ? ((leg.price_usd - buyPrice) / buyPrice) * 100
              : null;

          return (
            <div key={leg.id} className="th-leg">
              <div className="th-leg-left">
                <span className={badgeClass}>{badgeText}</span>
                {leg.paper_trade ? <span className="th-leg-paper">PAPER</span> : null}
                <span className="th-leg-time">{fmtDate(leg.executed_at)}</span>
              </div>
              <div className="th-leg-right">
                <span className="th-leg-price">{fmtPrice(leg.price_usd)}</span>
                {leg.sol_amount != null ? (
                  <span className="th-leg-sol">{leg.sol_amount.toFixed(4)} SOL</span>
                ) : (
                  <span className="th-leg-sol">--</span>
                )}
                {legPnlPct !== null && (
                  <span className={`th-leg-pnl ${pnlClass(legPnlPct)}`}>
                    {legPnlPct >= 0 ? "+" : ""}{legPnlPct.toFixed(2)}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TradeHistory() {
  const [trades,  setTrades]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTrades(500).then(setTrades).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading trade history...</div>;

  const groups = groupTrades(trades);

  return (
    <div>
      <div className="section-head">
        <span className="section-title">Trade History</span>
        <span className="section-count">{groups.length} positions</span>
      </div>

      {groups.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-title">No completed trades yet</div>
          <div className="empty-state-sub">Closed positions will appear here</div>
        </div>
      ) : (
        <div className="th-cards">
          {groups.map((group) => (
            <PositionCard key={group.key} group={group} />
          ))}
        </div>
      )}
    </div>
  );
}
