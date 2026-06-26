"use client";

import type { Bet } from "@/lib/market/types";
import type { ChoraMarketHook } from "@/hooks/useChoraMarket";
import { BetLiveOddsSection } from "@/components/chora-market/bets/BetLiveOddsSection";
import { BetPayGrid } from "@/components/chora-market/bets/BetPayGrid";
import { BetVoteSide } from "@/components/chora-market/bets/BetVoteSide";

export function BetCard({ tm, bet }: { tm: ChoraMarketHook; bet: Bet }) {
  const m = tm.marketStats(bet);
  const pa = m.hasMarket ? Math.round(m.pa * 100) : null;
  const pb = m.hasMarket ? 100 - pa! : null;
  const stake = Number(bet.stake || 20);
  const votes =
    Object.entries(bet.votes || {})
      .map(
        ([p, v]) =>
          `${p}: ${bet.sideAUser} ${v.probA ?? 50}% / ${bet.sideBUser} ${100 - (v.probA ?? 50)}%`
      )
      .join(", ") || "none yet";

  return (
    <div className="item block">
      <div className="betHeader">
        <div>
          <span className="pill">{tm.money(stake)} stake</span>
          <span className="pill">{m.voteCount} market votes</span>
          <span className="pill">{tm.missingVoters(bet).length} not voted</span>
          {bet.creator ? <span className="pill">Creator: {bet.creator}</span> : null}
          <strong>{bet.title || "Untitled Bet"}</strong>
          <div className="small">
            Original bet: {bet.sideAUser} vs {bet.sideBUser}. {bet.notes || "No notes."}
          </div>
        </div>
        <div className="betHeaderActions">
          {bet.creator === tm.myPlayerName && (!bet.status || bet.status === "open") ? (
            <button type="button" className="btn red" onClick={() => tm.deleteBet(bet.id)}>
              Delete
            </button>
          ) : null}
          <button type="button" className="btn secondary" onClick={() => tm.resolveBet(bet.id)}>
            Resolve
          </button>
        </div>
      </div>

      <div className="row">
        <BetVoteSide tm={tm} bet={bet} side="a" pa={pa} pb={pb} hasMarket={m.hasMarket} />
        <BetVoteSide tm={tm} bet={bet} side="b" pa={pa} pb={pb} hasMarket={m.hasMarket} />
      </div>

      <BetPayGrid tm={tm} bet={bet} m={m} pa={pa} pb={pb} stake={stake} />
      <BetLiveOddsSection tm={tm} bet={bet} stake={stake} />

      <div className="small" style={{ marginTop: 12 }}>
        Market votes: {votes}
      </div>
    </div>
  );
}
