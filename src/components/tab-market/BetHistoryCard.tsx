"use client";

import type { Bet } from "@/lib/market/types";
import type { TabMarketHook } from "@/hooks/useTabMarket";

export function BetHistoryCard({ tm, bet }: { tm: TabMarketHook; bet: Bet }) {
  const m = tm.marketStats(bet);
  const pa = m.hasMarket ? Math.round(m.pa * 100) : null;
  const pb = m.hasMarket ? 100 - pa! : null;
  const stake = Number(bet.stake || 0);
  const winSide = bet.winner === "b" ? "b" : "a";
  const winnerPerson = winSide === "a" ? bet.sideAUser : bet.sideBUser;
  const loserPerson = winSide === "a" ? bet.sideBUser : bet.sideAUser;
  const winningTake = winSide === "a" ? bet.sideATake : bet.sideBTake;
  const losingTake = winSide === "a" ? bet.sideBTake : bet.sideATake;
  const winProb = winSide === "a" ? m.pa : m.pb;
  const marketPct = m.hasMarket ? Math.round(winProb * 100) : null;
  const settlement =
    stake > 0 && winnerPerson !== loserPerson
      ? m.hasMarket
        ? tm.communitySettlement(stake, winProb)
        : stake
      : null;
  const dateLabel = bet.created
    ? new Date(bet.created).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";
  const voters = Object.entries(bet.votes || {});

  return (
    <div className="item block">
      <div className="betHeader">
        <div>
          <span className="pill">Resolved</span>
          <span className="pill">{tm.money(stake)} stake</span>
          {marketPct !== null ? <span className="pill">{marketPct}% community odds</span> : null}
          {bet.creator ? <span className="pill">Creator: {bet.creator}</span> : null}
          <span className="pill">{dateLabel}</span>
          <strong>{bet.title || "Untitled Bet"}</strong>
          <div className="small">
            {bet.sideAUser} vs {bet.sideBUser}
            {bet.notes ? ` · ${bet.notes}` : ""}
          </div>
        </div>
      </div>

      <div className="payGrid">
        <div className="payBox">
          <span>Winner</span>
          <b className="pos">{winnerPerson}</b>
          <div className="small">{winningTake}</div>
        </div>
        <div className="payBox">
          <span>Loser</span>
          <b className="neg">{loserPerson}</b>
          <div className="small">{losingTake}</div>
        </div>
        <div className="payBox">
          <span>Settlement</span>
          <b>{settlement !== null ? tm.money(settlement) : "—"}</b>
          <div className="small">
            {settlement !== null
              ? m.hasMarket
                ? `${loserPerson} owed ${winnerPerson} at community price`
                : `${loserPerson} owed flat stake`
              : "No stake recorded"}
          </div>
        </div>
        <div className="payBox">
          <span>Final market</span>
          <b>{m.hasMarket ? `${pa}% / ${pb}%` : "No group odds"}</b>
          <div className="small">
            {voters.length
              ? `${voters.length} vote${voters.length === 1 ? "" : "s"} before resolve`
              : "No votes submitted"}
          </div>
        </div>
      </div>

      {voters.length ? (
        <div className="miniTable" style={{ marginTop: 12 }}>
          <div className="small" style={{ marginBottom: 8 }}>
            <strong>Group predictions</strong>
          </div>
          {voters.map(([person, v]) => {
            const probA = v.probA ?? 50;
            const pickedA = probA >= 50;
            const pickedWinner = (winSide === "a" && pickedA) || (winSide === "b" && !pickedA);
            return (
              <div key={person} className="miniRow">
                <div>
                  <strong>{person}</strong>
                  <div className="small">
                    {bet.sideAUser} {probA}% / {bet.sideBUser} {100 - probA}%
                  </div>
                </div>
                <div className={`amount ${pickedWinner ? "pos" : "neg"}`}>
                  {pickedWinner ? "Correct" : "Wrong"}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {(bet.doubleDowns || []).length ? (
        <div className="miniTable" style={{ marginTop: 12 }}>
          <div className="small" style={{ marginBottom: 8 }}>
            <strong>Custom live bets</strong>
          </div>
          {bet.doubleDowns.map((x) => (
            <div key={x.id} className="miniRow">
              <div>
                <strong>
                  {x.person} — {x.side === "yes" ? "YES" : "NO"} · {tm.money(x.stake)}
                </strong>
                <div className="small">
                  {x.note}
                  {x.resolved ? (x.won ? " · Won" : " · Lost") : " · Not resolved"}
                </div>
              </div>
              {x.resolved ? (
                <div className={`amount ${x.won ? "pos" : "neg"}`}>{x.won ? "Won" : "Lost"}</div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
