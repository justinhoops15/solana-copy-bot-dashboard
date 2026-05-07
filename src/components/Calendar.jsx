import { useState, useEffect } from "react";
import { getCalendar } from "../api/botApi";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function fmt(n) {
  if (n === 0) return "$0";
  const abs = Math.abs(n);
  const str = abs >= 1000 ? (abs / 1000).toFixed(1) + "k" : abs.toFixed(2);
  return (n > 0 ? "+" : "-") + "$" + str;
}

function monthLabel(month) {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function prevMonth(month) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function nextMonth(month) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function pnlColor(pnl) {
  if (pnl > 0) return "#4caf84";
  if (pnl < 0) return "#e05c5c";
  return "#444444";
}

function pnlBg(pnl, max) {
  if (!pnl || !max) return "transparent";
  const intensity = Math.min(Math.abs(pnl) / max, 1);
  if (pnl > 0) return `rgba(76,175,132,${0.06 + intensity * 0.18})`;
  return `rgba(224,92,92,${0.06 + intensity * 0.18})`;
}

// ── Day cell ───────────────────────────────────────────────────────────────
function DayCell({ day, dayData, maxAbsPnl, selected, onClick }) {
  const empty = !dayData;
  return (
    <div
      className={"cal-day" + (empty ? " cal-day--empty" : "") + (selected ? " cal-day--selected" : "")}
      style={{ background: pnlBg(dayData?.pnl, maxAbsPnl) }}
      onClick={empty ? undefined : onClick}
    >
      <span className="cal-day-num">{day}</span>
      {dayData && (
        <>
          <span className="cal-day-pnl" style={{ color: pnlColor(dayData.pnl) }}>
            {fmt(dayData.pnl)}
          </span>
          <span className="cal-day-trades">{dayData.trades}t · {dayData.winRate}%</span>
        </>
      )}
    </div>
  );
}

// ── Slide-up day panel ─────────────────────────────────────────────────────
function DayPanel({ day, month, dayData, onClose }) {
  if (!dayData) return null;
  const label = new Date(month.replace("-", "/") + "/" + String(day).padStart(2, "0"))
    .toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  return (
    <div className="cal-panel">
      <div className="cal-panel-header">
        <span className="cal-panel-date">{label}</span>
        <button className="cal-panel-close" onClick={onClose}>✕</button>
      </div>
      <div className="cal-panel-stats">
        <div className="cal-panel-stat">
          <span className="cal-panel-stat-val" style={{ color: pnlColor(dayData.pnl) }}>{fmt(dayData.pnl)}</span>
          <span className="cal-panel-stat-lbl">Net PnL</span>
        </div>
        <div className="cal-panel-stat">
          <span className="cal-panel-stat-val">{dayData.trades}</span>
          <span className="cal-panel-stat-lbl">Trades</span>
        </div>
        <div className="cal-panel-stat">
          <span className="cal-panel-stat-val" style={{ color: dayData.winRate >= 50 ? "#4caf84" : "#e05c5c" }}>
            {dayData.winRate}%
          </span>
          <span className="cal-panel-stat-lbl">Win Rate</span>
        </div>
      </div>
      <div className="cal-panel-trades">
        {(dayData.tradesList || []).map((t, i) => (
          <div key={i} className="cal-panel-trade-row">
            <span className="cal-panel-trade-sym">{t.symbol}</span>
            <span style={{ color: pnlColor(t.pnl), fontVariantNumeric: "tabular-nums", fontSize: 13, fontWeight: 600 }}>
              {fmt(t.pnl)}
            </span>
            <span style={{ color: pnlColor(t.pnl), fontSize: 11, fontVariantNumeric: "tabular-nums" }}>
              {t.pct >= 0 ? "+" : ""}{t.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function Calendar() {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [month, setMonth]     = useState(currentMonth);
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setLoading(true);
    setSelected(null);
    getCalendar(month)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [month]);

  const isCurrentMonth = month === currentMonth;

  if (loading) return <div className="loading">Loading calendar...</div>;

  const { days = {}, daysInMonth = 31, firstDayOfWeek = 0, summary = {} } = data || {};

  // Build grid cells: leading blanks + days
  const cells = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const maxAbsPnl = Math.max(...Object.values(days).map((d) => Math.abs(d.pnl || 0)), 1);

  return (
    <div>
      <div className="section-head" style={{ justifyContent: "space-between" }}>
        <span className="section-title">PnL Calendar</span>
        <div className="cal-nav">
          <button className="cal-nav-btn" onClick={() => setMonth(prevMonth(month))}>←</button>
          <span className="cal-nav-label">{monthLabel(month)}</span>
          <button className="cal-nav-btn" onClick={() => setMonth(nextMonth(month))} disabled={isCurrentMonth}>→</button>
        </div>
      </div>

      {/* Monthly summary */}
      <div className="cal-summary">
        <div className="cal-summary-stat">
          <span className="cal-summary-val" style={{ color: pnlColor(summary.totalPnl || 0) }}>
            {fmt(summary.totalPnl || 0)}
          </span>
          <span className="cal-summary-lbl">Month PnL</span>
        </div>
        <div className="cal-summary-stat">
          <span className="cal-summary-val">{summary.totalTrades || 0}</span>
          <span className="cal-summary-lbl">Trades</span>
        </div>
        <div className="cal-summary-stat">
          <span className="cal-summary-val" style={{ color: (summary.winRate || 0) >= 50 ? "#4caf84" : "#e05c5c" }}>
            {summary.winRate || 0}%
          </span>
          <span className="cal-summary-lbl">Win Rate</span>
        </div>
        <div className="cal-summary-stat">
          <span className="cal-summary-val">{summary.totalWins || 0}W / {(summary.totalTrades || 0) - (summary.totalWins || 0)}L</span>
          <span className="cal-summary-lbl">Record</span>
        </div>
      </div>

      {/* Day-of-week headers */}
      <div className="cal-dow-row">
        {DAYS_OF_WEEK.map((d) => (
          <div key={d} className="cal-dow">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="cal-grid">
        {cells.map((day, i) =>
          day === null ? (
            <div key={"blank-" + i} className="cal-day cal-day--blank" />
          ) : (
            <DayCell
              key={day}
              day={day}
              dayData={days[day]}
              maxAbsPnl={maxAbsPnl}
              selected={selected === day}
              onClick={() => setSelected(selected === day ? null : day)}
            />
          )
        )}
      </div>

      {/* Slide-up day panel */}
      {selected && days[selected] && (
        <DayPanel
          day={selected}
          month={month}
          dayData={days[selected]}
          onClose={() => setSelected(null)}
        />
      )}

      {Object.keys(days).length === 0 && (
        <div className="empty-state" style={{ marginTop: 16 }}>
          <div className="empty-state-title">No trades this month</div>
          <div className="empty-state-sub">Closed positions will appear here with day-level PnL</div>
        </div>
      )}
    </div>
  );
}
