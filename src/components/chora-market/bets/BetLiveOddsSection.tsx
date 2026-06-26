"use client";

import type { Bet } from "@/lib/market/types";
import type { ChoraMarketHook } from "@/hooks/useChoraMarket";
import { Empty } from "@/components/chora-market/Empty";

export function BetLiveOddsSection({
  tm,
  bet,
  stake,
}: {
  tm: ChoraMarketHook;
  bet: Bet;
  stake: number;
}) {
  const liveDraft = tm.getLiveDraft(bet);
  const ddDraft = tm.getDdDraft(bet);
  const prob = tm.liveProbability(bet);
  const preview = tm.previewLiveBet(bet);

  const yesPct = prob === null ? "—" : Math.round(prob * 100) + "%";
  const noPct = prob === null ? "—" : Math.round((1 - prob) * 100) + "%";
  const fairYesProfit = prob === null ? "—" : tm.money(tm.fairProfit(stake, prob));
  const fairNoProfit = prob === null ? "—" : tm.money(tm.fairProfit(stake, 1 - prob));
  const fairYesPayout = prob === null ? "—" : tm.money(stake + tm.fairProfit(stake, prob));
  const fairNoPayout = prob === null ? "—" : tm.money(stake + tm.fairProfit(stake, 1 - prob));
  const summary =
    prob === null
      ? "Use this when the bet changes mid-game. Enter the current state to calculate fresh fair odds."
      : tm.liveSummary(bet);

  return (
    <div className="liveBox">
      <div className="betHeader">
        <div>
          <span className="pill">NEW</span>
          <span className="pill">Live odds</span>
          <strong>Custom Live Bet at Fair Odds</strong>
          <div className="small">{summary}</div>
        </div>
      </div>
      <div className="row3">
        <div>
          <label>Target made</label>
          <input
            type="number"
            value={liveDraft.target}
            placeholder="6"
            onChange={(e) => tm.setLiveDraft(bet.id, { target: e.target.value })}
          />
        </div>
        <div>
          <label>Total attempts</label>
          <input
            type="number"
            value={liveDraft.total}
            placeholder="15"
            onChange={(e) => tm.setLiveDraft(bet.id, { total: e.target.value })}
          />
        </div>
        <div>
          <label>Expected make % from here</label>
          <input
            type="number"
            min={1}
            max={99}
            value={liveDraft.p}
            placeholder="35"
            onChange={(e) => tm.setLiveDraft(bet.id, { p: e.target.value })}
          />
        </div>
      </div>
      <div className="row">
        <div>
          <label>Made so far</label>
          <input
            type="number"
            value={liveDraft.made}
            placeholder="5"
            onChange={(e) => tm.setLiveDraft(bet.id, { made: e.target.value })}
          />
        </div>
        <div>
          <label>Attempted so far</label>
          <input
            type="number"
            value={liveDraft.attempted}
            placeholder="13"
            onChange={(e) => tm.setLiveDraft(bet.id, { attempted: e.target.value })}
          />
        </div>
      </div>
      <div className="actions">
        <button type="button" className="btn secondary" onClick={() => tm.updateLiveOdds(bet.id)}>
          Calculate current odds
        </button>
      </div>
      <div className="liveGrid" style={{ marginTop: 12 }}>
        <div className="liveStat">
          <span>Chance YES happens</span>
          <b>{yesPct}</b>
        </div>
        <div className="liveStat">
          <span>Chance NO happens</span>
          <b>{noPct}</b>
        </div>
        <div className="liveStat">
          <span>Risk {tm.money(stake)} on YES</span>
          <b>{fairYesPayout}</b>
          <div className="small">profit {fairYesProfit}</div>
        </div>
        <div className="liveStat">
          <span>Risk {tm.money(stake)} on NO</span>
          <b>{fairNoPayout}</b>
          <div className="small">profit {fairNoProfit}</div>
        </div>
      </div>
      <div className="explain">
        <strong>Example:</strong> Joseph needs 6 made threes out of 15. He is currently 5/13. Enter target 6,
        total 15, made 5, attempted 13, and his expected make % on the remaining shots. Then choose any custom bet
        amount below to calculate the fair payout.
      </div>
      <div className="row3" style={{ marginTop: 12 }}>
        <div>
          <label>Person</label>
          <select value={ddDraft.person} onChange={(e) => tm.setDdDraft(bet.id, { person: e.target.value })}>
            {tm.state.people.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Live bet side</label>
          <select
            value={ddDraft.side}
            onChange={(e) => tm.setDdDraft(bet.id, { side: e.target.value as "yes" | "no" })}
          >
            <option value="yes">YES / it happens</option>
            <option value="no">NO / it fails</option>
          </select>
        </div>
        <div>
          <label>Custom bet amount</label>
          <input
            type="number"
            step="0.01"
            value={ddDraft.stake}
            onChange={(e) => tm.setDdDraft(bet.id, { stake: Number(e.target.value) })}
          />
        </div>
      </div>
      <div className="liveGrid" style={{ marginTop: 12 }}>
        <div className="liveStat">
          <span>Selected fair odds</span>
          <b>{preview?.odds ?? "—"}</b>
        </div>
        <div className="liveStat">
          <span>Amount risked</span>
          <b>{preview?.risk ?? "—"}</b>
        </div>
        <div className="liveStat">
          <span>Fair profit</span>
          <b>{preview?.profit ?? "—"}</b>
        </div>
        <div className="liveStat">
          <span>Total payout</span>
          <b>{preview?.payout ?? "—"}</b>
        </div>
      </div>
      <div className="actions">
        <button type="button" className="btn green" onClick={() => tm.addDoubleDown(bet.id)}>
          Add custom live bet
        </button>
      </div>
      <div className="miniTable">
        {(bet.doubleDowns || []).length ? (
          bet.doubleDowns.map((x) => (
            <div key={x.id} className="miniRow">
              <div>
                <strong>
                  {x.person} placed {tm.money(x.stake)} on{" "}
                  {x.side === "yes" ? "YES / it happens" : "NO / it fails"}
                </strong>
                <div className="small">
                  {x.note} · fair odds were {Math.round(x.prob * 100)}% · profit {tm.money(x.fairProfit)} · total
                  payout {tm.money(x.totalPayout || x.stake + x.fairProfit)}
                </div>
              </div>
              <div className="amount">{tm.money(x.totalPayout || x.stake + x.fairProfit)}</div>
            </div>
          ))
        ) : (
          <Empty>No custom live bets yet.</Empty>
        )}
      </div>
    </div>
  );
}
