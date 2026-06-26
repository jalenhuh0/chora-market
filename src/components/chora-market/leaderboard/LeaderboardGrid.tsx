"use client";

import type { ChoraMarketHook } from "@/hooks/useChoraMarket";
import type { LeaderboardConfig } from "@/components/chora-market/dashboard-leaderboards";
import { SecondaryLeaderboard } from "@/components/chora-market/leaderboard/SecondaryLeaderboard";

type Props = {
  tm: ChoraMarketHook;
  configs: LeaderboardConfig[];
};

export function LeaderboardGrid({ tm, configs }: Props) {
  if (!configs.length) return null;

  return (
    <div className="leaderboardSubGrid">
      {configs.map((config) => (
        <SecondaryLeaderboard
          key={config.title}
          title={config.title}
          hint={config.hint}
          empty={config.empty}
          rows={config.getRows(tm)}
          tm={tm}
          formatAmount={(row) => config.formatAmount(tm, row)}
          amountClass={config.amountClass}
        />
      ))}
    </div>
  );
}
