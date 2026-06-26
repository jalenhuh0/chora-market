"use client";

import type { Bet } from "@/lib/market/types";
import type { TabMarketHook } from "@/hooks/useTabMarket";
import { Empty } from "@/components/tab-market/Empty";

export function BetCard({ tm, bet }: { tm: TabMarketHook; bet: Bet }) {
  const m = tm.marketStats(bet);
  const pa = m.hasMarket ? Math.round(m.pa * 100) : null;
  const pb = m.hasMarket ? 100 - pa! : null;
  const stake = Number(bet.stake || 20);
  const fairA = m.hasMarket ? tm.fairProfit(stake, m.pa) : 0;
  const fairB = m.hasMarket ? tm.fairProfit(stake, m.pb) : 0;
  const settleA = m.hasMarket ? tm.communitySettlement(stake, m.pa) : null;
  const settleB = m.hasMarket ? tm.communitySettlement(stake, m.pb) : null;
  const votes = Object.entries(bet.votes || {})
    .map(([p, v]) => `${p}: ${bet.sideAUser} ${v.probA ?? 50}% / ${bet.sideBUser} ${100 - (v.probA ?? 50)}%`)
    .join(", ") || "none yet";

  const draftA = tm.getVoteDraft(bet.id, "a");
  const draftB = tm.getVoteDraft(bet.id, "b");
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
        <div className="marketChoice">
          <div className="sideTitle">Back {bet.sideAUser}</div>
          <div className="take">{bet.sideATake}</div>
          <div className="odds">{pa !== null ? `${pa}%` : "—"}</div>
          <div className="bar">
            <i style={{ width: `${pa ?? 50}%`, opacity: m.hasMarket ? 1 : 0.25 }} />
          </div>
          <label>Voter</label>
          <select
            value={draftA.voter || tm.state.people[0] || ""}
            onChange={(e) => tm.setVoteDraft(bet.id, "a", { voter: e.target.value })}
          >
            {tm.state.people.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
          <label>Chance {bet.sideAUser} is right</label>
          <input
            type="number"
            min={1}
            max={99}
            value={draftA.conf}
            onChange={(e) => tm.setVoteDraft(bet.id, "a", { conf: Number(e.target.value) })}
          />
          <div className="small">
            {bet.sideAUser}: {draftA.conf}% · {bet.sideBUser}: {100 - draftA.conf}%
          </div>
          <div className="actions">
            <button type="button" className="btn green" onClick={() => tm.voteBet(bet.id, "a")}>
              Submit odds
            </button>
          </div>
        </div>

        <div className="marketChoice">
          <div className="sideTitle">Back {bet.sideBUser}</div>
          <div className="take">{bet.sideBTake}</div>
          <div className="odds">{pb !== null ? `${pb}%` : "—"}</div>
          <div className="bar">
            <i style={{ width: `${pb ?? 50}%`, opacity: m.hasMarket ? 1 : 0.25 }} />
          </div>
          <label>Voter</label>
          <select
            value={draftB.voter || tm.state.people[0] || ""}
            onChange={(e) => tm.setVoteDraft(bet.id, "b", { voter: e.target.value })}
          >
            {tm.state.people.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
          <label>Chance {bet.sideBUser} is right</label>
          <input
            type="number"
            min={1}
            max={99}
            value={draftB.conf}
            onChange={(e) => tm.setVoteDraft(bet.id, "b", { conf: Number(e.target.value) })}
          />
          <div className="small">
            {bet.sideBUser}: {draftB.conf}% · {bet.sideAUser}: {100 - draftB.conf}%
          </div>
          <div className="actions">
            <button type="button" className="btn blue" onClick={() => tm.voteBet(bet.id, "b")}>
              Submit odds
            </button>
          </div>
        </div>
      </div>

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
            <select
              value={ddDraft.person}
              onChange={(e) => tm.setDdDraft(bet.id, { person: e.target.value })}
            >
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

      <div className="small" style={{ marginTop: 12 }}>
        Market votes: {votes}
      </div>
    </div>
  );
}
