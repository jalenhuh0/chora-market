"use client";

import type { ChoraMarketHook } from "@/hooks/useChoraMarket";
import { Empty } from "@/components/chora-market/Empty";
import { PersonLeaderboardItem } from "@/components/chora-market/leaderboard/PersonLeaderboardItem";

type SecondaryLeaderboardProps = {
  title: string;
  hint?: string;
  empty: string;
  rows: readonly (readonly [string, ...unknown[]])[];
  tm: ChoraMarketHook;
  formatAmount: (row: readonly [string, ...unknown[]]) => string;
  amountClass?: (row: readonly [string, ...unknown[]]) => string;
};

export function SecondaryLeaderboard({
  title,
  hint,
  empty,
  rows,
  tm,
  formatAmount,
  amountClass,
}: SecondaryLeaderboardProps) {
  const top = rows.slice(0, 5);
  return (
    <div className="card leaderboardSub">
      <h2>{title}</h2>
      {hint ? <p className="small leaderboardHint">{hint}</p> : null}
      <div className="list">
        {top.length ? (
          top.map((row, i) => {
            const person = row[0] as string;
            return (
              <PersonLeaderboardItem
                key={person}
                rank={i + 1}
                person={person}
                personInitials={tm.initials(person)}
                subtitle={`${tm.totalPicks(person)} picks`}
                amount={formatAmount(row)}
                amountClass={amountClass?.(row)}
                onClick={() => tm.showPersonDetail(person)}
              />
            );
          })
        ) : (
          <Empty>{empty}</Empty>
        )}
      </div>
    </div>
  );
}
