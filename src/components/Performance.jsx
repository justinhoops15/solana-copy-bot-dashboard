import { useState, useEffect } from "react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { getPerformance } from "../api/botApi";

const PERIODS = ["7d", "30d", "all"];
const PERIOD_LABELS = { "7d": "7 Days", "30d": "30 Days", "all": "All Time" };

function fmt(n) {
  if (Math.abs(n) >= 1000) return "$" + (n / 1000).toFixed(1) + "k";
  return (n >= 0 ? "+" : "") + "$" + Math.abs(n).toFixed(2);
}
function fmtPct(n) { return (n >= 0 ? "+" : "") + n.toFixed(1) + "%"; }

// ── Stat card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color }) {
  return (
    <div className="perf-stat-card">
      <div className="perf-stat-label">{label}</div>
      <div className="perf-stat-value" style={{ color: color || "#ffffff" }}>{value}</div>
      {sub && <div className="perf-stat-sub">{sub}</div>}
    </div>
  );
}

// ── Win rate ring ──────────────────────────────────────────────────────────
function WinRing({ rate }) {
  const r = 36, circ = 2 * Math.PI * r;
  const fill = circ * (rate / 100);
  return (
    <div className="perf-win-ring-wrap">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        <circle
          cx="50" cy="50" r={r} fill="none"
          stroke={rate >= 60 ? "#4caf84" : rate >= 40 ? "#f5a623" : "#e05c5c"}
          strokeWidth="10"
          strokeDasharray={`${fill} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
        <text x="50" y="46" textAnchor="middle" fill="#ffffff" fontSize="16" fontWeight="700"
          fontFamily="'Courier New', monospace">{rate.toFixed(0)}%</text>
        <text x="50" y="62" textAnchor="middle" fill="#555555" fontSize="9" fontWeight="600"
          letterSpacing="0.07em">WIN RATE</text>
      </svg>
    </div>
  );
}

// ── Custom tooltip ─────────────────────────────────────────────────────────
function LineTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-date">{d.date}</div>
      <div className="chart-tooltip-row">
        <span className="muted">Cumulative</span>
        <span style={{ color: d.cumPnl >= 0 ? "#4caf84" : "#e05c5c" }}>{fmt(d.cumPnl)}</span>
      </div>
      <div className="chart-tooltip-row">
        <span className="muted">This trade</span>
        <span style={{ color: d.pnl >= 0 ? "#4caf84" : "#e05c5c" }}>{fmt(d.pnl)} ({fmtPct(d.pnlPct)})</span>
      </div>
      <div className="chart-tooltip-row"><span className="muted">Token</span><span>{d.symbol}</span></div>
    </div>
  );
}

function BarTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-date">{d.symbol}</div>
      <div className="chart-tooltip-row">
        <span className="muted">PnL</span>
        <span style={{ color: d.pnl >= 0 ? "#4caf84" : "#e05c5c" }}>{fmt(d.pnl)}</span>
      </div>
    </div>
  );
}

// ── Trade table row ────────────────────────────────────────────────────────
function TradeRow({ t }) {
  const win = t.pnl >= 0;
  const dur = t.closedAt && t.openedAt
    ? Math.round((t.closedAt - t.openedAt) / 60000) + "m"
    : "—";
  return (
    <div className="perf-trade-row">
      <span className="perf-trade-symbol">{t.symbol}</span>
      <span style={{ color: win ? "#4caf84" : "#e05c5c", fontWeight: 700, fontVariantNumeric: "tabular-nums", fontSize: 13 }}>
        {fmt(t.pnl)}
      </span>
      <span style={{ color: win ? "#4caf84" : "#e05c5c", fontSize: 12, fontVariantNumeric: "tabular-nums" }}>
        {fmtPct(t.pct)}
      </span>
      <span className="perf-trade-wallet">{t.wallet.slice(0, 6)}…{t.wallet.slice(-4)}</span>
      <span className="perf-trade-dur">{dur}</span>
      <span className="perf-trade-time">{new Date(t.closedAt).toLocaleDateString()}</span>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function Performance() {
  const [period, setPeriod] = useState("30d");
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    setLoading(true);
    getPerformance(period)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) return <div className="loading">Loading performance data...</div>;

  const { stats, series, trades } = data || {};
  const isEmpty = !stats || stats.total === 0;

  const barData = isEmpty ? [] : series.slice(-60);

  return (
    <div>
      <div className="section-head" style={{ justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <span className="section-title">Performance</span>
          {!isEmpty && <span className="section-count">{stats.total} closed trades</span>}
        </div>
        <div className="perf-period-filter">
          {PERIODS.map((p) => (
            <button
              key={p}
              className={"perf-period-btn" + (period === p ? " active" : "")}
              onClick={() => setPeriod(p)}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {isEmpty ? (
        <div className="empty-state">
          <div className="empty-state-title">No closed trades yet</div>
          <div className="empty-state-sub">Performance data appears once positions are closed via take-profit or stop-loss</div>
        </div>
      ) : (
        <>
          {/* Stats grid */}
          <div className="perf-stats-grid">
            <div className="perf-stat-card perf-stat-card--ring">
              <WinRing rate={stats.winRate} />
              <div style={{ marginTop: 8 }}>
                <div className="perf-stat-sub">{stats.wins}W / {stats.losses}L</div>
              </div>
            </div>
            <StatCard
              label="Net PnL"
              value={fmt(stats.netPnl)}
              sub={`${stats.total} trades`}
              color={stats.netPnl >= 0 ? "#4caf84" : "#e05c5c"}
            />
            <StatCard
              label="Avg Gain"
              value={fmtPct(stats.avgGain)}
              sub="per winning trade"
              color="#4caf84"
            />
            <StatCard
              label="Avg Loss"
              value={fmtPct(stats.avgLoss)}
              sub="per losing trade"
              color="#e05c5c"
            />
            <StatCard
              label="Best Trade"
              value={stats.bestTrade ? fmt(stats.bestTrade.pnl) : "—"}
              sub={stats.bestTrade ? stats.bestTrade.symbol + " (" + fmtPct(stats.bestTrade.pct) + ")" : "—"}
              color="#4caf84"
            />
            <StatCard
              label="Worst Trade"
              value={stats.worstTrade ? fmt(stats.worstTrade.pnl) : "—"}
              sub={stats.worstTrade ? stats.worstTrade.symbol + " (" + fmtPct(stats.worstTrade.pct) + ")" : "—"}
              color="#e05c5c"
            />
            <StatCard
              label="Win Streak"
              value={stats.winStreak}
              sub={`Best: ${stats.maxStreak}`}
              color="#f5a623"
            />
            <StatCard
              label="Best Wallet"
              value={stats.bestWallet ? fmt(stats.bestWallet.pnl) : "—"}
              sub={stats.bestWallet ? stats.bestWallet.address.slice(0, 6) + "…" + stats.bestWallet.address.slice(-4) : "—"}
              color="#22d3ee"
            />
          </div>

          {/* Cumulative PnL chart */}
          {series.length > 1 && (
            <div className="perf-chart-card">
              <div className="perf-chart-title">Cumulative PnL</div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#444444", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fill: "#444444", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => "$" + v.toFixed(2)}
                    width={60}
                  />
                  <Tooltip content={<LineTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="cumPnl"
                    stroke="#22d3ee"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: "#22d3ee" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Per-trade bar chart */}
          {barData.length > 1 && (
            <div className="perf-chart-card">
              <div className="perf-chart-title">Trade PnL{series.length > 60 ? " (last 60)" : ""}</div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={barData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="date" tick={false} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fill: "#444444", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => "$" + v.toFixed(2)}
                    width={60}
                  />
                  <Tooltip content={<BarTooltip />} />
                  <Bar dataKey="pnl" radius={[2, 2, 0, 0]}>
                    {barData.map((entry, i) => (
                      <Cell key={i} fill={entry.pnl >= 0 ? "#4caf84" : "#e05c5c"} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Trade table */}
          <div className="perf-chart-card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="perf-trade-head">
              <span>Token</span>
              <span>PnL</span>
              <span>%</span>
              <span>Wallet</span>
              <span>Duration</span>
              <span>Date</span>
            </div>
            {(showAll ? trades : trades.slice(0, 20)).map((t) => (
              <TradeRow key={t.id} t={t} />
            ))}
            {trades.length > 20 && (
              <button className="perf-show-more" onClick={() => setShowAll((v) => !v)}>
                {showAll ? "Show less" : `Show all ${trades.length} trades`}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
