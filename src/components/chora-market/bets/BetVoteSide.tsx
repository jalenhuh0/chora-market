"use client";

import type { Bet } from "@/lib/market/types";
import type { ChoraMarketHook } from "@/hooks/useChoraMarket";

export function BetVoteSide({
  tm,
  bet,
  side,
  pa,
  pb,
  hasMarket,
}: {
  tm: ChoraMarketHook;
  bet: Bet;
  side: "a" | "b";
  pa: number | null;
  pb: number | null;
  hasMarket: boolean;
}) {
  const isA = side === "a";
  const person = isA ? bet.sideAUser : bet.sideBUser;
  const take = isA ? bet.sideATake : bet.sideBTake;
  const odds = isA ? pa : pb;
  const barWidth = isA ? pa ?? 50 : pb ?? 50;
  const draft = tm.getVoteDraft(bet.id, side);
  const otherPerson = isA ? bet.sideBUser : bet.sideAUser;
  const btnClass = isA ? "btn green" : "btn blue";

  return (
    <div className="marketChoice">
      <div className="sideTitle">Back {person}</div>
      <div className="take">{take}</div>
      <div className="odds">{odds !== null ? `${odds}%` : "—"}</div>
      <div className="bar">
        <i style={{ width: `${barWidth}%`, opacity: hasMarket ? 1 : 0.25 }} />
      </div>
      <label>Voter</label>
      <select
        value={draft.voter || tm.state.people[0] || ""}
        onChange={(e) => tm.setVoteDraft(bet.id, side, { voter: e.target.value })}
      >
        {tm.state.people.map((p) => (
          <option key={p}>{p}</option>
        ))}
      </select>
      <label>Chance {person} is right</label>
      <input
        type="number"
        min={1}
        max={99}
        value={draft.conf}
        onChange={(e) => tm.setVoteDraft(bet.id, side, { conf: Number(e.target.value) })}
      />
      <div className="small">
        {person}: {draft.conf}% · {otherPerson}: {100 - draft.conf}%
      </div>
      <div className="actions">
        <button type="button" className={btnClass} onClick={() => tm.voteBet(bet.id, side)}>
          Submit odds
        </button>
      </div>
    </div>
  );
}
