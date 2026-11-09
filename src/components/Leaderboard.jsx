import { useState, useEffect } from "react";
import { getWallets, getWalletEvents } from "../api/botApi";
import Attribution from "./Attribution";
import { pct, signedPct, returnClass } from "./walletFormat";

const STATUS_LABEL = { active: "Active", probation: "Probation", demoted: "Demoted" };
const FILTERS = [
  ["all", "All"],
  ["active", "Active"],
  ["probation", "Probation"],
  ["demoted", "Demoted"],
];

function lastTradeText(days) {
  if (days === null || days === undefined) return "--";
  if (days === 0) return "today";
  return days + "d ago";
}

function lastTradeClass(days) {
  if (days === null || days === undefined) return "wl-muted";
  if (days > 14) return "wl-neg";
  if (days > 7) return "wl-warn";
  return "";
}

function eventText(e) {
  if (e.event === "promoted") return "Promoted to Active";
  if (e.event === "demoted") return "Demoted";
  if (e.event === "discovered") return "Entered Probation";
  if (e.event === "purged") return "Purged";
  if (e.event === "migrated") return "Legacy cleanup";
  return e.event;
}

function WalletRow({ w }) {
  const short = w.address.length > 12 ? w.address.slice(0, 6) + "..." + w.address.slice(-4) : w.address;
  return (
    <div className={"wl-row wl-row--" + w.status}>
      <div className="wl-cell wl-cell--status">
        <span className={"wl-status wl-status--" + w.status}>{STATUS_LABEL[w.status] || w.status}</span>
      </div>

      <div className="wl-cell wl-cell--wallet">
        <a href={"https://solscan.io/account/" + w.address} target="_blank" rel="noopener noreferrer" className="wallet-addr">
          {short}
        </a>
        <span className="wl-sub">
          {w.source ? w.source.replace(/,/g, " + ") : "legacy"} · score {w.score !== null && w.score !== undefined ? w.score.toFixed(1) : "--"}
        </span>
      </div>

      <div className="wl-cell">
        <span className={"wl-val " + lastTradeClass(w.daysSinceLastTrade)}>{lastTradeText(w.daysSinceLastTrade)}</span>
        <span className="wl-lbl">Last trade</span>
      </div>

      <div className="wl-cell">
        <span className="wl-val">{pct(w.winRate30d)}</span>
        <span className="wl-lbl">30d win rate</span>
      </div>

      <div className="wl-cell">
        <span className={"wl-val " + returnClass(w.shadow.netReturn)}>{signedPct(w.shadow.netReturn)}</span>
        <span className="wl-lbl">Shadow net ({w.shadow.n})</span>
      </div>

      <div className="wl-cell">
        <span className={"wl-val " + returnClass(w.copied.netReturn)}>{signedPct(w.copied.netReturn)}</span>
        <span className="wl-lbl">Copied net ({w.copied.n})</span>
      </div>

      {w.status === "demoted" && w.demotionReason && (
        <div className="wl-reason">Demoted: {w.demotionReason}</div>
      )}
    </div>
  );
}

export default function Leaderboard() {
  const [view, setView]       = useState("wallets");
  const [filter, setFilter]   = useState("all");
  const [wallets, setWallets] = useState([]);
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = () => {
      getWallets(100).then(setWallets).catch(console.error).finally(() => setLoading(false));
      getWalletEvents(12).then(setEvents).catch(() => {});
    };
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, []);

  if (loading) return <div className="loading">Loading wallets...</div>;

  const counts = { active: 0, probation: 0, demoted: 0 };
  wallets.forEach((w) => { if (counts[w.status] !== undefined) counts[w.status]++; });
  const shown = filter === "all" ? wallets : wallets.filter((w) => w.status === filter);

  return (
    <div>
      <div className="section-head wl-section-head">
        <div className="wl-title-group">
          <span className="section-title">Wallets</span>
          <span className="section-count">
            {counts.active} active · {counts.probation} probation · {counts.demoted} demoted
          </span>
        </div>
        <div className="wl-switch">
          <button className={"wl-switch-btn" + (view === "wallets" ? " active" : "")} onClick={() => setView("wallets")}>Wallets</button>
          <button className={"wl-switch-btn" + (view === "attribution" ? " active" : "")} onClick={() => setView("attribution")}>Attribution</button>
        </div>
      </div>

      {view === "attribution" ? (
        <Attribution />
      ) : (
        <>
          <div className="wl-filters">
            {FILTERS.map(([key, label]) => (
              <button key={key} className={"wl-switch-btn" + (filter === key ? " active" : "")} onClick={() => setFilter(key)}>
                {label}{key !== "all" ? " " + counts[key] : ""}
              </button>
            ))}
          </div>

          {shown.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">No wallets in this view</div>
              <div className="empty-state-sub">The nightly discovery run adds new candidates to Probation</div>
            </div>
          ) : (
            <>
              <div className="wl-head">
                <span>Status</span>
                <span>Wallet</span>
                <span>Last trade</span>
                <span>30d win rate</span>
                <span>Shadow net</span>
                <span>Copied net</span>
              </div>
              <div className="wl-list">
                {shown.map((w) => <WalletRow key={w.address} w={w} />)}
              </div>
            </>
          )}

          {events.length > 0 && (
            <div className="wl-events">
              <div className="wl-events-title">Recent changes</div>
              {events.map((e, i) => (
                <div key={i} className="wl-event">
                  <span className="wl-event-time">{new Date(e.ts * 1000).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                  <span className="wl-event-what">
                    {e.address.length > 12 ? e.address.slice(0, 6) + "..." + e.address.slice(-4) : e.address} · {eventText(e)}
                  </span>
                  <span className="wl-event-why">{e.reason}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
