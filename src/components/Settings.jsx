import { useState, useEffect } from "react";
import {
  getSettings, updateSetting, getWallet, getWallets, getStatus,
  getNotifSettings, updateNotifSetting, subscribeNotif, unsubscribeNotif,
  testNotification, getVapidKey,
} from "../api/botApi";

// ── Wallet Status Card ─────────────────────────────────────────────────────
function WalletStatusCard({ wallet, paperMode }) {
  if (!wallet) {
    return (
      <div className="settings-wallet-card">
        <div className="settings-wallet-header">
          <span className="settings-wallet-label">Wallet Status</span>
        </div>
        <div className="settings-hint-muted" style={{ marginTop: 0 }}>Fetching wallet balance...</div>
      </div>
    );
  }
  const secsAgo = Math.round((Date.now() - wallet.updatedAt) / 1000);
  const relTime = secsAgo < 5 ? "just now" : secsAgo + "s ago";
  return (
    <div className="settings-wallet-card">
      <div className="settings-wallet-header">
        <span className="settings-wallet-label">Wallet Status</span>
        <span className={paperMode ? "badge-paper" : "badge-live"}>
          {paperMode ? "Paper Trading" : "Live"}
        </span>
      </div>
      <div className="settings-wallet-addr">{wallet.address.slice(0, 10)}...{wallet.address.slice(-6)}</div>
      <div className="settings-wallet-balance">
        <div className="settings-wallet-sol">
          {wallet.solBalance.toFixed(4)}<span className="settings-wallet-unit">SOL</span>
        </div>
        <div className="settings-wallet-usd">
          ${wallet.usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </div>
      </div>
      <div className="settings-wallet-meta">
        SOL price ${wallet.solPrice.toFixed(2)} &nbsp;·&nbsp; Updated {relTime}
      </div>
    </div>
  );
}

// ── Position Size Row ──────────────────────────────────────────────────────
function PositionSizeRow({ value, wallet, onSave }) {
  const defaultVal = parseFloat(value) || 0.1;
  const [raw, setRaw]     = useState(String(defaultVal));
  const [num, setNum]     = useState(defaultVal);
  const [saved, setSaved] = useState(false);
  useEffect(() => { const n = parseFloat(value) || 0.1; setRaw(String(n)); setNum(n); }, [value]);
  const solPrice = wallet?.solPrice || 0;
  const minSol = 0.1, maxSol = Math.max(wallet?.solBalance || 0, 10);
  const safeMin = (maxSol * 0.05 * solPrice).toFixed(2);
  const safeMax = (maxSol * 0.10 * solPrice).toFixed(2);
  const usdVal  = (num * solPrice).toFixed(2);
  const fillPct = Math.max(0, Math.min(100, ((num - minSol) / (maxSol - minSol)) * 100));
  const commit  = (str) => { const n = Math.min(maxSol, Math.max(minSol, parseFloat(str) || minSol)); setNum(n); setRaw(String(n)); return n; };
  const handleSave = async () => { const n = commit(raw); await onSave("max_position_sol", String(n)); setSaved(true); setTimeout(() => setSaved(false), 2000); };
  return (
    <div className="settings-row settings-row--tall">
      <div className="settings-row-left">
        <div className="settings-label-title">Max Position Size</div>
        {wallet
          ? <div className="settings-wallet-bal-hint">Wallet Balance: {wallet.solBalance.toFixed(4)} SOL (${wallet.usdValue.toFixed(2)} USD)</div>
          : <div className="settings-hint-muted">Loading wallet balance...</div>}
        <div className="settings-slider-wrap">
          <input type="range" className="sol-slider" min={minSol} max={maxSol} step={0.01}
            value={Math.min(num, maxSol)}
            onChange={(e) => { const n = parseFloat(e.target.value); setNum(n); setRaw(String(n)); }}
            style={{ "--fill": fillPct + "%" }} />
          <div className="settings-slider-labels">
            <span>{minSol} SOL</span>
            <span>{maxSol.toFixed(2)} SOL{wallet?.solBalance > 0 ? "" : " (default)"}</span>
          </div>
        </div>
        <div className="settings-hint-green">{num.toFixed(2)} SOL = ${usdVal} USD per trade</div>
        <div className="settings-hint-muted">Recommended: ${safeMin} – ${safeMax} per trade (5–10% of wallet)</div>
      </div>
      <div className="settings-control">
        <div className="settings-input-wrap">
          <input type="text" inputMode="decimal" className="settings-input" value={raw}
            onChange={(e) => setRaw(e.target.value)} onFocus={(e) => e.target.select()} onBlur={() => commit(raw)} />
          <span className="settings-input-unit">SOL</span>
        </div>
        <button className={"btn-save" + (saved ? " saved" : "")} onClick={handleSave}>{saved ? "Saved" : "Save"}</button>
      </div>
    </div>
  );
}

// ── Take Profit Row ────────────────────────────────────────────────────────
function TakeProfitRow({ value, onSave }) {
  const defaultVal = parseFloat(value) || 50;
  const [raw, setRaw]     = useState(String(defaultVal));
  const [num, setNum]     = useState(defaultVal);
  const [saved, setSaved] = useState(false);
  useEffect(() => { const n = parseFloat(value) || 50; setRaw(String(n)); setNum(n); }, [value]);
  const resultOf100 = (100 * (1 + num / 100)).toFixed(2);
  const commit = (str) => { const n = Math.max(1, parseFloat(str) || 1); setNum(n); setRaw(String(n)); return n; };
  const handleSave = async () => { const n = commit(raw); await onSave("take_profit_percent", String(n)); setSaved(true); setTimeout(() => setSaved(false), 2000); };
  return (
    <div className="settings-row settings-row--tall">
      <div className="settings-row-left">
        <div className="settings-label-title">Take Profit</div>
        <div className="settings-hint-green">Auto-sell when up {num}% — you turn $100 into ${resultOf100}</div>
      </div>
      <div className="settings-control">
        <div className="settings-input-wrap">
          <input type="text" inputMode="decimal" className="settings-input" value={raw}
            onChange={(e) => setRaw(e.target.value)} onFocus={(e) => e.target.select()} onBlur={() => commit(raw)} />
          <span className="settings-input-unit">%</span>
        </div>
        <button className={"btn-save" + (saved ? " saved" : "")} onClick={handleSave}>{saved ? "Saved" : "Save"}</button>
      </div>
    </div>
  );
}

// ── Stop Loss Row ──────────────────────────────────────────────────────────
function StopLossRow({ value, positionUsd, onSave }) {
  const defaultVal = parseFloat(value) || 20;
  const [raw, setRaw]     = useState(String(defaultVal));
  const [num, setNum]     = useState(defaultVal);
  const [saved, setSaved] = useState(false);
  useEffect(() => { const n = parseFloat(value) || 20; setRaw(String(n)); setNum(n); }, [value]);
  const maxLoss = (positionUsd * num / 100).toFixed(2);
  const commit = (str) => { const n = Math.min(100, Math.max(1, parseFloat(str) || 1)); setNum(n); setRaw(String(n)); return n; };
  const handleSave = async () => { const n = commit(raw); await onSave("stop_loss_percent", String(n)); setSaved(true); setTimeout(() => setSaved(false), 2000); };
  return (
    <div className="settings-row settings-row--tall">
      <div className="settings-row-left">
        <div className="settings-label-title">Stop Loss</div>
        <div className="settings-hint-red">Auto-sell when down {num}% — max loss per trade: ${maxLoss}</div>
      </div>
      <div className="settings-control">
        <div className="settings-input-wrap">
          <input type="text" inputMode="decimal" className="settings-input" value={raw}
            onChange={(e) => setRaw(e.target.value)} onFocus={(e) => e.target.select()} onBlur={() => commit(raw)} />
          <span className="settings-input-unit">%</span>
        </div>
        <button className={"btn-save" + (saved ? " saved" : "")} onClick={handleSave}>{saved ? "Saved" : "Save"}</button>
      </div>
    </div>
  );
}

// ── Max Trades Row ─────────────────────────────────────────────────────────
function MaxTradesRow({ value, positionUsd, walletUsd, onSave }) {
  const defaultVal = parseInt(value) || 5;
  const [raw, setRaw]     = useState(String(defaultVal));
  const [num, setNum]     = useState(defaultVal);
  const [saved, setSaved] = useState(false);
  useEffect(() => { const n = parseInt(value) || 5; setRaw(String(n)); setNum(n); }, [value]);
  const totalExposed = (positionUsd * num).toFixed(2);
  const pctAtRisk    = walletUsd > 0 ? ((positionUsd * num / walletUsd) * 100).toFixed(1) : "—";
  const commit = (str) => { const n = Math.min(50, Math.max(1, parseInt(str) || 1)); setNum(n); setRaw(String(n)); return n; };
  const handleSave = async () => { const n = commit(raw); await onSave("max_concurrent_positions", String(n)); setSaved(true); setTimeout(() => setSaved(false), 2000); };
  return (
    <div className="settings-row settings-row--tall">
      <div className="settings-row-left">
        <div className="settings-label-title">Max Simultaneous Trades</div>
        <div className="settings-hint-orange">Max ${totalExposed} exposed at once &nbsp;·&nbsp; {pctAtRisk}% of wallet at risk</div>
      </div>
      <div className="settings-control">
        <input type="text" inputMode="numeric" className="settings-input" value={raw}
          onChange={(e) => setRaw(e.target.value)} onFocus={(e) => e.target.select()} onBlur={() => commit(raw)} />
        <button className={"btn-save" + (saved ? " saved" : "")} onClick={handleSave}>{saved ? "Saved" : "Save"}</button>
      </div>
    </div>
  );
}

// ── Min Score Row ──────────────────────────────────────────────────────────
function MinScoreRow({ value, wallets, onSave }) {
  const defaultVal = parseFloat(value) || 70;
  const [raw, setRaw]     = useState(String(defaultVal));
  const [num, setNum]     = useState(defaultVal);
  const [saved, setSaved] = useState(false);
  useEffect(() => { const n = parseFloat(value) || 70; setRaw(String(n)); setNum(n); }, [value]);
  const qualifying = wallets.filter((w) => w.score >= num).length;
  const total      = wallets.length || 20;
  let riskLabel, riskClass;
  if (num > 50)       { riskLabel = "Low Risk";   riskClass = "risk-badge--low";  }
  else if (num >= 35) { riskLabel = "Medium Risk"; riskClass = "risk-badge--med";  }
  else                { riskLabel = "Higher Risk"; riskClass = "risk-badge--high"; }
  const commit = (str) => { const n = Math.min(100, Math.max(0, parseFloat(str) || 0)); setNum(n); setRaw(String(n)); return n; };
  const handleSave = async () => { const n = commit(raw); await onSave("min_wallet_score", String(n)); setSaved(true); setTimeout(() => setSaved(false), 2000); };
  return (
    <div className="settings-row settings-row--tall">
      <div className="settings-row-left">
        <div className="settings-label-title">Min Wallet Score</div>
        <div className="settings-score-row">
          <span className={"risk-badge " + riskClass}>{riskLabel}</span>
          <span className="settings-hint-muted" style={{ marginTop: 0 }}>{qualifying} of {total} wallets qualify</span>
        </div>
      </div>
      <div className="settings-control">
        <input type="text" inputMode="decimal" className="settings-input" value={raw}
          onChange={(e) => setRaw(e.target.value)} onFocus={(e) => e.target.select()} onBlur={() => commit(raw)} />
        <button className={"btn-save" + (saved ? " saved" : "")} onClick={handleSave}>{saved ? "Saved" : "Save"}</button>
      </div>
    </div>
  );
}

// ── iOS PWA Install Card ───────────────────────────────────────────────────
const IOS_STEPS = [
  { n: 1, text: "Open this page in Safari (not Chrome or other browsers)" },
  { n: 2, text: "Tap the Share button at the bottom of Safari — the box with an arrow pointing up" },
  { n: 3, text: "Scroll down in the share sheet and tap 'Add to Home Screen'" },
  { n: 4, text: "Tap 'Add' in the top right — CopyTradeAI will appear on your home screen" },
  { n: 5, text: "Open the app from your home screen, then come back here to enable notifications" },
];

function InstallCard() {
  const isIOS       = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isAndroid   = /Android/i.test(navigator.userAgent);
  const isStandalone = window.navigator.standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches;

  if (isStandalone) {
    return (
      <div className="pwa-install-card">
        <div className="pwa-install-header">
          <span className="pwa-install-icon">✓</span>
          <div>
            <div className="pwa-install-title">App Installed</div>
            <div className="pwa-install-sub">CopyTradeAI is running as an installed app</div>
          </div>
        </div>
      </div>
    );
  }

  if (isIOS) {
    const isSafari = /Safari/i.test(navigator.userAgent) && !/CriOS|FxiOS|OPiOS/i.test(navigator.userAgent);
    return (
      <div className="pwa-install-card">
        <div className="pwa-install-header">
          <span className="pwa-install-icon">📱</span>
          <div>
            <div className="pwa-install-title">Install on iPhone</div>
            <div className="pwa-install-sub">
              {isSafari
                ? "Follow these steps to add CopyTradeAI to your home screen"
                : "⚠️ Switch to Safari to install — Chrome on iOS cannot install PWAs"}
            </div>
          </div>
        </div>
        <div className="pwa-steps">
          {IOS_STEPS.map(({ n, text }) => (
            <div key={n} className="pwa-step">
              <div className="pwa-step-num">{n}</div>
              <div className="pwa-step-text">{text}</div>
            </div>
          ))}
        </div>
        <div className="pwa-install-note">
          Push notifications only work when CopyTradeAI is installed as an app
        </div>
      </div>
    );
  }

  // Android / desktop — show info but actual install is via banner
  return (
    <div className="pwa-install-card">
      <div className="pwa-install-header">
        <span className="pwa-install-icon">📲</span>
        <div>
          <div className="pwa-install-title">Install App</div>
          <div className="pwa-install-sub">
            {isAndroid
              ? "Tap 'Install' in the banner at the bottom of the screen, or use your browser's install option"
              : "Use your browser's install option or look for the install prompt in the address bar"}
          </div>
        </div>
      </div>
      <div className="pwa-install-note">
        Push notifications only work when CopyTradeAI is installed as an app
      </div>
    </div>
  );
}

// ── Notifications Card ─────────────────────────────────────────────────────
function urlBase64ToUint8Array(base64) {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + pad).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

function NotificationsCard() {
  const [notifSettings, setNotifSettings] = useState({ notify_buy: "1", notify_sell: "1", notify_daily: "1" });
  const [sub, setSub]           = useState(null);
  const [status, setStatus]     = useState("idle");
  const [testStatus, setTest]   = useState("idle");
  const [vapidKey, setVapidKey] = useState(null);

  useEffect(() => {
    getNotifSettings().then(setNotifSettings).catch(() => {});
    getVapidKey().then((d) => setVapidKey(d.publicKey)).catch(() => {});
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported"); return;
    }
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((existing) => { if (existing) { setSub(existing); setStatus("subscribed"); } })
      .catch(() => {});
  }, []);

  const toggleNotif = async (key) => {
    const newVal = notifSettings[key] === "1" ? "0" : "1";
    await updateNotifSetting(key, newVal).catch(() => {});
    setNotifSettings((prev) => ({ ...prev, [key]: newVal }));
  };

  const subscribe = async () => {
    if (!vapidKey) return;
    setStatus("subscribing");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setStatus("idle"); return; }
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      await subscribeNotif(subscription);
      setSub(subscription);
      setStatus("subscribed");
    } catch (e) {
      console.error("Push subscribe error:", e);
      setStatus("idle");
    }
  };

  const unsubscribe = async () => {
    if (!sub) return;
    await unsubscribeNotif(sub.endpoint).catch(() => {});
    await sub.unsubscribe().catch(() => {});
    setSub(null);
    setStatus("idle");
  };

  const sendTest = async () => {
    setTest("sending");
    try {
      await testNotification();
      setTest("sent");
      setTimeout(() => setTest("idle"), 3000);
    } catch {
      setTest("error");
      setTimeout(() => setTest("idle"), 3000);
    }
  };

  const NOTIF_KEYS = [
    { key: "notify_buy",   label: "Buy alerts",    desc: "Notify when a buy is copied" },
    { key: "notify_sell",  label: "Sell alerts",   desc: "Notify when a position is closed" },
    { key: "notify_daily", label: "Daily summary", desc: "End-of-day performance recap" },
  ];

  return (
    <div className="settings-card" style={{ marginTop: 16 }}>
      <div className="settings-row" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div>
          <div className="settings-label-title">Push Notifications</div>
          <div className="settings-label-desc">
            {status === "unsupported" ? "Not supported in this browser" :
             status === "subscribed"  ? "Notifications enabled on this device" :
                                        "Get alerts on your phone or desktop"}
          </div>
        </div>
        <div className="settings-control">
          {status === "subscribed" ? (
            <button className="btn-save" onClick={unsubscribe}
              style={{ background: "rgba(255,255,255,0.06)", color: "#888" }}>Disable</button>
          ) : status === "subscribing" ? (
            <button className="btn-save" disabled>Enabling...</button>
          ) : status !== "unsupported" ? (
            <button className="btn-save" onClick={subscribe}>Enable</button>
          ) : null}
        </div>
      </div>

      {NOTIF_KEYS.map(({ key, label, desc }) => (
        <div key={key} className="settings-row" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <div>
            <div className="settings-label-title" style={{ fontSize: 13 }}>{label}</div>
            <div className="settings-label-desc">{desc}</div>
          </div>
          <div className="settings-control">
            <button className={"notif-toggle" + (notifSettings[key] === "1" ? " on" : "")}
              onClick={() => toggleNotif(key)}>
              <div className="notif-toggle-thumb" />
            </button>
          </div>
        </div>
      ))}

      {status === "subscribed" && (
        <div className="settings-row" style={{ borderBottom: "none" }}>
          <div className="settings-label-desc">Send a test notification to verify setup</div>
          <div className="settings-control">
            <button className={"btn-save" + (testStatus === "sent" ? " saved" : "")}
              onClick={sendTest} disabled={testStatus === "sending"}>
              {testStatus === "sending" ? "Sending..." : testStatus === "sent" ? "Sent!" : testStatus === "error" ? "Failed" : "Test"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function Settings() {
  const [settings, setSettings] = useState({});
  const [wallet, setWallet]     = useState(null);
  const [wallets, setWallets]   = useState([]);
  const [status, setStatus]     = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([getSettings(), getWallet(), getWallets(20), getStatus()])
      .then(([s, w, ws, st]) => { setSettings(s); setWallet(w); setWallets(ws); setStatus(st); })
      .catch(console.error)
      .finally(() => setLoading(false));
    const id = setInterval(() => getWallet().then(setWallet).catch(console.error), 60000);
    return () => clearInterval(id);
  }, []);

  const handleSave = async (key, value) => {
    await updateSetting(key, value);
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) return <div className="loading">Loading settings...</div>;

  const positionSol = parseFloat(settings.max_position_sol) || 0.1;
  const positionUsd = positionSol * (wallet?.solPrice || 0);
  const walletUsd   = wallet?.usdValue || 0;

  return (
    <div>
      <div className="section-head">
        <span className="section-title">Settings</span>
        <span className="section-count">Changes apply immediately</span>
      </div>

      <WalletStatusCard wallet={wallet} paperMode={status?.paperMode} />

      <div className="settings-card">
        <PositionSizeRow value={settings.max_position_sol} wallet={wallet} onSave={handleSave} />
        <TakeProfitRow   value={settings.take_profit_percent} onSave={handleSave} />
        <StopLossRow     value={settings.stop_loss_percent} positionUsd={positionUsd} onSave={handleSave} />
        <MaxTradesRow    value={settings.max_concurrent_positions} positionUsd={positionUsd} walletUsd={walletUsd} onSave={handleSave} />
        <MinScoreRow     value={settings.min_wallet_score} wallets={wallets} onSave={handleSave} />
      </div>

      <InstallCard />

      <NotificationsCard />
    </div>
  );
}
