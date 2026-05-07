import { useState, useEffect } from "react";
import { getSettings, updateSetting, getWallet, getWallets, getStatus } from "../api/botApi";

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
      <div className="settings-wallet-addr">
        {wallet.address.slice(0, 10)}...{wallet.address.slice(-6)}
      </div>
      <div className="settings-wallet-balance">
        <div className="settings-wallet-sol">
          {wallet.solBalance.toFixed(4)}
          <span className="settings-wallet-unit">SOL</span>
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
  const [raw, setRaw]     = useState(String(defaultVal));  // string state for input display
  const [num, setNum]     = useState(defaultVal);          // parsed number for previews/slider
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const n = parseFloat(value) || 0.1;
    setRaw(String(n));
    setNum(n);
  }, [value]);

  const solPrice = wallet?.solPrice || 0;
  const minSol   = 0.1;
  const maxSol   = Math.max(wallet?.solBalance || 0, 10);
  const safeMin  = (maxSol * 0.05 * solPrice).toFixed(2);
  const safeMax  = (maxSol * 0.10 * solPrice).toFixed(2);
  const usdVal   = (num * solPrice).toFixed(2);
  const fillPct  = Math.max(0, Math.min(100, ((num - minSol) / (maxSol - minSol)) * 100));

  const commit = (str) => {
    const n = Math.min(maxSol, Math.max(minSol, parseFloat(str) || minSol));
    setNum(n);
    setRaw(String(n));
    return n;
  };

  const handleSave = async () => {
    const n = commit(raw);
    await onSave("max_position_sol", String(n));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="settings-row settings-row--tall">
      <div className="settings-row-left">
        <div className="settings-label-title">Max Position Size</div>
        {wallet ? (
          <div className="settings-wallet-bal-hint">
            Wallet Balance: {wallet.solBalance.toFixed(4)} SOL (${wallet.usdValue.toFixed(2)} USD)
          </div>
        ) : (
          <div className="settings-hint-muted">Loading wallet balance...</div>
        )}
        <div className="settings-slider-wrap">
          <input
            type="range"
            className="sol-slider"
            min={minSol}
            max={maxSol}
            step={0.01}
            value={Math.min(num, maxSol)}
            onChange={(e) => {
              const n = parseFloat(e.target.value);
              setNum(n);
              setRaw(String(n));
            }}
            style={{ "--fill": fillPct + "%" }}
          />
          <div className="settings-slider-labels">
            <span>{minSol} SOL</span>
            <span>{maxSol.toFixed(2)} SOL{wallet?.solBalance > 0 ? "" : " (default)"}</span>
          </div>
        </div>
        <div className="settings-hint-green">
          {num.toFixed(2)} SOL = ${usdVal} USD per trade
        </div>
        <div className="settings-hint-muted">
          Recommended: ${safeMin} – ${safeMax} per trade (5–10% of wallet)
        </div>
      </div>
      <div className="settings-control">
        <div className="settings-input-wrap">
          <input
            type="text"
            inputMode="decimal"
            className="settings-input"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            onFocus={(e) => e.target.select()}
            onBlur={() => commit(raw)}
          />
          <span className="settings-input-unit">SOL</span>
        </div>
        <button className={"btn-save" + (saved ? " saved" : "")} onClick={handleSave}>
          {saved ? "Saved" : "Save"}
        </button>
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

  useEffect(() => {
    const n = parseFloat(value) || 50;
    setRaw(String(n));
    setNum(n);
  }, [value]);

  const resultOf100 = (100 * (1 + num / 100)).toFixed(2);

  const commit = (str) => {
    const n = Math.max(1, parseFloat(str) || 1);
    setNum(n);
    setRaw(String(n));
    return n;
  };

  const handleSave = async () => {
    const n = commit(raw);
    await onSave("take_profit_percent", String(n));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="settings-row settings-row--tall">
      <div className="settings-row-left">
        <div className="settings-label-title">Take Profit</div>
        <div className="settings-hint-green">
          Auto-sell when up {num}% — you turn $100 into ${resultOf100}
        </div>
      </div>
      <div className="settings-control">
        <div className="settings-input-wrap">
          <input
            type="text"
            inputMode="decimal"
            className="settings-input"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            onFocus={(e) => e.target.select()}
            onBlur={() => commit(raw)}
          />
          <span className="settings-input-unit">%</span>
        </div>
        <button className={"btn-save" + (saved ? " saved" : "")} onClick={handleSave}>
          {saved ? "Saved" : "Save"}
        </button>
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

  useEffect(() => {
    const n = parseFloat(value) || 20;
    setRaw(String(n));
    setNum(n);
  }, [value]);

  const maxLoss = (positionUsd * num / 100).toFixed(2);

  const commit = (str) => {
    const n = Math.min(100, Math.max(1, parseFloat(str) || 1));
    setNum(n);
    setRaw(String(n));
    return n;
  };

  const handleSave = async () => {
    const n = commit(raw);
    await onSave("stop_loss_percent", String(n));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="settings-row settings-row--tall">
      <div className="settings-row-left">
        <div className="settings-label-title">Stop Loss</div>
        <div className="settings-hint-red">
          Auto-sell when down {num}% — max loss per trade: ${maxLoss}
        </div>
      </div>
      <div className="settings-control">
        <div className="settings-input-wrap">
          <input
            type="text"
            inputMode="decimal"
            className="settings-input"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            onFocus={(e) => e.target.select()}
            onBlur={() => commit(raw)}
          />
          <span className="settings-input-unit">%</span>
        </div>
        <button className={"btn-save" + (saved ? " saved" : "")} onClick={handleSave}>
          {saved ? "Saved" : "Save"}
        </button>
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

  useEffect(() => {
    const n = parseInt(value) || 5;
    setRaw(String(n));
    setNum(n);
  }, [value]);

  const totalExposed = (positionUsd * num).toFixed(2);
  const pctAtRisk    = walletUsd > 0
    ? ((positionUsd * num / walletUsd) * 100).toFixed(1)
    : "—";

  const commit = (str) => {
    const n = Math.min(50, Math.max(1, parseInt(str) || 1));
    setNum(n);
    setRaw(String(n));
    return n;
  };

  const handleSave = async () => {
    const n = commit(raw);
    await onSave("max_concurrent_positions", String(n));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="settings-row settings-row--tall">
      <div className="settings-row-left">
        <div className="settings-label-title">Max Simultaneous Trades</div>
        <div className="settings-hint-orange">
          Max ${totalExposed} exposed at once &nbsp;·&nbsp; {pctAtRisk}% of wallet at risk
        </div>
      </div>
      <div className="settings-control">
        <input
          type="text"
          inputMode="numeric"
          className="settings-input"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          onFocus={(e) => e.target.select()}
          onBlur={() => commit(raw)}
        />
        <button className={"btn-save" + (saved ? " saved" : "")} onClick={handleSave}>
          {saved ? "Saved" : "Save"}
        </button>
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

  useEffect(() => {
    const n = parseFloat(value) || 70;
    setRaw(String(n));
    setNum(n);
  }, [value]);

  const qualifying = wallets.filter((w) => w.score >= num).length;
  const total      = wallets.length || 20;

  let riskLabel, riskClass;
  if (num > 50)       { riskLabel = "Low Risk";    riskClass = "risk-badge--low";  }
  else if (num >= 35) { riskLabel = "Medium Risk";  riskClass = "risk-badge--med";  }
  else                { riskLabel = "Higher Risk";  riskClass = "risk-badge--high"; }

  const commit = (str) => {
    const n = Math.min(100, Math.max(0, parseFloat(str) || 0));
    setNum(n);
    setRaw(String(n));
    return n;
  };

  const handleSave = async () => {
    const n = commit(raw);
    await onSave("min_wallet_score", String(n));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="settings-row settings-row--tall">
      <div className="settings-row-left">
        <div className="settings-label-title">Min Wallet Score</div>
        <div className="settings-score-row">
          <span className={"risk-badge " + riskClass}>{riskLabel}</span>
          <span className="settings-hint-muted" style={{ marginTop: 0 }}>
            {qualifying} of {total} wallets qualify
          </span>
        </div>
      </div>
      <div className="settings-control">
        <input
          type="text"
          inputMode="decimal"
          className="settings-input"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          onFocus={(e) => e.target.select()}
          onBlur={() => commit(raw)}
        />
        <button className={"btn-save" + (saved ? " saved" : "")} onClick={handleSave}>
          {saved ? "Saved" : "Save"}
        </button>
      </div>
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
      .then(([s, w, ws, st]) => {
        setSettings(s);
        setWallet(w);
        setWallets(ws);
        setStatus(st);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    const id = setInterval(() => {
      getWallet().then(setWallet).catch(console.error);
    }, 60000);
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
        <PositionSizeRow
          value={settings.max_position_sol}
          wallet={wallet}
          onSave={handleSave}
        />
        <TakeProfitRow
          value={settings.take_profit_percent}
          onSave={handleSave}
        />
        <StopLossRow
          value={settings.stop_loss_percent}
          positionUsd={positionUsd}
          onSave={handleSave}
        />
        <MaxTradesRow
          value={settings.max_concurrent_positions}
          positionUsd={positionUsd}
          walletUsd={walletUsd}
          onSave={handleSave}
        />
        <MinScoreRow
          value={settings.min_wallet_score}
          wallets={wallets}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}
