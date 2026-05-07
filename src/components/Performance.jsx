import { useState, useEffect } from "react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { getPerformance } from "../api/botApi";

const PERIODS = [
  { key: "today",  label: "Day"      },
  { key: "7d",     label: "Week"     },
  { key: "30d",    label: "Month"    },
  { key: "365d",   label: "Year"     },
  { key: "all",    label: "All Time" },
];

const EMPTY_STATS = {
  total: 0, wins: 0, losses: 0, winRate: 0, netPnl: 0,
  avgGain: 0, avgLoss: 0, bestTrade: null, worstTrade: null,
  winStreak: 0, maxStreak: 0, bestWallet: null,
};

function fmt(n) {
  if (n === 0) return "$0.00";
  const abs = Math.abs(n);
  const str = abs >= 1000 ? (abs / 1000).toFixed(1) + "k" : abs.toFixed(2);
  return (n >= 0 ? "+" : "-") + "$" + str;
}
function fmtPct(n) {
  if (n === 0) return "0.0%";
  return (n >= 0 ? "+" : "") + n.toFixed(1) + "%";
}

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
  const color = rate >= 60 ? "#4caf84" : rate >= 40 ? "#f5a623" : rate > 0 ? "#e05c5c" : "#333333";
  return (
    <div className="perf-win-ring-wrap">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        <circle
          cx="50" cy="50" r={r} fill="none"
          stroke={color}
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

// ── Tooltips ───────────────────────────────────────────────────────────────
function LineTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-date">{d.date}</div>
      <div className="chart-tooltip-row">
        <span className="muted">Cumulative</span>
        <span style={{ color: d.cumPnl >= 0 ? "#4caf84" : "#e05c5c" }}>{fmt(d.cumPnl)}</span>
      </div>
      {d.symbol && (
        <div className="chart-tooltip-row">
          <span className="muted">Token</span><span>{d.symbol}</span>
        </div>
      )}
    </div>
  );
}

function BarTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-date">{d.symbol || d.date}</div>
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
  const [period, setPeriod]   = useState("30d");
  const [data, setData]       = useState(null);
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

  const stats  = data?.stats  || EMPTY_STATS;
  const series = data?.series || [];
  const trades = data?.trades || [];

  // Always show at least a zero baseline in charts
  const lineData = series.length > 0 ? series : [{ date: "—", cumPnl: 0, pnl: 0 }];
  const barData  = series.length > 0 ? series.slice(-60) : [{ date: "—", pnl: 0, symbol: "—" }];

  return (
    <div>
      <div className="section-head" style={{ justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <span className="section-title">Performance</span>
          <span className="section-count">{stats.total} closed trades</span>
        </div>
        <div className="perf-period-filter">
          {PERIODS.map(({ key, label }) => (
            <button
              key={key}
              className={"perf-period-btn" + (period === key ? " active" : "")}
              onClick={() => setPeriod(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats grid — always shown */}
      <div className="perf-stats-grid">
        <div className="perf-stat-card perf-stat-card--ring">
          <WinRing rate={stats.winRate} />
          <div style={{ marginTop: 8 }}>
            <div className="perf-stat-sub">{stats.wins}W / {stats.losses}L</div>
          </div>
        </div>
        <StatCard
          label="Net PnL"
          value={stats.total > 0 ? fmt(stats.netPnl) : "$0.00"}
          sub={`${stats.total} trades`}
          color={stats.netPnl > 0 ? "#4caf84" : stats.netPnl < 0 ? "#e05c5c" : "#ffffff"}
        />
        <StatCard
          label="Avg Gain"
          value={stats.avgGain !== 0 ? fmtPct(stats.avgGain) : "+0.0%"}
          sub="per winning trade"
          color={stats.avgGain > 0 ? "#4caf84" : "#888888"}
        />
        <StatCard
          label="Avg Loss"
          value={stats.avgLoss !== 0 ? fmtPct(stats.avgLoss) : "0.0%"}
          sub="per losing trade"
          color={stats.avgLoss < 0 ? "#e05c5c" : "#888888"}
        />
        <StatCard
          label="Best Trade"
          value={stats.bestTrade ? fmt(stats.bestTrade.pnl) : "—"}
          sub={stats.bestTrade ? stats.bestTrade.symbol + " (" + fmtPct(stats.bestTrade.pct) + ")" : "No trades yet"}
          color={stats.bestTrade ? "#4caf84" : "#444444"}
        />
        <StatCard
          label="Worst Trade"
          value={stats.worstTrade ? fmt(stats.worstTrade.pnl) : "—"}
          sub={stats.worstTrade ? stats.worstTrade.symbol + " (" + fmtPct(stats.worstTrade.pct) + ")" : "No trades yet"}
          color={stats.worstTrade ? "#e05c5c" : "#444444"}
        />
        <StatCard
          label="Win Streak"
          value={stats.winStreak}
          sub={`Best: ${stats.maxStreak}`}
          color={stats.winStreak > 0 ? "#f5a623" : "#ffffff"}
        />
        <StatCard
          label="Best Wallet"
          value={stats.bestWallet ? fmt(stats.bestWallet.pnl) : "—"}
          sub={stats.bestWallet ? stats.bestWallet.address.slice(0, 6) + "…" + stats.bestWallet.address.slice(-4) : "No trades yet"}
          color={stats.bestWallet ? "#22d3ee" : "#444444"}
        />
      </div>

      {/* Cumulative PnL chart — always shown */}
      <div className="perf-chart-card">
        <div className="perf-chart-title">Cumulative PnL</div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={lineData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "#444444", fontSize: 10 }}
              tickLine={false} axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: "#444444", fontSize: 10 }}
              tickLine={false} axisLine={false}
              tickFormatter={(v) => "$" + v.toFixed(2)}
              width={60}
            />
            <Tooltip content={<LineTooltip />} />
            <Line
              type="monotone" dataKey="cumPnl"
              stroke="#22d3ee" strokeWidth={2}
              dot={false} activeDot={{ r: 4, fill: "#22d3ee" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Per-trade bar chart — always shown */}
      <div className="perf-chart-card">
        <div className="perf-chart-title">
          Trade PnL{series.length > 60 ? " (last 60)" : ""}
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={barData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="date" tick={false} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: "#444444", fontSize: 10 }}
              tickLine={false} axisLine={false}
              tickFormatter={(v) => "$" + v.toFixed(2)}
              width={60}
            />
            <Tooltip content={<BarTooltip />} />
            <Bar dataKey="pnl" radius={[2, 2, 0, 0]}>
              {barData.map((entry, i) => (
                <Cell key={i}
                  fill={entry.pnl > 0 ? "#4caf84" : entry.pnl < 0 ? "#e05c5c" : "#333333"}
                  fillOpacity={0.8}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Trade table — always shown */}
      <div className="perf-chart-card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="perf-trade-head">
          <span>Token</span><span>PnL</span><span>%</span>
          <span>Wallet</span><span>Duration</span><span>Date</span>
        </div>
        {trades.length === 0 ? (
          <div style={{ padding: "32px 20px", textAlign: "center", color: "#333333", fontSize: 12 }}>
            No closed trades yet — positions close when take-profit or stop-loss is hit
          </div>
        ) : (
          <>
            {(showAll ? trades : trades.slice(0, 20)).map((t) => (
              <TradeRow key={t.id} t={t} />
            ))}
            {trades.length > 20 && (
              <button className="perf-show-more" onClick={() => setShowAll((v) => !v)}>
                {showAll ? "Show less" : `Show all ${trades.length} trades`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
