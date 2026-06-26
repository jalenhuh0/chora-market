"use client";

import type { ChoraMarketHook } from "@/hooks/useChoraMarket";
import type { Screen } from "@/hooks/useChoraMarket";

export function AppHeader({
  tm,
  tabs,
}: {
  tm: ChoraMarketHook;
  tabs: { id: Screen; label: string }[];
}) {
  return (
    <>
      <div className="headerBar">
        <div className="headerBarLeft">
          <strong>{tm.localGroupName}</strong>
          <span className="pill">Invite: {tm.inviteCode}</span>
        </div>
        <div className="headerBarRight">
          <button type="button" className="btn secondary" onClick={tm.copyInviteLink}>
            Copy invite link
          </button>
          <button type="button" className="btn secondary" onClick={tm.onSwitchGroup}>
            Switch group
          </button>
          <button type="button" className="btn secondary" onClick={tm.onSignOut}>
            Sign out
          </button>
        </div>
      </div>

      <div className="top">
        <div className="brand">
          <div className="logo">CM</div>
          <div>
            <h1>{tm.state.settings.app}</h1>
            <div className="sub">Track debts, bets, IOUs, payouts, and your friend group&apos;s economy.</div>
          </div>
        </div>
        <div className="tabs">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`tab${tm.screen === t.id ? " active" : ""}`}
              onClick={() => tm.showScreen(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
