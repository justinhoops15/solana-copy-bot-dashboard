import { useState, useEffect } from "react";
import Leaderboard  from "./components/Leaderboard";
import Positions    from "./components/Positions";
import TradeHistory from "./components/TradeHistory";
import Settings     from "./components/Settings";
import Performance  from "./components/Performance";
import Calendar     from "./components/Calendar";
import { getStatus } from "./api/botApi";

const TABS = [
  { id: "leaderboard",  label: "Leaderboard"  },
  { id: "positions",    label: "Positions"     },
  { id: "performance",  label: "Performance"   },
  { id: "calendar",     label: "PnL Calendar"  },
  { id: "history",      label: "Trade History" },
  { id: "settings",     label: "Settings"      },
];

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
