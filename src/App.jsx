import { useState, useEffect } from "react";
import Leaderboard  from "./components/Leaderboard";
import Positions    from "./components/Positions";
import TradeHistory from "./components/TradeHistory";
import Settings     from "./components/Settings";
import Performance  from "./components/Performance";
import Calendar     from "./components/Calendar";
import { getStatus, getPerformance, getBotStatus } from "./api/botApi"; // getStatus used in App header

const TABS = [
  { id: "leaderboard",  label: "Wallets"       },
  { id: "positions",    label: "Positions"     },
  { id: "performance",  label: "Performance"   },
  { id: "calendar",     label: "PnL Calendar"  },
  { id: "history",      label: "Trade History" },
  { id: "settings",     label: "Settings"      },
];

const STATS_TABS = new Set(["positions", "performance", "history"]);

// ── Global Stats Bar ───────────────────────────────────────────────────────
function formatRelativeTime(iso) {
  if (!iso) return "never";
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffS  = Math.floor(diffMs / 1000);
  if (diffS < 60)  return `${diffS}s ago`;
  const diffM = Math.floor(diffS / 60);
  if (diffM < 60)  return `${diffM}m ago`;
  const diffH = Math.floor(diffM / 60);
  return `${diffH}h ago`;
}

function formatUptime(seconds) {
  if (seconds < 60)   return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  if (m < 60)         return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
}

function BotStatusIndicator({ health }) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const wsState = health?.wsState || "DISCONNECTED";

  let dotClass  = "ws-dot ws-dot--disconnected";
  let labelText = "Disconnected";
  if (wsState === "CONNECTED") {
    dotClass  = "ws-dot ws-dot--connected";
    labelText = "Connected";
  } else if (wsState === "DEGRADED") {
    dotClass  = "ws-dot ws-dot--degraded";
    labelText = "Degraded";
  }

  return (
    <div
      className="stats-bar-item stats-bar-item--status"
      onMouseEnter={() => setTooltipVisible(true)}
      onMouseLeave={() => setTooltipVisible(false)}
    >
      <div className="stats-bar-status">
        <div className={dotClass} />
        <span className="stats-bar-val stats-bar-val--sm">{labelText}</span>
      </div>
      <span className="stats-bar-lbl">Bot Status</span>

      {tooltipVisible && health && (
        <div className="ws-tooltip">
          <div className="ws-tooltip-row">
            <span className="ws-tooltip-key">WS State</span>
            <span className="ws-tooltip-val">{health.wsState}</span>
          </div>
          <div className="ws-tooltip-row">
            <span className="ws-tooltip-key">Wallets</span>
            <span className="ws-tooltip-val">{health.subscribedWallets}</span>
          </div>
          <div className="ws-tooltip-row">
            <span className="ws-tooltip-key">Last Tx</span>
            <span className="ws-tooltip-val">{formatRelativeTime(health.lastTransactionSeen)}</span>
          </div>
          <div className="ws-tooltip-row">
            <span className="ws-tooltip-key">Uptime</span>
            <span className="ws-tooltip-val">{formatUptime(health.uptimeSeconds || 0)}</span>
          </div>
          {health.pollFallbackActive && (
            <div className="ws-tooltip-row ws-tooltip-row--warn">
              <span className="ws-tooltip-key">Poll fallback</span>
              <span className="ws-tooltip-val">active</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function GlobalStatsBar({ tab }) {
  const [stats,  setStats]  = useState(null);
  const [health, setHealth] = useState(null);

  useEffect(() => {
    if (!STATS_TABS.has(tab)) return;
    const loadStats  = () => getPerformance("today").then((d) => setStats(d.stats)).catch(() => {});
    const loadHealth = () => getBotStatus().then(setHealth).catch(() => {});
    loadStats();
    loadHealth();
    const statsId  = setInterval(loadStats,  30000);
    const healthId = setInterval(loadHealth, 30000);
    return () => { clearInterval(statsId); clearInterval(healthId); };
  }, [tab]);

  if (!STATS_TABS.has(tab)) return null;

  const s      = stats || { netPnl: 0, total: 0, winRate: 0 };
  const pnlPos = (s.netPnl || 0) >= 0;

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
          <div className="stats-bar-item">
            <span className="stats-bar-val">{s.total || 0}</span>
            <span className="stats-bar-lbl">Trades Today</span>
          </div>
          <div className="stats-bar-item">
            <span className="stats-bar-val"
              style={{ color: (s.winRate||0) >= 50 ? "#4caf84" : (s.winRate||0) > 0 ? "#f5a623" : "#ffffff" }}>
              {(s.winRate || 0).toFixed(0)}%
            </span>
            <span className="stats-bar-lbl">Win Rate Today</span>
          </div>
          <BotStatusIndicator health={health} />
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

      {/* ── Fixed header — sits above the status bar, bg fills behind it ── */}
      <header className="app-header">
        <div className="container">
          <div className="header-inner">
            <div className="header-logo">
              <img src="/logo.svg" alt="" className="header-logo-img" />
              <span className="logo-name">CopyTradeAI</span>
            </div>
            <div className="header-right">
              {status ? (
                <>
                  <span className={status.paperMode ? "badge-paper" : "badge-live"}>
                    {status.paperMode ? "Paper" : "Live"}
                  </span>
                  <span className="header-uptime">up {Math.floor(status.uptime / 60)}m</span>
                </>
              ) : (
                <span className="header-offline">Offline</span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Fixed tab nav — sits immediately below the header ── */}
      <nav className="tab-nav">
        <div className="container nav-container">
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

      {/* ── Scrollable content — offset by fixed header + nav heights ── */}
      <div className="tab-content">
        <GlobalStatsBar tab={tab} />
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
