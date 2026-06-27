"use client";

import type { ChoraMarketHook } from "@/hooks/useChoraMarket";
import { Empty } from "@/components/chora-market/Empty";
import { BetCard } from "@/components/chora-market/bets/BetCard";
import { BetHistoryCard } from "@/components/chora-market/BetHistoryCard";
import { GroupNotificationsCard } from "@/components/chora-market/GroupNotificationsCard";

export function BetsScreen({ tm }: { tm: ChoraMarketHook }) {
  return (
    <section id="bets" className={`screen${tm.screen === "bets" ? " active" : ""}`}>
      <div className="betsLayout">
        <div className="betsMain">
      <div className="card">
        <h2>Create Friend-vs-Friend Bet</h2>
        <label>Bet title / event</label>
        <input
          value={tm.betTitle}
          onChange={(e) => tm.setBetTitle(e.target.value)}
          placeholder="Example: NBA championship bet"
        />
        <div className="row">
          <div>
            <label>Person 1</label>
            <select value={tm.sideAUser} onChange={(e) => tm.setSideAUser(e.target.value)}>
              {tm.state.people.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Person 2</label>
            <select value={tm.sideBUser} onChange={(e) => tm.setSideBUser(e.target.value)}>
              {tm.state.people.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="row">
          <div>
            <label>Person 1&apos;s take</label>
            <input
              value={tm.sideATake}
              onChange={(e) => tm.setSideATake(e.target.value)}
              placeholder="Spurs win the championship"
            />
          </div>
          <div>
            <label>Person 2&apos;s take</label>
            <input
              value={tm.sideBTake}
              onChange={(e) => tm.setSideBTake(e.target.value)}
              placeholder="Knicks win the championship"
            />
          </div>
        </div>
        <div className="row">
          <div>
            <label>Stake / agreed value</label>
            <input
              type="number"
              step="0.01"
              value={tm.betStake}
              onChange={(e) => tm.setBetStake(e.target.value)}
              placeholder="20"
            />
          </div>
          <div>
            <label>Creator</label>
            <input readOnly value={tm.myPlayerName || "Set your player name in People"} />
          </div>
        </div>
        <label>Notes</label>
        <textarea
          value={tm.betNotes}
          onChange={(e) => tm.setBetNotes(e.target.value)}
          placeholder="Cash, dinner, boba, punishment, etc."
        />
        <div className="actions">
          <button type="button" className="btn blue" onClick={tm.createBet}>
            Launch Market + Notify Group
          </button>
        </div>
      </div>

      <div className="card">
        <h2>Active Bet Markets</h2>
        <div className="list">
          {tm.activeBets.length ? (
            tm.activeBets.map((b) => <BetCard key={b.id} tm={tm} bet={b} />)
          ) : (
            <Empty>
              No active bet markets. Create one above or click Load Demo Data to see the Custom Live Bet at Fair
              Odds module.
            </Empty>
          )}
        </div>
      </div>

      <div className="card">
        <h2>Bet Markets History</h2>
        <p className="small leaderboardHint">
          Resolved friend-vs-friend markets — outcomes, settlements, and how the group priced each bet.
        </p>
        <div className="list">
          {tm.resolvedBets.length ? (
            tm.resolvedBets.map((b) => <BetHistoryCard key={b.id} tm={tm} bet={b} />)
          ) : (
            <Empty>No resolved bet markets yet. Resolve an active market to see it here.</Empty>
          )}
        </div>
      </div>

        </div>
        <aside className="betsAside">
          <GroupNotificationsCard notifs={tm.state.notifs} />
        </aside>
      </div>
    </section>
  );
}
