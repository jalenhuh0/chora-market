"use client";

import { useState } from "react";
import type { Bet } from "@/lib/market/types";
import { Avatar } from "@/components/Avatar";
import { findMemberForPlayer } from "@/lib/market/members";
import { useTabMarket } from "@/hooks/useTabMarket";
import type { Screen } from "@/hooks/useTabMarket";

type Props = {
  groupId: string;
  groupName: string;
  inviteCode: string;
  userId: string;
  onSignOut: () => void;
  onSwitchGroup: () => void;
};

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="empty">{children}</div>;
}

function BetHistoryCard({ tm, bet }: { tm: ReturnType<typeof useTabMarket>; bet: Bet }) {
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

function BetCard({ tm, bet }: { tm: ReturnType<typeof useTabMarket>; bet: Bet }) {
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

function SecondaryLeaderboard({
  title,
  hint,
  empty,
  rows,
  tm,
  formatAmount,
  amountClass,
}: {
  title: string;
  hint?: string;
  empty: string;
  rows: readonly (readonly [string, ...unknown[]])[];
  tm: ReturnType<typeof useTabMarket>;
  formatAmount: (row: readonly [string, ...unknown[]]) => string;
  amountClass?: (row: readonly [string, ...unknown[]]) => string;
}) {
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

function PersonLeaderboardItem({
  rank,
  person,
  personInitials,
  subtitle,
  amount,
  amountClass,
  onClick,
}: {
  rank?: number;
  person: string;
  personInitials: string;
  subtitle: string;
  amount: string;
  amountClass?: string;
  onClick: () => void;
}) {
  return (
    <div className="item clickable" onClick={onClick}>
      <div style={{ width: "100%" }}>
        <div className="personLine">
          <div className="avatar">{personInitials}</div>
          <div>
            <strong>
              {rank !== undefined ? `#${rank} ` : ""}
              {person}
            </strong>
            <div className="small">{subtitle}</div>
          </div>
        </div>
      </div>
      <div className={`amount ${amountClass || ""}`}>{amount}</div>
    </div>
  );
}

export default function TabMarketApp(props: Props) {
  const tm = useTabMarket(props);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const tabs: { id: Screen; label: string }[] = [
    { id: "dashboard", label: "Dashboard" },
    { id: "entry", label: "New IOU" },
    { id: "bets", label: "Bet Market" },
    { id: "people", label: "People" },
    { id: "settings", label: "Settings" },
  ];

  if (tm.loading) {
    return (
      <div className="app">
        <Empty>Loading group data…</Empty>
      </div>
    );
  }

  const listPeople = (arr: [string, number][], cls: "pos" | "neg") => {
    if (!arr.length) return <Empty>Nothing here yet.</Empty>;
    const max = Math.max(...arr.map((x) => x[1]), 1);
    return arr.map(([p, v], i) => (
      <div key={p} className="item clickable" onClick={() => tm.showPersonDetail(p)}>
        <div style={{ width: "100%" }}>
          <div className="personLine">
            <div className="avatar">{tm.initials(p)}</div>
            <div>
              <strong>
                #{i + 1} {p}
              </strong>
              <div className="small">
                {cls === "pos" ? "Is owed" : "Owes"} {tm.money(v)} · click for details
              </div>
            </div>
          </div>
          <div className="bar">
            <i style={{ width: `${Math.min(100, (v / max) * 100)}%` }} />
          </div>
        </div>
        <div className={`amount ${cls}`}>{tm.money(v)}</div>
      </div>
    ));
  };

  const pd = tm.personDetail;

  return (
    <div className="app">
      <div className="headerBar">
        <div className="headerBarLeft">
          <strong>{tm.localGroupName}</strong>
          <span className="pill">Invite: {tm.inviteCode}</span>
        </div>
        <div className="headerBarRight">
          <button type="button" className="btn secondary" onClick={tm.copyInviteLink}>
            Copy invite link
          </button>
          <button type="button" className="btn secondary" onClick={tm.onSwitchGroup}>
            Switch group
          </button>
          <button type="button" className="btn secondary" onClick={tm.onSignOut}>
            Sign out
          </button>
        </div>
      </div>

      <div className="top">
        <div className="brand">
          <div className="logo">CM</div>
          <div>
            <h1>{tm.state.settings.app}</h1>
            <div className="sub">Track debts, bets, IOUs, payouts, and your friend group&apos;s economy.</div>
          </div>
        </div>
        <div className="tabs">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`tab${tm.screen === t.id ? " active" : ""}`}
              onClick={() => tm.showScreen(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <section id="dashboard" className={`screen${tm.screen === "dashboard" ? " active" : ""}`}>
        <div className="metricGrid">
          <div className="metric">
            <b>{tm.money(tm.groupVolume)}</b>
            <span>Total group volume</span>
          </div>
          <div className="metric">
            <b>{tm.openDebts.length}</b>
            <span>Open IOUs</span>
          </div>
          <div className="metric">
            <b>{tm.activeBets.length}</b>
            <span>Active bets</span>
          </div>
          <div className="metric">
            <b>{tm.resolvedBets.length}</b>
            <span>Resolved bets</span>
          </div>
          <div className="metric">
            <b>{tm.state.people.length}</b>
            <span>People in group</span>
          </div>
        </div>

        <div className="card leaderboardHero" style={{ marginTop: 20 }}>
          <div className="leaderboardHeroHead">
            <h2>🏆 Best Predictor</h2>
            <p className="small">
              The group rating. Built from every resolved pick — calibration, market edge, accuracy, and track record.
              Trust the number.
            </p>
          </div>
          <div className="list">
            {tm.predictors.length ? (
              tm.predictors.map((p, i) => {
                const n = tm.totalPicks(p);
                const score = tm.predictorScore(p);
                return (
                  <PersonLeaderboardItem
                    key={p}
                    rank={i + 1}
                    person={p}
                    personInitials={tm.initials(p)}
                    subtitle={`${tm.rankForScore(tm.repScore(p))} · ${n} resolved pick${n === 1 ? "" : "s"}`}
                    amount={score.toFixed(1)}
                    amountClass={tm.predictorColor(score)}
                    onClick={() => tm.showPersonDetail(p)}
                  />
                );
              })
            ) : (
              <Empty>Resolve a bet market to unlock ratings.</Empty>
            )}
          </div>
        </div>

        <div className="leaderboardSubGrid" style={{ marginTop: 20 }}>
          <SecondaryLeaderboard
            title="📈 Highest Alpha"
            hint="Beat the group on who wins."
            empty="No alpha scored yet."
            rows={tm.alphaRows}
            tm={tm}
            formatAmount={(row) => {
              const a = row[1] as number;
              return `${a >= 0 ? "+" : ""}${(a * 100).toFixed(1)}%`;
            }}
            amountClass={(row) => ((row[1] as number) >= 0 ? "alphaGood" : "alphaBad")}
          />
          <SecondaryLeaderboard
            title="🎯 Lowest Brier Score"
            hint="Best calibrated probabilities. Lower is sharper."
            empty="No calibration data yet."
            rows={tm.brierRows}
            tm={tm}
            formatAmount={(row) => (row[1] as number).toFixed(3)}
          />
          <SecondaryLeaderboard
            title="🔥 Highest Accuracy"
            hint="Right side most often (sample-adjusted rank)."
            empty="No picks scored yet."
            rows={tm.accuracyRows}
            tm={tm}
            formatAmount={(row) => `${Math.round((row[1] as number) * 100)}%`}
            amountClass={(row) => {
              const pct = Math.round((row[1] as number) * 100);
              if (pct < 50) return "neg";
              if (pct === 50) return "accEven";
              return "pos";
            }}
          />
          <SecondaryLeaderboard
            title="🧠 Most Consistent"
            hint="Steady alpha pick after pick. Needs 2+ resolves."
            empty="Need more picks for consistency."
            rows={tm.consistencyRows}
            tm={tm}
            formatAmount={(row) => (row[1] as number).toFixed(1)}
          />
          <SecondaryLeaderboard
            title="💰 Biggest Winner"
            hint="Real W/L from resolved bet stakes only (side A vs side B). Predictors use Alpha & Best Predictor."
            empty="No resolved stake results yet."
            rows={tm.profitRows}
            tm={tm}
            formatAmount={(row) => tm.money(row[1] as number)}
            amountClass={(row) => ((row[1] as number) >= 0 ? "pos" : "neg")}
          />
          <SecondaryLeaderboard
            title="⭐ Most Improved"
            hint="Recent picks vs early picks. Needs 4+ resolves."
            empty="Need more picks to track improvement."
            rows={tm.improvedRows}
            tm={tm}
            formatAmount={(row) => {
              const d = row[1] as number;
              return `${d >= 0 ? "+" : ""}${d.toFixed(1)}%`;
            }}
            amountClass={(row) => ((row[1] as number) >= 0 ? "alphaGood" : "alphaBad")}
          />
        </div>

        <div className="grid" style={{ marginTop: 20 }}>
          <div className="card">
            <h2>{tm.state.dashboardTitles?.shame || "Hall of Shame"}</h2>
            <p className="small leaderboardHint">
              Group shame tags from People → Vote Reputation. Most votes for the worst label (
              {tm.worstLabel}) land here. Each person can only crown one GOAT and one worst tag at a time.
            </p>
            <div className="list">
              {tm.shameRows.length ? (
                tm.shameRows.map(([p, c], i) => (
                  <div key={p} className="item">
                    <div className="personLine">
                      <div className="avatar">{tm.initials(p)}</div>
                      <div>
                        <strong>
                          #{i + 1} {p}
                        </strong>
                        <div className="small">{tm.worstLabel} votes</div>
                      </div>
                    </div>
                    <div className="amount neg">{c}</div>
                  </div>
                ))
              ) : (
                <Empty>No market manipulators called out yet.</Empty>
              )}
            </div>
          </div>
          <div className="card">
            <h2>🔥 Hot Streaks</h2>
            <p className="small leaderboardHint">2+ correct picks in a row on resolved bet markets.</p>
            <div className="hotStreakList">
              {tm.hotStreaks.length ? (
                tm.hotStreaks.map(({ person, streak }) => (
                  <button
                    key={person}
                    type="button"
                    className="hotStreakChip"
                    onClick={() => tm.showPersonDetail(person)}
                  >
                    🔥 {person} is on a {streak}-pick hot streak!
                  </button>
                ))
              ) : (
                <Empty>No hot streaks right now.</Empty>
              )}
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop: 20 }}>
          <h2>Community Verdicts</h2>
          <div className="list">
            {tm.verdictRows.length ? (
              tm.verdictRows.map(([p, c]) => (
                <div key={p} className="item clickable" onClick={() => tm.showPersonDetail(p)}>
                  <div className="personLine">
                    <div className="avatar">{tm.initials(p)}</div>
                    <div>
                      <strong>{p}</strong>
                      <div className="small">
                        {tm.verdictLabel(p)} · {tm.verdictSummary(p)}
                      </div>
                    </div>
                  </div>
                  <div className={`amount ${c.good >= c.bad ? "pos" : "neg"}`}>
                    {c.good}/{c.total}
                  </div>
                </div>
              ))
            ) : (
              <Empty>No verdict votes yet.</Empty>
            )}
          </div>
        </div>

        <div className="card" style={{ marginTop: 20 }}>
          <h2>Recent Activity</h2>
          <div className="list">
            {tm.state.activity.slice(0, 10).length ? (
              tm.state.activity.slice(0, 10).map((a, i) => (
                <div key={i} className="item">
                  <div>
                    <strong>{a.title}</strong>
                    <div className="small">{a.text}</div>
                  </div>
                  <span className="pill">{a.time}</span>
                </div>
              ))
            ) : (
              <Empty>No activity yet.</Empty>
            )}
          </div>
        </div>
      </section>

      <section id="entry" className={`screen${tm.screen === "entry" ? " active" : ""}`}>
        <div className="grid">
          <div className="card">
            <h2>Create an IOU</h2>
            <label>Reason</label>
            <textarea
              value={tm.reason}
              onChange={(e) => tm.setReason(e.target.value)}
              placeholder="Example: Jake owes Sarah Cane's because he lost mini golf"
            />
            <div className="row">
              <div>
                <label>Person owed</label>
                <select value={tm.owedSelect} onChange={(e) => tm.setOwedSelect(e.target.value)}>
                  {tm.state.people.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Person who owes</label>
                <select value={tm.owesSelect} onChange={(e) => tm.setOwesSelect(e.target.value)}>
                  {tm.state.people.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="row">
              <div>
                <label>Value amount optional</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={tm.amount}
                  onChange={(e) => tm.setAmount(e.target.value)}
                  placeholder="Leave blank for AI estimate"
                />
              </div>
              <div>
                <label>Category</label>
                <select value={tm.category} onChange={(e) => tm.setCategory(e.target.value)}>
                  {tm.categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="actions">
              <button type="button" className="btn green" onClick={tm.addDebt}>
                Add to Market
              </button>
              <button type="button" className="btn secondary" onClick={tm.parseReason}>
                AI-style Parse
              </button>
            </div>
          </div>
          <div className="card">
            <h2>Open IOUs</h2>
            <div className="list">
              {tm.openDebts.length ? (
                tm.openDebts.map((d) => {
                  const unsettled = tm.iouUnsettledFor(d.created);
                  return (
                  <div key={d.id} className="item">
                    <div>
                      <span className="pill">{d.category}</span>
                      {unsettled ? (
                        <span className="pill iouAgePill">Unsettled {unsettled}</span>
                      ) : null}
                      <strong>
                        {d.owes} owes {d.owed}
                      </strong>
                      <div className="small">{d.reason}</div>
                    </div>
                    <div>
                      <div className="amount">{tm.money(d.amount)}</div>
                      <button type="button" className="btn secondary" onClick={() => tm.settleDebt(d.id)}>
                        Settle
                      </button>
                    </div>
                  </div>
                  );
                })
              ) : (
                <Empty>No open IOUs.</Empty>
              )}
            </div>
          </div>
        </div>

        <div className="grid" style={{ marginTop: 20 }}>
          <div className="card">
            <h2>{tm.state.settings.creditors}</h2>
            <div className="list">{listPeople(tm.sortedBal.filter((x) => x[1] > 0), "pos")}</div>
          </div>
          <div className="card">
            <h2>{tm.state.settings.mooches}</h2>
            <div className="list">
              {listPeople(
                [...tm.sortedBal].reverse().filter((x) => x[1] < 0).map((x) => [x[0], Math.abs(x[1])] as [string, number]),
                "neg"
              )}
            </div>
          </div>
        </div>
      </section>

      <section id="bets" className={`screen${tm.screen === "bets" ? " active" : ""}`}>
        <div className="grid">
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
                <input
                  readOnly
                  value={tm.myPlayerName || "Set your player name in People"}
                />
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
            <h2>Group Notifications</h2>
            <div className="list">
              {tm.state.notifs.slice(0, 8).length ? (
                tm.state.notifs.slice(0, 8).map((n, i) => (
                  <div key={i} className="item">
                    <div>
                      <strong>{n.title}</strong>
                      <div className="small">{n.text}</div>
                    </div>
                  </div>
                ))
              ) : (
                <Empty>No notifications yet.</Empty>
              )}
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop: 20 }}>
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

        <div className="card" style={{ marginTop: 20 }}>
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
      </section>

      <section id="people" className={`screen${tm.screen === "people" ? " active" : ""}`}>
        <div className="card" style={{ marginBottom: 20 }}>
          <h2>App Accounts &amp; Roles</h2>
          <p className="muted">
            Everyone who joins with an account is added as a player automatically. Set your ledger name when you
            create or join a group.
          </p>
          <div className="list">
            {tm.groupMembers.length ? (
              tm.groupMembers.map((m) => {
                const isYou = m.user_id === tm.userId;
                const label =
                  m.display_name || m.ledger_name || m.email || `User ${m.user_id.slice(0, 6)}`;
                const roleLabel = m.role === "owner" ? "Owner / Admin" : "Member";
                return (
                  <div key={m.user_id} className="item">
                    <div className="personLine">
                      <Avatar url={m.avatar_url} name={label} />
                      <div>
                        <strong>
                          {label}
                          {isYou ? " (you)" : ""}
                        </strong>
                        <span
                          className={`roleBadge ${m.role === "owner" ? "roleOwner" : "roleMember"}`}
                        >
                          {roleLabel}
                        </span>
                        <div className="small">
                          {m.email ? `${m.email} · ` : ""}
                          Ledger name: {m.ledger_name || "—"}
                          {m.role === "owner" ? " · Can manage group settings" : " · Can vote & participate"}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <Empty>No app accounts loaded yet.</Empty>
            )}
          </div>
        </div>

        <div className="card">
          <h2>Players</h2>
          <p className="muted">
            Group members appear here automatically. Names are used for IOUs, bets, and leaderboards. You can rename
            only your own player name.
          </p>
          {tm.myPlayerName && (
            <div className="actions" style={{ marginBottom: 16 }}>
              <button type="button" className="btn secondary" onClick={tm.renameMyPlayer}>
                Rename my player ({tm.myPlayerName})
              </button>
            </div>
          )}
          <div className="list">
            {tm.state.people.length ? (
              tm.state.people.map((p) => {
                const st = tm.state.stats[p] || { correct: 0, wrong: 0, profit: 0, elo: 1000 };
                const totalP = st.correct + st.wrong;
                const acc = totalP ? Math.round((st.correct / totalP) * 100) : 0;
                const rep = tm.repScore(p);
                const alpha = tm.alphaPct(p);
                const linked = findMemberForPlayer(tm.groupMembers, p);
                const linkedAvatar = linked?.avatar_url;
                return (
                  <div key={p} className="item clickable" onClick={() => tm.showPersonDetail(p)}>
                    <div className="personLine">
                      <Avatar url={linkedAvatar} name={p} />
                      <div>
                        <strong>{p}</strong>
                        {linked ? (
                          <span
                            className={`roleBadge ${linked.role === "owner" ? "roleOwner" : "roleMember"}`}
                          >
                            {linked.role === "owner" ? "Owner / Admin" : "Member"}
                          </span>
                        ) : null}
                        <div className="rankBadge">{tm.rankForScore(rep)}</div>
                        <div className="small">
                          Rep {rep} · {tm.verdictLabel(p)} · Alpha{" "}
                          <span className={alpha >= 0 ? "alphaGood" : "alphaBad"}>
                            {(alpha * 100).toFixed(1)}%
                          </span>{" "}
                          · Accuracy {acc}% · click for details
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <Empty>No players yet. Members appear here when they join the group.</Empty>
            )}
          </div>
        </div>

        <div className="grid" style={{ marginTop: 20 }}>
          <div className="card">
            <h2>Friend Allegations</h2>
            <p className="muted">
              Joke-only community tags. Call out fake gurus, sharks, mooches, and market manipulators.
            </p>
            <div className="list">
              {tm.state.people.map((p) => {
                const tags = tm.counts[p] || {};
                const tagHtml = Object.entries(tags)
                  .sort((a, b) => b[1] - a[1])
                  .map(([k, v]) => (
                    <span key={k} className="pill">
                      {k} ({v})
                    </span>
                  ));
                return (
                  <div key={p} className="item block">
                    <div className="personLine">
                      <div className="avatar">{tm.initials(p)}</div>
                      <div>
                        <strong>{p}</strong>
                        <div className="small">{tagHtml.length ? tagHtml : "No allegations yet."}</div>
                      </div>
                    </div>
                    <div className="tagGrid">
                      {(tm.state.scale || []).map((t) => (
                        <button
                          key={t.label}
                          type="button"
                          className="tagBtn"
                          onClick={() => tm.quickTag(p, t.label)}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="card">
            <h2>Vote Reputation</h2>
            <p className="muted">
              Each person can rate each friend. Your GOAT vote and worst-title vote are exclusive, so you can only
              crown one GOAT and one Giga Scammer at a time.
            </p>
            <label>Who are we rating?</label>
            <select value={tm.tagPerson} onChange={(e) => tm.setTagPerson(e.target.value)}>
              {tm.state.people.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
            <label>Rating</label>
            <select value={tm.tagName} onChange={(e) => tm.setTagName(e.target.value)}>
              {(tm.state.scale || []).map((s) => (
                <option key={s.label}>{s.label}</option>
              ))}
            </select>
            <label>Your name</label>
            <select value={tm.tagVoter} onChange={(e) => tm.setTagVoter(e.target.value)}>
              {tm.state.people.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
            <div className="actions">
              <button type="button" className="btn purple" onClick={tm.castTag}>
                Cast / Change Vote
              </button>
            </div>
          </div>
          <div className="card">
            <h2>Community Verdict Vote</h2>
            <p className="muted">
              For someone with good accuracy/alpha: are they legit, or just running hot?
            </p>
            <label>Who are we judging?</label>
            <select value={tm.verdictPerson} onChange={(e) => tm.setVerdictPerson(e.target.value)}>
              {tm.state.people.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
            <label>Verdict</label>
            <select value={tm.verdictChoice} onChange={(e) => tm.setVerdictChoice(e.target.value)}>
              <option value="good">{tm.state.verdictLabels.good}</option>
              <option value="bad">{tm.state.verdictLabels.bad}</option>
            </select>
            <label>Your name</label>
            <select value={tm.verdictVoter} onChange={(e) => tm.setVerdictVoter(e.target.value)}>
              {tm.state.people.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
            <div className="actions">
              <button type="button" className="btn blue" onClick={tm.castVerdictVote}>
                Cast / Change Verdict
              </button>
            </div>
          </div>
        </div>
      </section>

      <section id="settings" className={`screen${tm.screen === "settings" ? " active" : ""}`}>
        <div className="split">
          <div className="card">
            <h2>Account Profile</h2>
            <div className="avatarUploadRow">
              <Avatar
                url={tm.avatarUrl}
                name={tm.displayName || tm.profile?.display_name || "You"}
                size={64}
              />
              <div className="avatarUploadMeta">
                <label>Profile photo</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  disabled={tm.avatarUploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) tm.uploadProfilePhoto(file);
                    e.target.value = "";
                  }}
                />
                <div className="small">
                  {tm.avatarUploading ? "Uploading…" : "JPG, PNG, GIF, or WebP · max 5 MB"}
                </div>
              </div>
            </div>
            <label>Display name</label>
            <input value={tm.displayName} onChange={(e) => tm.setDisplayName(e.target.value)} placeholder="Your name" />
            <div className="toggleRow">
              <label htmlFor="notifyEnabled">Enable notifications</label>
              <input
                id="notifyEnabled"
                type="checkbox"
                checked={tm.notifyEnabled}
                onChange={(e) => tm.setNotifyEnabled(e.target.checked)}
              />
            </div>
            <div className="toggleRow">
              <label htmlFor="notifyBets">Bet notifications</label>
              <input
                id="notifyBets"
                type="checkbox"
                checked={tm.notifyBets}
                onChange={(e) => tm.setNotifyBets(e.target.checked)}
              />
            </div>
            <div className="toggleRow">
              <label htmlFor="notifyIous">IOU notifications</label>
              <input
                id="notifyIous"
                type="checkbox"
                checked={tm.notifyIous}
                onChange={(e) => tm.setNotifyIous(e.target.checked)}
              />
            </div>
            <div className="toggleRow">
              <label htmlFor="notifyInvites">Invite notifications</label>
              <input
                id="notifyInvites"
                type="checkbox"
                checked={tm.notifyInvites}
                onChange={(e) => tm.setNotifyInvites(e.target.checked)}
              />
            </div>
            <div className="actions">
              <button type="button" className="btn green" onClick={tm.saveProfile}>
                Save Profile
              </button>
            </div>
            <hr style={{ margin: "24px 0", border: "none", borderTop: "1px solid var(--line)" }} />
            <h2 style={{ marginBottom: 8 }}>Password</h2>
            <p className="small muted" style={{ marginBottom: 12 }}>
              Change your sign-in password while logged in.
            </p>
            <label>New password</label>
            <input
              type="password"
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete="new-password"
            />
            <label>Confirm new password</label>
            <input
              type="password"
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Same as above"
              autoComplete="new-password"
            />
            <div className="actions">
              <button
                type="button"
                className="btn secondary"
                onClick={async () => {
                  const ok = await tm.changePassword(newPassword, confirmPassword);
                  if (ok) {
                    setNewPassword("");
                    setConfirmPassword("");
                  }
                }}
              >
                Update password
              </button>
            </div>
          </div>

          <div className="card">
            <h2>Group Settings</h2>
            <label>Group name</label>
            <input value={tm.groupRename} onChange={(e) => tm.setGroupRename(e.target.value)} />
            <div className="actions">
              <button type="button" className="btn green" onClick={tm.saveGroupName}>
                Save Group Name
              </button>
            </div>
          </div>

          <div className="card">
            <h2>Customize Names</h2>
            <label>App name</label>
            <input value={tm.setAppName} onChange={(e) => tm.setSetAppName(e.target.value)} />
            <label>Creditor leaderboard title</label>
            <input value={tm.setCredTitle} onChange={(e) => tm.setSetCredTitle(e.target.value)} />
            <label>Mooch leaderboard title</label>
            <input value={tm.setMoochTitle} onChange={(e) => tm.setSetMoochTitle(e.target.value)} />
            <label>Profit/Loss leaderboard title</label>
            <input value={tm.setProfitTitle} onChange={(e) => tm.setSetProfitTitle(e.target.value)} />
            <label>Hall of Shame title</label>
            <input value={tm.setShameTitle} onChange={(e) => tm.setSetShameTitle(e.target.value)} />
            <div className="actions">
              <button type="button" className="btn green" onClick={tm.saveSettings}>
                Save Names
              </button>
            </div>
          </div>

          <div className="card">
            <h2>Customize Community Verdicts</h2>
            <p className="muted">
              For high-alpha/high-accuracy players, let the group vote whether they are actually respectable or just
              lucky.
            </p>
            <div className="row">
              <div>
                <label>Positive verdict</label>
                <input value={tm.verdictGood} onChange={(e) => tm.setVerdictGood(e.target.value)} />
              </div>
              <div>
                <label>Negative verdict</label>
                <input value={tm.verdictBad} onChange={(e) => tm.setVerdictBad(e.target.value)} />
              </div>
            </div>
            <div className="actions">
              <button type="button" className="btn green" onClick={tm.saveVerdicts}>
                Save Verdicts
              </button>
              <button type="button" className="btn secondary" onClick={tm.resetVerdicts}>
                Reset Verdicts
              </button>
            </div>
          </div>

          <div className="card">
            <h2>Customize Rank Titles</h2>
            <p className="muted">These cosmetic rank titles are based on Elo-style reputation score.</p>
            {tm.rankInputs.map((r, i) => (
              <div key={i} className="row">
                <div>
                  <label>{`Rank ${i + 1} title`}</label>
                  <input
                    value={r.title}
                    onChange={(e) => {
                      const next = [...tm.rankInputs];
                      next[i] = { ...next[i], title: e.target.value };
                      tm.setRankInputs(next);
                    }}
                  />
                </div>
                <div>
                  <label>Minimum score</label>
                  <input
                    type="number"
                    value={r.min}
                    onChange={(e) => {
                      const next = [...tm.rankInputs];
                      next[i] = { ...next[i], min: Number(e.target.value) };
                      tm.setRankInputs(next);
                    }}
                  />
                </div>
              </div>
            ))}
            <div className="actions">
              <button type="button" className="btn green" onClick={tm.saveRankTitles}>
                Save Rank Titles
              </button>
              <button type="button" className="btn secondary" onClick={tm.resetRankTitles}>
                Reset Rank Titles
              </button>
            </div>
          </div>

          <div className="card">
            <h2>Reputation Formula</h2>
            <p className="muted">
              Each vote is equal weight. A 60% vote means 60 points to one friend and 40 points to the other.
              Reputation is cosmetic for credibility, jokes, and profiles; it does not change market odds.
            </p>
            <div className="small">Reputation is cosmetic only. Market odds use equal-weight probability splits.</div>
          </div>

          <div className="card dangerZone">
            <h2>Demo / Reset</h2>
            <p className="muted">Load demo data to test the app, or reset everything stored for this group.</p>
            <div className="actions">
              <button type="button" className="btn secondary" onClick={tm.loadDemoData}>
                Load Demo Data
              </button>
              <button type="button" className="btn red" onClick={tm.resetData}>
                Reset App
              </button>
            </div>
          </div>
        </div>
      </section>

      <div
        id="personModal"
        className={`modalOverlay${tm.personModal ? " show" : ""}`}
        onClick={(e) => {
          if ((e.target as HTMLElement).id === "personModal") tm.closePersonDetail();
        }}
      >
        <div className="modal">
          {pd && (
            <div id="personDetail">
              <div className="modalTop">
                <div>
                  <div className="personLine">
                    <div className="avatar">{tm.initials(pd.person)}</div>
                    <div>
                      <h2 style={{ margin: 0 }}>{pd.person}</h2>
                      <div className="small">Detailed market position</div>
                    </div>
                  </div>
                </div>
                <button type="button" className="closeBtn" onClick={tm.closePersonDetail}>
                  Close
                </button>
              </div>

              <div className="detailGrid">
                <div className="detailStat">
                  <span>Net position</span>
                  <b className={pd.data.net >= 0 ? "pos" : "neg"}>{tm.money(pd.data.net)}</b>
                </div>
                <div className="detailStat">
                  <span>People owe them</span>
                  <b className="pos">{tm.money(pd.data.owedToMeTotal)}</b>
                </div>
                <div className="detailStat">
                  <span>They owe others</span>
                  <b className="neg">{tm.money(pd.data.iOweTotal)}</b>
                </div>
                <div className="detailStat">
                  <span>Prediction record</span>
                  <b>{pd.acc}%</b>
                  <div className="small">
                    {pd.st.correct || 0} correct · {pd.st.wrong || 0} wrong · Bet stake W/L{" "}
                    {tm.money(pd.st.profit || 0)}
                  </div>
                </div>
                <div className="detailStat">
                  <span>Current streak</span>
                  <b className={pd.streak >= 2 ? "pos" : pd.streak === 0 && pd.games > 0 ? "neg" : "accEven"}>
                    {pd.streak > 0 ? `${pd.streak} correct in a row` : pd.games > 0 ? "No active streak" : "—"}
                  </b>
                  <div className="small">
                    {pd.streak >= 2
                      ? "On a hot streak right now"
                      : pd.streak === 1
                        ? "One correct pick — keep going"
                        : "Most recent resolved pick missed"}
                  </div>
                </div>
                <div className="detailStat">
                  <span>Market Alpha</span>
                  <b className={tm.alphaPct(pd.person) >= 0 ? "pos" : "neg"}>
                    {(tm.alphaPct(pd.person) * 100).toFixed(1)}%
                  </b>
                  <div className="small">
                    Avg edge vs group on winners · Calibration {tm.calibrationGrade(pd.person)} · Rank{" "}
                    {tm.rankForScore(tm.repScore(pd.person))}
                  </div>
                </div>
                <div className="detailStat">
                  <span>Community Verdict</span>
                  <b>{tm.verdictLabel(pd.person)}</b>
                  <div className="small">{tm.verdictSummary(pd.person)}</div>
                </div>
              </div>

              <div className="card" style={{ marginTop: 14, boxShadow: "none" }}>
                <h2>Ranking Tie-Breakers</h2>
                <div className="miniTable">
                  <div className="miniRow">
                    <div>
                      <strong>Wilson Accuracy</strong>
                      <div className="small">
                        Accuracy adjusted for sample size, so 2/2 does not outrank 50/70 unfairly.
                      </div>
                    </div>
                    <div className="amount">
                      {(tm.wilsonLowerBound(pd.st.correct || 0, pd.games) * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="miniRow">
                    <div>
                      <strong>Brier / Calibration</strong>
                      <div className="small">Lower is better. Penalizes being confidently wrong.</div>
                    </div>
                    <div className="amount">{tm.brierScore(pd.person).toFixed(3)}</div>
                  </div>
                  <div className="miniRow">
                    <div>
                      <strong>Overall Predictor Score</strong>
                      <div className="small">40% alpha, 30% calibration, 20% accuracy, 10% sample size.</div>
                    </div>
                    <div className="amount">{tm.predictorScore(pd.person).toFixed(1)}</div>
                  </div>
                  <div className="miniRow">
                    <div>
                      <strong>Overall Ranking Score</strong>
                      <div className="small">Used only to break ties in leaderboards.</div>
                    </div>
                    <div className="amount">{tm.rankingScore(pd.person, "overall").toFixed(3)}</div>
                  </div>
                </div>
              </div>

              <div className="card" style={{ marginTop: 14, boxShadow: "none" }}>
                <h2>Breakdown by Person</h2>
                <div className="miniTable">
                  {pd.relationships.length ? (
                    pd.relationships.map(([other, v]) => {
                      const net = v.owesMe - v.iOwe;
                      const label = net >= 0 ? `${other} owes ${pd.person}` : `${pd.person} owes ${other}`;
                      return (
                        <div key={other} className="miniRow">
                          <div>
                            <strong>{label}</strong>
                            <div className="small">
                              {v.items.length} open item{v.items.length === 1 ? "" : "s"}
                            </div>
                          </div>
                          <div className={`amount ${net >= 0 ? "pos" : "neg"}`}>{tm.money(Math.abs(net))}</div>
                        </div>
                      );
                    })
                  ) : (
                    <Empty>No open relationships.</Empty>
                  )}
                </div>
              </div>

              <div className="card" style={{ marginTop: 14, boxShadow: "none" }}>
                <h2>Open IOU Details</h2>
                <div style={{ marginBottom: 10 }}>
                  {Object.entries(pd.data.categoryTotals).sort((a, b) => b[1] - a[1]).length ? (
                    Object.entries(pd.data.categoryTotals)
                      .sort((a, b) => b[1] - a[1])
                      .map(([c, v]) => (
                        <span key={c} className="pill">
                          {c}: {tm.money(v)}
                        </span>
                      ))
                  ) : (
                    <span className="pill">No categories yet</span>
                  )}
                </div>
                <div className="miniTable">
                  {pd.items.length ? (
                    pd.items.map((d) => {
                      const unsettled = tm.iouUnsettledFor(d.created);
                      return (
                      <div key={d.id} className="miniRow">
                        <div>
                          <span className="pill">{d.category}</span>
                          {unsettled ? (
                            <span className="pill iouAgePill">Unsettled {unsettled}</span>
                          ) : null}
                          <strong>{d.dir}</strong>
                          <div className="small">{d.reason}</div>
                        </div>
                        <div className={`amount ${d.cls}`}>{tm.money(d.amount)}</div>
                      </div>
                      );
                    })
                  ) : (
                    <Empty>No open IOUs.</Empty>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div id="toast" className={`toast${tm.toast ? " show" : ""}`}>
        {tm.toast && (
          <>
            <strong>Notification</strong>
            <div className="small">{tm.toast}</div>
          </>
        )}
      </div>
    </div>
  );
}
