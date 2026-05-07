import { useState, useEffect } from "react";
import Leaderboard  from "./components/Leaderboard";
import Positions    from "./components/Positions";
import TradeHistory from "./components/TradeHistory";
import Settings     from "./components/Settings";
import Performance  from "./components/Performance";
import Calendar     from "./components/Calendar";
import { getStatus, getPerformance } from "./api/botApi";

const TABS = [
  { id: "leaderboard",  label: "Wallets"       },
  { id: "positions",    label: "Positions"     },
  { id: "performance",  label: "Performance"   },
  { id: "calendar",     label: "PnL Calendar"  },
  { id: "history",      label: "Trade History" },
  { id: "settings",     label: "Settings"      },
];

// Tabs that show the global stats bar
const STATS_TABS = new Set(["positions", "performance", "history"]);

// ── Global Stats Bar ───────────────────────────────────────────────────────
function GlobalStatsBar({ tab, botStatus }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!STATS_TABS.has(tab)) return;
    const load = () =>
      getPerformance("today")
        .then((d) => setStats(d.stats))
        .catch(() => {});
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [tab]);

  if (!STATS_TABS.has(tab)) return null;

  const s = stats || { netPnl: 0, total: 0, winRate: 0 };
  const pnlPos = (s.netPnl || 0) >= 0;
  const online  = botStatus?.ok ?? false;

  return (
    <div className="stats-bar">
      <div className="container">
        <div className="stats-bar-inner">
          <div className="stats-bar-item">
            <span className="stats-bar-val" style={{ color: pnlPos ? "#4caf84" : "#e05c5c" }}>
              {pnlPos ? "+" : ""}${(s.netPnl || 0).toFixed(2)}
            </span>
            <span className="stats-bar-lbl">Today's PnL</span>
          </div>
          <div className="stats-bar-sep" />
          <div className="stats-bar-item">
            <span className="stats-bar-val">{s.total || 0}</span>
            <span className="stats-bar-lbl">Trades Today</span>
          </div>
          <div className="stats-bar-sep" />
          <div className="stats-bar-item">
            <span className="stats-bar-val"
              style={{ color: (s.winRate || 0) >= 50 ? "#4caf84" : (s.winRate || 0) > 0 ? "#f5a623" : "#ffffff" }}>
              {(s.winRate || 0).toFixed(0)}%
            </span>
            <span className="stats-bar-lbl">Win Rate Today</span>
          </div>
          <div className="stats-bar-sep" />
          <div className="stats-bar-item">
            <div className="stats-bar-status">
              <div className={"status-dot" + (online ? " online" : " offline")} />
              <span className="stats-bar-val" style={{ fontSize: 13 }}>
                {online ? "Online" : "Offline"}
              </span>
            </div>
            <span className="stats-bar-lbl">Bot Status</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── PWA install banner ─────────────────────────────────────────────────────
let _deferredPrompt = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  _deferredPrompt = e;
});

function InstallBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const check = () => setShow(!!_deferredPrompt);
    check();
    const id = setInterval(check, 2000);
    return () => clearInterval(id);
  }, []);

  if (!show) return null;

  const install = async () => {
    if (!_deferredPrompt) return;
    _deferredPrompt.prompt();
    const { outcome } = await _deferredPrompt.userChoice;
    if (outcome === "accepted") { _deferredPrompt = null; setShow(false); }
  };

  return (
    <div className="install-banner">
      <span className="install-banner-text">Install CopyTradeAI as an app for quick access</span>
      <button className="install-banner-btn" onClick={install}>Install</button>
      <button className="install-banner-close" onClick={() => { _deferredPrompt = null; setShow(false); }}>✕</button>
    </div>
  );
}

// ── Service worker registration ────────────────────────────────────────────
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

export default function App() {
  const [tab, setTab]       = useState("leaderboard");
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const load = () => getStatus().then(setStatus).catch(() => setStatus(null));
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <div className="bg-orbs" />
      <InstallBanner />
      <div className="app-wrapper">

        <header className="header">
          <div className="container">
            <div className="header-inner">
              <div className="header-logo">
                <div className="logo-mark">
                  <div className="logo-mark-inner" />
                </div>
                <span className="logo-name">CopyTradeAI</span>
              </div>
              <div className="header-right">
                {status ? (
                  <>
                    <span className={status.paperMode ? "badge-paper" : "badge-live"}>
                      {status.paperMode ? "Paper Trading" : "Live"}
                    </span>
                    <span className="header-uptime">up {Math.floor(status.uptime / 60)}m</span>
                  </>
                ) : (
                  <span className="header-offline">Bot offline</span>
                )}
              </div>
            </div>
          </div>
        </header>

        <nav className="nav">
          <div className="container">
            <div className="nav-inner">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  className={"nav-tab" + (tab === t.id ? " active" : "")}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </nav>

        <GlobalStatsBar tab={tab} botStatus={status} />

        <main className="main">
          <div className="container">
            {tab === "leaderboard"  && <Leaderboard />}
            {tab === "positions"    && <Positions />}
            {tab === "performance"  && <Performance />}
            {tab === "calendar"     && <Calendar />}
            {tab === "history"      && <TradeHistory />}
            {tab === "settings"     && <Settings />}
          </div>
        </main>

      </div>
    </>
  );
}
