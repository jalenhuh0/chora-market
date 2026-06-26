"use client";

import type { Bet } from "@/lib/market/types";
import type { ChoraMarketHook } from "@/hooks/useChoraMarket";

type MarketStats = ReturnType<ChoraMarketHook["marketStats"]>;

export function BetPayGrid({
  tm,
  bet,
  m,
  pa,
  pb,
  stake,
}: {
  tm: ChoraMarketHook;
  bet: Bet;
  m: MarketStats;
  pa: number | null;
  pb: number | null;
  stake: number;
}) {
  const fairA = m.hasMarket ? tm.fairProfit(stake, m.pa) : 0;
  const fairB = m.hasMarket ? tm.fairProfit(stake, m.pb) : 0;
  const settleA = m.hasMarket ? tm.communitySettlement(stake, m.pa) : null;
  const settleB = m.hasMarket ? tm.communitySettlement(stake, m.pb) : null;

  return (
    <div className="payGrid">
      <div className="payBox">
        <span>Community market</span>
        <b>{m.hasMarket ? `${pa}% / ${pb}%` : "Awaiting group odds"}</b>
        <div className="small">
          {m.hasMarket
            ? `${m.voteCount} group vote${m.voteCount === 1 ? "" : "s"} — equal weight`
            : "Submit odds to price this bet"}
        </div>
      </div>
      <div className="payBox">
        <span>If {bet.sideAUser} wins</span>
        <b>{settleA !== null ? tm.money(settleA) : "—"}</b>
        <div className="small">
          {m.hasMarket
            ? `${tm.money(fairA)} profit at ${pa}% community odds`
            : "Community settlement pending"}
        </div>
      </div>
      <div className="payBox">
        <span>If {bet.sideBUser} wins</span>
        <b>{settleB !== null ? tm.money(settleB) : "—"}</b>
        <div className="small">
          {m.hasMarket
            ? `${tm.money(fairB)} profit at ${pb}% community odds`
            : "Community settlement pending"}
        </div>
      </div>
      <div className="payBox">
        <span>On resolve</span>
        <b>{m.hasMarket ? "Community IOU" : "Flat stake IOU"}</b>
        <div className="small">
          {m.hasMarket
            ? "Loser owes winner the community-priced total above"
            : "No odds yet — loser owes flat stake only"}
        </div>
      </div>
    </div>
  );
}
