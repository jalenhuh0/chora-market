"use client";

import type { ChoraMarketHook } from "@/hooks/useChoraMarket";
import type { Screen } from "@/hooks/useChoraMarket";

export type AppTab = { id: Screen; label: string; shortLabel: string };

export function AppHeader({ tm, tabs }: { tm: ChoraMarketHook; tabs: AppTab[] }) {
  return (
    <>
      <div className="headerBar">
        <div className="headerBarLeft">
          <strong>{tm.localGroupName}</strong>
          <span className="pill hideMobile">Invite: {tm.inviteCode}</span>
        </div>
        <div className="headerBarRight">
          <button type="button" className="btn secondary btnCompact" onClick={tm.copyInviteLink}>
            Invite
          </button>
          <button type="button" className="btn secondary btnCompact hideMobile" onClick={tm.onSwitchGroup}>
            Switch
          </button>
          <button type="button" className="btn secondary btnCompact" onClick={tm.onSignOut}>
            Out
          </button>
        </div>
      </div>

      <div className="top">
        <div className="brand">
          <div className="logo">CM</div>
          <div>
            <h1>{tm.state.settings.app}</h1>
            <div className="sub hideMobile">
              IOUs, bets, and who reads the room in your friend group.
            </div>
          </div>
        </div>
      </div>

      <nav className="appTabs" aria-label="Main">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`tab${tm.screen === t.id ? " active" : ""}`}
            onClick={() => tm.showScreen(t.id)}
          >
            <span className="tabShort">{t.shortLabel}</span>
            <span className="tabFull">{t.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
