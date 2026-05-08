import { useState, useEffect, useCallback } from "react";
import { getWallets, approveWallet, pinWallet } from "../api/botApi";

const MAX_COPYING = 5;

function WinBar({ rate }) {
  const pct = Math.min(100, Math.max(0, rate * 100));
  return (
    <div className="wallet-winrate-cell">
      <span className="wallet-winrate-pct">{pct.toFixed(1)}%</span>
      <div className="win-bar-track">
        <div className="win-bar-fill" style={{ width: pct + "%" }} />
      </div>
    </div>
  );
}

function ModalWinBar({ rate }) {
  const pct = Math.min(100, Math.max(0, rate * 100));
  return (
    <div className="swap-card-winbar">
      <span className="swap-card-winrate">{pct.toFixed(1)}%</span>
      <div className="swap-card-bar-track">
        <div className="swap-card-bar-fill" style={{ width: pct + "%" }} />
      </div>
    </div>
  );
}

function SwapModal({ target, activeWallets, onConfirm, onCancel, busy }) {
  const [selected, setSelected] = useState(null);

  return (
    <div className="swap-overlay" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="swap-modal">
        <div className="swap-modal-header">
          <div className="swap-modal-title">Wallet Limit Reached</div>
          <div className="swap-modal-subtitle">
            You are already copying {MAX_COPYING} wallets. Select one to replace.
          </div>
        </div>

        <div className="swap-modal-body">
          {activeWallets.map((w) => {
            const pnl    = parseFloat(w.realized_pnl) || 0;
            const pinned = !!w.pinned;
            const auto   = !!w.approved && !pinned;
            const isSelected = selected?.address === w.address;
            return (
              <div
                key={w.address}
                className={"swap-wallet-card" + (isSelected ? " selected" : "")}
                onClick={() => setSelected(w)}
              >
                <div className="swap-card-header">
                  <span className="swap-card-addr">
                    {w.address.slice(0, 6)}...{w.address.slice(-4)}
                  </span>
                  <div className="swap-card-badges">
                    {pinned && <span className="badge-pinned">PINNED</span>}
                    {auto   && <span className="badge-auto">AUTO</span>}
                  </div>
                </div>

                <ModalWinBar rate={w.win_rate} />

                <div className="swap-card-stats">
                  <div className="swap-card-stat">
                    <div className="swap-card-stat-lbl">Score</div>
                    <div className="swap-card-stat-val swap-card-stat-val--score">{w.score.toFixed(1)}</div>
                  </div>
                  <div className="swap-card-stat">
                    <div className="swap-card-stat-lbl">Trades</div>
                    <div className="swap-card-stat-val">{w.trade_count.toLocaleString()}</div>
                  </div>
                  <div className="swap-card-stat">
                    <div className="swap-card-stat-lbl">Realized PnL</div>
                    <div className="swap-card-stat-val swap-card-stat-val--pos">
                      ${Math.abs(pnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="swap-modal-footer">
          <button
            className="btn-swap-confirm"
            disabled={!selected || busy}
            onClick={() => selected && onConfirm(selected)}
          >
            {busy ? "Swapping..." : "Swap Wallet"}
          </button>
          <button className="btn-swap-cancel" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Leaderboard() {
  const [wallets,     setWallets]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [swapTarget,  setSwapTarget]  = useState(null);
  const [swapBusy,    setSwapBusy]    = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  const load = useCallback(() =>
    getWallets(20).then(setWallets).catch(console.error).finally(() => setLoading(false)),
  []);

  useEffect(() => {
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, [load]);

  const showToast = () => {
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  };

  const toggle = async (w) => {
    if (w.approved) {
      await approveWallet(w.address, false);
      load();
      return;
    }
    const activeWallets = wallets.filter((x) => x.approved);
    if (activeWallets.length >= MAX_COPYING) {
      setSwapTarget(w);
      return;
    }
    await approveWallet(w.address, true);
    load();
  };

  const togglePin = async (w) => {
    await pinWallet(w.address, !w.pinned);
    load();
  };

  const handleSwapConfirm = async (walletToReplace) => {
    setSwapBusy(true);
    try {
      await approveWallet(walletToReplace.address, false);
      await approveWallet(swapTarget.address, true);
      setSwapTarget(null);
      await load();
      showToast();
    } catch (err) {
      console.error("Swap failed:", err);
    } finally {
      setSwapBusy(false);
    }
  };

  const handleSwapCancel = () => {
    if (!swapBusy) setSwapTarget(null);
  };

  if (loading) return <div className="loading">Loading wallets...</div>;

  const activeWallets = wallets.filter((w) => w.approved);

  return (
    <div>
      <div className="section-head">
        <span className="section-title">Wallets</span>
        <span className="section-count">{wallets.length} scored</span>
      </div>

      <div className="lb-col-head">
        <span>#</span>
        <span>Address</span>
        <span>Win Rate</span>
        <span>Score</span>
        <span>Trades</span>
        <span>Realized PnL</span>
        <span></span>
      </div>

      {wallets.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-title">No wallets scored yet</div>
          <div className="empty-state-sub">Run npm run score inside /bot to populate this list</div>
        </div>
      ) : (
        <div className="wallet-list">
          {wallets.map((w, i) => {
            const pnl    = parseFloat(w.realized_pnl) || 0;
            const pinned = !!w.pinned;
            const auto   = !!w.approved && !pinned;
            return (
              <div key={w.address} className={"wallet-row" + (w.approved ? " approved" : "")}>

                <span className="wallet-rank">{i + 1}</span>

                <div className="wallet-addr-col">
                  <a
                    href={"https://solscan.io/account/" + w.address}
                    target="_blank" rel="noopener noreferrer"
                    className="wallet-addr"
                  >
                    {w.address.slice(0, 6)}...{w.address.slice(-4)}
                  </a>
                  {pinned && <span className="badge-pinned">PINNED</span>}
                  {auto   && <span className="badge-auto">AUTO</span>}
                </div>

                <WinBar rate={w.win_rate} />

                <div className="wallet-row-meta">
                  <div className="wallet-cell">
                    <div className="wallet-cell-val wallet-cell-val--score">{w.score.toFixed(1)}</div>
                    <div className="wallet-cell-lbl">Score</div>
                  </div>
                  <div className="wallet-cell">
                    <div className="wallet-cell-val">{w.trade_count.toLocaleString()}</div>
                    <div className="wallet-cell-lbl">Trades</div>
                  </div>
                  <div className="wallet-cell">
                    <div className="wallet-cell-val pos">
                      ${Math.abs(pnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                    <div className="wallet-cell-lbl">Realized</div>
                  </div>
                </div>

                <div className="wallet-row-actions">
                  <button
                    className={"btn-pin" + (pinned ? " pinned" : "")}
                    onClick={() => togglePin(w)}
                    title={pinned ? "Unpin wallet" : "Pin wallet (always copy)"}
                  >
                    📌
                  </button>
                  <button
                    className={"btn-copy" + (w.approved ? " copying" : "")}
                    onClick={() => toggle(w)}
                  >
                    {w.approved ? "Copying" : "Copy"}
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {swapTarget && (
        <SwapModal
          target={swapTarget}
          activeWallets={activeWallets}
          onConfirm={handleSwapConfirm}
          onCancel={handleSwapCancel}
          busy={swapBusy}
        />
      )}

      {toastVisible && (
        <div className="swap-toast">Wallet swapped successfully</div>
      )}
    </div>
  );
}
