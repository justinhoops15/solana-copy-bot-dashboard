import { useState, useEffect } from "react";
import Leaderboard  from "./components/Leaderboard";
import Positions    from "./components/Positions";
import TradeHistory from "./components/TradeHistory";
import Settings     from "./components/Settings";
import { getStatus } from "./api/botApi";

const TABS = [
  { id: "leaderboard", label: "Leaderboard"  },
  { id: "positions",   label: "Positions"    },
  { id: "history",     label: "Trade History" },
  { id: "settings",    label: "Settings"     },
];

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
      <div className="app-wrapper">

        <header className="header">
          <div className="container">
            <div className="header-inner">
              <div className="header-logo">
                <div className="logo-mark">
                  <div className="logo-mark-inner" />
                </div>
                <span className="logo-name">Solana Copy-Bot</span>
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
            {tab === "leaderboard" && <Leaderboard />}
            {tab === "positions"   && <Positions />}
            {tab === "history"     && <TradeHistory />}
            {tab === "settings"    && <Settings />}
          </div>
        </main>

      </div>
    </>
  );
}
