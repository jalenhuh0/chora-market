"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  communitySettlement,
  fairProfit,
  liveProbability,
  liveSummary,
  marketAlphaDelta,
  marketStats,
  marketStatsExcluding,
  missingVoters,
  reputationDelta,
} from "@/lib/market/calculations";
import { clamp, money, uid } from "@/lib/market/defaults";
import { getMyPlayerName } from "@/lib/market/members";
import type { Bet } from "@/lib/market/types";
import { nowTime } from "@/hooks/chora-market/helpers";
import type { ChoraMarketCore } from "@/hooks/chora-market/useChoraMarketCore";
import type { DoubleDownDraft, LiveDraft, VoteDraft } from "@/hooks/chora-market/types";

export function useBets(core: ChoraMarketCore) {
  const { state, stateRef, groupMembers, userId, saveWithActivity, showToast, setScreen } = core;

  const [betTitle, setBetTitle] = useState("");
  const [sideAUser, setSideAUser] = useState("");
  const [sideBUser, setSideBUser] = useState("");
  const [sideATake, setSideATake] = useState("");
  const [sideBTake, setSideBTake] = useState("");
  const [betStake, setBetStake] = useState("");
  const [betNotes, setBetNotes] = useState("");
  const [voteDrafts, setVoteDrafts] = useState<Record<string, { a: VoteDraft; b: VoteDraft }>>({});
  const [liveDrafts, setLiveDrafts] = useState<Record<string, LiveDraft>>({});
  const [ddDrafts, setDdDrafts] = useState<Record<string, DoubleDownDraft>>({});
  const didInit = useRef(false);

  useEffect(() => {
    didInit.current = false;
  }, [core.groupId]);

  useEffect(() => {
    if (core.loading || didInit.current) return;
    didInit.current = true;
    if (core.state.people.length) {
      setSideAUser(core.state.people[0]);
      setSideBUser(core.state.people[1] || core.state.people[0]);
    }
  }, [core.loading, core.state.people, core.groupId]);

  const createBet = useCallback(async () => {
    const title = betTitle.trim();
    if (!title) return showToast("Add a bet title first.");
    if (sideAUser === sideBUser) return showToast("Pick two different people.");
    const creator = getMyPlayerName(groupMembers, userId);
    if (!creator) return showToast("Set your player name in People before creating a bet.");
    await saveWithActivity(
      (s) => {
        const bet: Bet = {
          id: uid(),
          title,
          sideAUser,
          sideBUser,
          sideATake: sideATake || "Take A",
          sideBTake: sideBTake || "Take B",
          creator,
          stake: Number(betStake || 20),
          notes: betNotes,
          status: "open",
          votes: {},
          doubleDowns: [],
          created: Date.now(),
        };
        s.bets.unshift(bet);
        s.notifs.unshift({
          title: "New friend bet market",
          text: `${bet.sideAUser} vs ${bet.sideBUser}: ${bet.title}. Group can submit odds now.`,
        });
      },
      {
        title: "Bet market launched",
        text: `${sideAUser} backs "${sideATake || "Take A"}" vs ${sideBUser} backs "${sideBTake || "Take B"}"`,
      }
    );
    setBetTitle("");
    setSideATake("");
    setSideBTake("");
    setBetStake("");
    setBetNotes("");
    setScreen("bets");
    showToast("Active bet market created.");
  }, [betTitle, sideAUser, sideBUser, sideATake, sideBTake, groupMembers, userId, betStake, betNotes, saveWithActivity, showToast, setScreen]);

  const deleteBet = useCallback(
    async (betId: string) => {
      const b = stateRef.current.bets.find((x) => x.id === betId);
      if (!b) return;
      const myName = getMyPlayerName(groupMembers, userId);
      if (!myName || b.creator !== myName) {
        showToast("Only the bet creator can delete this market.");
        return;
      }
      if (b.status && b.status !== "open") {
        showToast("Resolved bets cannot be deleted.");
        return;
      }
      if (!confirm(`Delete "${b.title || "Untitled Bet"}"? This cannot be undone.`)) return;

      await saveWithActivity(
        (s) => {
          s.bets = s.bets.filter((x) => x.id !== betId);
          s.notifs.unshift({
            title: "Bet market deleted",
            text: `${myName} removed ${b.title || "a bet market"}.`,
          });
        },
        {
          title: "Bet market deleted",
          text: `${b.title || "Untitled Bet"} was removed by ${myName}.`,
        }
      );
      showToast("Bet market deleted.");
    },
    [groupMembers, userId, saveWithActivity, showToast, stateRef]
  );

  const defaultVoteVoter = useCallback(
    () => getMyPlayerName(groupMembers, userId) || state.people[0] || "",
    [groupMembers, userId, state.people]
  );

  const getVoteDraft = useCallback(
    (betId: string, side: "a" | "b"): VoteDraft => {
      const fallback = defaultVoteVoter();
      const bet = state.bets.find((x) => x.id === betId);
      const market = bet ? marketStats(bet) : null;
      const defaultConfA = market?.hasMarket ? Math.round(market.pa * 100) : 50;
      const defaultConfB = market?.hasMarket ? Math.round(market.pb * 100) : 50;
      const defaultConf = side === "a" ? defaultConfA : defaultConfB;
      const d = voteDrafts[betId];
      const raw = d ? (side === "a" ? d.a : d.b) : { voter: "", conf: defaultConf };
      return {
        voter: raw.voter.trim() || fallback,
        conf: raw.conf ?? defaultConf,
      };
    },
    [voteDrafts, defaultVoteVoter, state.bets]
  );

  const setVoteDraft = useCallback(
    (betId: string, side: "a" | "b", patch: Partial<VoteDraft>) => {
      setVoteDrafts((prev) => {
        const fallback = defaultVoteVoter();
        const bet = state.bets.find((x) => x.id === betId);
        const market = bet ? marketStats(bet) : null;
        const defaultConfA = market?.hasMarket ? Math.round(market.pa * 100) : 50;
        const defaultConfB = market?.hasMarket ? Math.round(market.pb * 100) : 50;
        const current = prev[betId] || {
          a: { voter: fallback, conf: defaultConfA },
          b: { voter: fallback, conf: defaultConfB },
        };
        const key = side === "a" ? "a" : "b";
        return { ...prev, [betId]: { ...current, [key]: { ...current[key], ...patch } } };
      });
    },
    [defaultVoteVoter, state.bets]
  );

  const voteBet = useCallback(
    async (betId: string, pick: "a" | "b") => {
      const draft = getVoteDraft(betId, pick);
      const voter = draft.voter.trim();
      if (!voter) {
        showToast("Pick a voter before submitting odds.");
        return;
      }
      const raw = clamp(Number(draft.conf || 50), 1, 99);
      const probA = pick === "a" ? raw : 100 - raw;
      const bet = state.bets.find((x) => x.id === betId);
      if (!bet) return;
      await saveWithActivity(
        (s) => {
          const b = s.bets.find((x) => x.id === betId);
          if (!b) return;
          if (!s.people.includes(voter)) s.people.push(voter);
          b.votes[voter] = { pick: probA >= 50 ? "a" : "b", probA, ts: Date.now() };
          s.notifs.unshift({
            title: "Market probability split",
            text: `${voter} set ${b.sideAUser} ${probA}% / ${b.sideBUser} ${100 - probA}% in ${b.title}.`,
          });
        },
        undefined
      );
      showToast(`${voter} set odds: ${bet.sideAUser} ${probA}% / ${bet.sideBUser} ${100 - probA}%.`);
    },
    [getVoteDraft, state.bets, saveWithActivity, showToast]
  );

  const resolveBet = useCallback(
    async (betId: string) => {
      const b = stateRef.current.bets.find((x) => x.id === betId);
      if (!b) return;
      if (!Object.keys(b.votes || {}).length) {
        showToast("Resolving with no market votes. Prediction stats will not change.");
      }
      const winner = prompt(
        `Who won the bet? Type A for ${b.sideAUser}: "${b.sideATake}" or B for ${b.sideBUser}: "${b.sideBTake}"`,
        "A"
      );
      if (!winner) return;
      const winSide = winner.toLowerCase().startsWith("b") ? "b" : "a";
      const winnerPerson = winSide === "a" ? b.sideAUser : b.sideBUser;
      const loserPerson = winSide === "a" ? b.sideBUser : b.sideAUser;
      const stake = Number(b.stake || 0);
      const market = marketStats(b);
      const winProb = winSide === "a" ? market.pa : market.pb;
      const iouAmount =
        stake > 0 && market.hasMarket ? communitySettlement(stake, winProb) : stake;
      const marketPct = Math.round(winProb * 100);

      await saveWithActivity((s) => {
        const bet = s.bets.find((x) => x.id === betId);
        if (!bet) return;

        const defaultStats = () => ({
          correct: 0,
          wrong: 0,
          profit: 0,
          elo: 1000,
          alphaSum: 0,
          alphaCount: 0,
          brierSum: 0,
        });

        Object.entries(bet.votes || {}).forEach(([p, v]) => {
          const voter = p.trim();
          if (!voter) return;
          if (!s.people.includes(voter)) s.people.push(voter);
          s.stats[voter] = s.stats[voter] || defaultStats();

          const peerMarket = marketStatsExcluding(bet, voter);
          const marketProbWinner = winSide === "a" ? peerMarket.pa : peerMarket.pb;
          const predProbWinner =
            (winSide === "a" ? Number(v.probA ?? 50) : 100 - Number(v.probA ?? 50)) / 100;
          const pickedWinner = predProbWinner >= 0.5;
          const delta = reputationDelta(predProbWinner, marketProbWinner, pickedWinner);
          if (pickedWinner) {
            s.stats[voter].correct++;
          } else {
            s.stats[voter].wrong++;
          }
          const alpha = marketAlphaDelta(predProbWinner, marketProbWinner);
          s.stats[voter].alphaSum = (s.stats[voter].alphaSum || 0) + alpha;
          s.stats[voter].alphaCount = (s.stats[voter].alphaCount || 0) + 1;
          const outcome = pickedWinner ? 1 : 0;
          s.stats[voter].brierSum = (s.stats[voter].brierSum || 0) + Math.pow(predProbWinner - outcome, 2);
          s.stats[voter].elo = clamp((s.stats[voter].elo || 1000) + delta, 100, 3000);
        });

        if ((bet.doubleDowns || []).length) {
          const liveResult = prompt(
            "For custom live bets, did the live YES condition happen? Type Y for yes or N for no.",
            "Y"
          );
          if (liveResult) {
            const yesWon = liveResult.toLowerCase().startsWith("y");
            bet.doubleDowns.forEach((dd) => {
              const won = (dd.side === "yes") === yesWon;
              dd.resolved = true;
              dd.won = won;
              const person = dd.person.trim();
              if (person && !s.people.includes(person)) s.people.push(person);
              if (person) {
                s.stats[person] = s.stats[person] || defaultStats();
              }
            });
            s.activity.unshift({
              title: "Custom live bets resolved",
              text: `${bet.doubleDowns.length} custom live bet(s) settled on the bet market.`,
              time: nowTime(),
            });
          }
        }

        bet.status = "resolved";
        bet.winner = winSide;

        if (stake > 0 && winnerPerson !== loserPerson) {
          const oddsNote = market.hasMarket
            ? ` at ${marketPct}% community odds`
            : " (flat stake — no community odds yet)";
          const iouReason = `Bet: ${bet.title || "Untitled"} — ${loserPerson} lost${oddsNote}`;
          s.debts.unshift({
            id: uid(),
            reason: iouReason,
            owed: winnerPerson,
            owes: loserPerson,
            amount: iouAmount,
            category: "Bet",
            settled: false,
            created: Date.now(),
          });
          s.notifs.unshift({
            title: "Bet IOU recorded",
            text: `${loserPerson} owes ${winnerPerson} ${money(iouAmount)} for ${bet.title || "resolved bet"}${market.hasMarket ? ` (${marketPct}% community price)` : ""}.`,
          });

          if (!s.stats[winnerPerson]) s.stats[winnerPerson] = defaultStats();
          if (!s.stats[loserPerson]) s.stats[loserPerson] = defaultStats();
          s.stats[winnerPerson].profit += iouAmount;
          s.stats[loserPerson].profit -= iouAmount;
        }

        s.activity.unshift({
          title: "Bet resolved",
          text:
            stake > 0 && winnerPerson !== loserPerson
              ? `${winnerPerson} beat ${loserPerson} on ${bet.title}. IOU: ${loserPerson} owes ${winnerPerson} ${money(iouAmount)}${market.hasMarket ? ` at ${marketPct}% community odds` : ""}.`
              : `${winnerPerson} beat ${loserPerson} on ${bet.title}. Prediction stats updated.`,
          time: nowTime(),
        });
      });
      setScreen("dashboard");
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      showToast(
        stake > 0 && winnerPerson !== loserPerson
          ? market.hasMarket
            ? `Bet resolved. ${loserPerson} owes ${winnerPerson} ${money(iouAmount)} at ${marketPct}% community odds.`
            : `Bet resolved. ${loserPerson} owes ${winnerPerson} ${money(iouAmount)} (flat stake — add group odds next time for community pricing).`
          : "Bet resolved. Dashboard updated with predictors, alpha, and profit/loss."
      );
    },
    [saveWithActivity, showToast, setScreen, stateRef]
  );

  const getLiveDraft = useCallback(
    (bet: Bet): LiveDraft => {
      const base = bet.live || { target: "", total: "", made: "", attempted: "", p: 35 };
      return { ...base, ...liveDrafts[bet.id] };
    },
    [liveDrafts]
  );

  const setLiveDraft = useCallback((betId: string, patch: Partial<LiveDraft>) => {
    setLiveDrafts((prev) => ({ ...prev, [betId]: { ...prev[betId], ...patch } }));
  }, []);

  const updateLiveOdds = useCallback(
    async (betId: string) => {
      const bet = state.bets.find((x) => x.id === betId);
      if (!bet) return;
      const draft = getLiveDraft(bet);
      const live = {
        target: Number(draft.target || 0),
        total: Number(draft.total || 0),
        made: Number(draft.made || 0),
        attempted: Number(draft.attempted || 0),
        p: Number(draft.p || 35),
      };
      if (live.attempted > live.total) return showToast("Attempted so far cannot be bigger than total attempts.");
      if (live.made > live.attempted) return showToast("Made so far cannot be bigger than attempted so far.");
      await saveWithActivity(
        (s) => {
          const b = s.bets.find((x) => x.id === betId);
          if (b) b.live = live;
        },
        {
          title: "Live odds updated",
          text: `${bet.title}: ${liveSummary({ ...bet, live })}. Current YES odds ${Math.round((liveProbability({ ...bet, live }) || 0) * 100)}%.`,
        }
      );
      showToast("Current live odds calculated.");
    },
    [state.bets, getLiveDraft, saveWithActivity, showToast]
  );

  const getDdDraft = useCallback(
    (bet: Bet): DoubleDownDraft => {
      const base: DoubleDownDraft = {
        person: state.people[0] || "",
        side: "yes",
        stake: Number(bet.stake || 20),
      };
      return { ...base, ...ddDrafts[bet.id] };
    },
    [ddDrafts, state.people]
  );

  const setDdDraft = useCallback((betId: string, patch: Partial<DoubleDownDraft>) => {
    setDdDrafts((prev) => ({ ...prev, [betId]: { ...prev[betId], ...patch } as DoubleDownDraft }));
  }, []);

  const previewLiveBet = useCallback(
    (bet: Bet) => {
      const prob = liveProbability(bet);
      if (prob === null) return null;
      const dd = getDdDraft(bet);
      const sideProb = dd.side === "yes" ? prob : 1 - prob;
      const stake = Number(dd.stake || bet.stake || 20);
      const profit = fairProfit(stake, sideProb);
      return {
        odds: Math.round(sideProb * 100) + "%",
        risk: money(stake),
        profit: money(profit),
        payout: money(stake + profit),
      };
    },
    [getDdDraft]
  );

  const addDoubleDown = useCallback(
    async (betId: string) => {
      const bet = state.bets.find((x) => x.id === betId);
      if (!bet) return;
      const prob = liveProbability(bet);
      if (prob === null) return showToast("Calculate current odds before adding a custom live bet.");
      const dd = getDdDraft(bet);
      const sideProb = dd.side === "yes" ? prob : 1 - prob;
      const stake = Number(dd.stake || bet.stake || 20);
      const fair = fairProfit(stake, sideProb);
      const totalPayout = stake + fair;
      await saveWithActivity(
        (s) => {
          const b = s.bets.find((x) => x.id === betId);
          if (!b) return;
          b.doubleDowns = b.doubleDowns || [];
          b.doubleDowns.unshift({
            id: uid(),
            person: dd.person,
            side: dd.side,
            stake,
            prob: sideProb,
            fairProfit: fair,
            totalPayout,
            note: liveSummary(b),
            created: Date.now(),
          });
          s.notifs.unshift({
            title: "Custom live bet placed",
            text: `${dd.person} put ${money(stake)} on ${dd.side === "yes" ? "YES" : "NO"} in ${b.title}. Fair payout: ${money(totalPayout)}.`,
          });
          s.activity.unshift({
            title: "Custom live bet",
            text: `${dd.person} risked ${money(stake)} on ${dd.side === "yes" ? "YES" : "NO"} at ${Math.round(sideProb * 100)}% live odds. Fair payout ${money(totalPayout)}.`,
            time: nowTime(),
          });
        },
        undefined
      );
      showToast("Custom live bet added.");
    },
    [state.bets, getDdDraft, saveWithActivity, showToast]
  );

  return {
    betTitle,
    setBetTitle,
    sideAUser,
    setSideAUser,
    sideBUser,
    setSideBUser,
    sideATake,
    setSideATake,
    sideBTake,
    setSideBTake,
    betStake,
    setBetStake,
    betNotes,
    setBetNotes,
    createBet,
    deleteBet,
    voteBet,
    resolveBet,
    getVoteDraft,
    setVoteDraft,
    getLiveDraft,
    setLiveDraft,
    updateLiveOdds,
    getDdDraft,
    setDdDraft,
    previewLiveBet,
    addDoubleDown,
    missingVoters: (b: Bet) => missingVoters(b, state.people),
    marketStats,
  };
}
