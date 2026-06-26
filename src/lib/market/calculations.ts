import type { Bet, ChoraMarketState } from "./types";
import { clamp } from "./defaults";

export function marketStats(b: Bet) {
  const votes = Object.entries(b.votes || {});
  let scoreA = 0;
  let scoreB = 0;
  votes.forEach(([, v]) => {
    const p = clamp(Number(v.probA ?? 50), 1, 99);
    scoreA += p;
    scoreB += 100 - p;
  });
  if (scoreA + scoreB === 0) {
    return { pa: 0.5, pb: 0.5, scoreA: 0, scoreB: 0, voteCount: 0, hasMarket: false };
  }
  const total = scoreA + scoreB;
  const pa = clamp(scoreA / total, 0.01, 0.99);
  const pb = 1 - pa;
  return { pa, pb, scoreA, scoreB, voteCount: votes.length, hasMarket: true };
}

/** Market odds with one voter removed — used so alpha is vs the group, not vs yourself. */
export function marketStatsExcluding(b: Bet, excludeVoter: string) {
  const votes = Object.entries(b.votes || {}).filter(([voter]) => voter !== excludeVoter);
  let scoreA = 0;
  let scoreB = 0;
  votes.forEach(([, v]) => {
    const p = clamp(Number(v.probA ?? 50), 1, 99);
    scoreA += p;
    scoreB += 100 - p;
  });
  if (scoreA + scoreB === 0) {
    scoreA = 50;
    scoreB = 50;
  }
  const total = scoreA + scoreB;
  const pa = clamp(scoreA / total, 0.01, 0.99);
  const pb = 1 - pa;
  return { pa, pb, scoreA, scoreB, voteCount: votes.length };
}

export function fairProfit(stake: number, prob: number) {
  return Number(stake || 0) * (1 / prob - 1);
}

/** Total the winner collects from the loser at community fair odds (stake back + fair profit). */
export function communitySettlement(stake: number, winnerProb: number) {
  const s = Number(stake || 0);
  if (!s) return 0;
  const p = clamp(winnerProb, 0.01, 0.99);
  return s + fairProfit(s, p);
}

export function missingVoters(b: Bet, people: string[]) {
  return people.filter((p) => !b.votes || !b.votes[p]);
}

export function comb(n: number, k: number) {
  if (k < 0 || k > n) return 0;
  k = Math.min(k, n - k);
  let res = 1;
  for (let i = 1; i <= k; i++) res = (res * (n - k + i)) / i;
  return res;
}

export function binomAtLeast(needed: number, remaining: number, p: number) {
  if (needed <= 0) return 1;
  if (needed > remaining) return 0;
  let sum = 0;
  for (let x = needed; x <= remaining; x++)
    sum += comb(remaining, x) * Math.pow(p, x) * Math.pow(1 - p, remaining - x);
  return sum;
}

export function liveProbability(b: Bet) {
  if (!b.live) return null;
  const made = Number(b.live.made || 0);
  const attempted = Number(b.live.attempted || 0);
  const target = Number(b.live.target || 0);
  const total = Number(b.live.total || 0);
  const p = Number(b.live.p || 35) / 100;
  const remaining = Math.max(0, total - attempted);
  const needed = Math.max(0, target - made);
  return clamp(binomAtLeast(needed, remaining, p), 0.001, 0.999);
}

export function liveSummary(b: Bet) {
  const prob = liveProbability(b);
  if (prob === null) return "";
  const made = Number(b.live!.made || 0);
  const attempted = Number(b.live!.attempted || 0);
  const target = Number(b.live!.target || 0);
  const total = Number(b.live!.total || 0);
  return `${made}/${attempted} so far · needs ${Math.max(0, target - made)} more in ${Math.max(0, total - attempted)} attempts`;
}

export function balances(state: ChoraMarketState) {
  const b: Record<string, number> = {};
  state.people.forEach((p) => (b[p] = 0));
  b["Market"] = b["Market"] || 0;
  state.debts
    .filter((d) => !d.settled)
    .forEach((d) => {
      b[d.owed] = (b[d.owed] || 0) + Number(d.amount);
      b[d.owes] = (b[d.owes] || 0) - Number(d.amount);
    });
  return b;
}

/** All bet stakes + all IOU amounts ever recorded in the group. */
export function totalGroupVolume(state: ChoraMarketState) {
  const betVolume = (state.bets || []).reduce((s, b) => s + Number(b.stake || 0), 0);
  const iouVolume = (state.debts || []).reduce((s, d) => s + Number(d.amount || 0), 0);
  return betVolume + iouVolume;
}

export function totalPicks(state: ChoraMarketState, person: string) {
  const st = state.stats[person] || { correct: 0, wrong: 0 };
  return (st.correct || 0) + (st.wrong || 0);
}

/** Everyone who should appear on bet-market leaderboards (players + anyone with scored picks). */
export function peopleWithBetStats(state: ChoraMarketState): string[] {
  const names = new Set(state.people);
  for (const [name, st] of Object.entries(state.stats)) {
    if ((st.correct || 0) + (st.wrong || 0) > 0 || (st.alphaCount || 0) > 0) {
      names.add(name);
    }
  }
  return [...names];
}

export function accuracyPct(state: ChoraMarketState, person: string) {
  const st = state.stats[person] || { correct: 0, wrong: 0 };
  const n = totalPicks(state, person);
  return n ? (st.correct || 0) / n : 0;
}

export function alphaPct(state: ChoraMarketState, person: string) {
  const st = state.stats[person] || { alphaSum: 0, alphaCount: 0 };
  return st.alphaCount ? st.alphaSum / st.alphaCount : 0;
}

export function brierScore(state: ChoraMarketState, person: string) {
  const st = state.stats[person] || { brierSum: 0 };
  const n = totalPicks(state, person);
  return n && st.brierSum !== undefined ? st.brierSum / n : 0.25;
}

export function repScore(state: ChoraMarketState, person: string) {
  return Math.round(state.stats[person]?.elo || 1000);
}

export function rankForScore(state: ChoraMarketState, score: number) {
  const ranks = [...(state.ranks || [])].sort((a, b) => Number(b.min) - Number(a.min));
  return (ranks.find((r) => score >= Number(r.min)) || ranks[ranks.length - 1] || { title: "Unranked" }).title;
}

export function wilsonLowerBound(correct: number, total: number, z = 1.28155) {
  if (!total) return 0;
  const phat = correct / total;
  const denom = 1 + (z * z) / total;
  const center = phat + (z * z) / (2 * total);
  const margin = z * Math.sqrt((phat * (1 - phat) + (z * z) / (4 * total)) / total);
  return (center - margin) / denom;
}

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

export function predictorScore(state: ChoraMarketState, person: string) {
  const n = totalPicks(state, person);
  const alpha = alphaPct(state, person);
  const acc = accuracyPct(state, person);
  const brier = brierScore(state, person);
  const alphaScore = clamp01((alpha + 0.2) / 0.4) * 100;
  const calibrationScore = clamp01(1 - brier / 0.35) * 100;
  const accuracyScore = acc * 100;
  const sampleScore = clamp01(Math.sqrt(n) / 10) * 100;
  return 0.4 * alphaScore + 0.3 * calibrationScore + 0.2 * accuracyScore + 0.1 * sampleScore;
}

export function predictorColor(score: number) {
  return score >= 50 ? "predictor-good" : "predictor-bad";
}

export function verdictCounts(state: ChoraMarketState, person: string) {
  const votes = state.verdictVotes?.[person] || {};
  let good = 0;
  let bad = 0;
  Object.values(votes).forEach((v) => {
    if (v === "good") good++;
    else if (v === "bad") bad++;
  });
  return { good, bad, total: good + bad };
}

export function verdictLabel(state: ChoraMarketState, person: string) {
  const c = verdictCounts(state, person);
  if (!c.total) return "No verdict yet";
  if (c.good === c.bad) return "Split verdict";
  return c.good > c.bad ? state.verdictLabels.good : state.verdictLabels.bad;
}

export function verdictSummary(state: ChoraMarketState, person: string) {
  const c = verdictCounts(state, person);
  return `${state.verdictLabels.good}: ${c.good} · ${state.verdictLabels.bad}: ${c.bad}`;
}

export function tagCounts(state: ChoraMarketState) {
  const counts: Record<string, Record<string, number>> = {};
  state.people.forEach((p) => (counts[p] = {}));
  Object.entries(state.tagVotes || {}).forEach(([target, voters]) => {
    counts[target] = counts[target] || {};
    Object.values(voters || {}).forEach(
      (tag) => (counts[target][tag] = (counts[target][tag] || 0) + 1)
    );
  });
  return counts;
}

/** Per-pick edge vs the leave-one-out market. Positive = you assigned more probability to the eventual winner than the group did. */
export function marketAlphaDelta(predProbWinner: number, marketProbWinner: number) {
  return predProbWinner - marketProbWinner;
}

export type PersonPick = {
  betId: string;
  alpha: number;
  brier: number;
  correct: boolean;
};

/** Rebuild per-bet history from resolved markets (for consistency / improvement boards). */
export function personPickHistory(state: ChoraMarketState, person: string): PersonPick[] {
  const name = person.trim();
  if (!name) return [];

  return state.bets
    .filter((b) => b.status === "resolved" && b.winner && b.votes?.[name])
    .sort((a, b) => (a.created || 0) - (b.created || 0))
    .map((bet) => {
      const winSide = bet.winner === "b" ? "b" : "a";
      const v = bet.votes![name];
      const peerMarket = marketStatsExcluding(bet, name);
      const marketProbWinner = winSide === "a" ? peerMarket.pa : peerMarket.pb;
      const predProbWinner =
        (winSide === "a" ? Number(v.probA ?? 50) : 100 - Number(v.probA ?? 50)) / 100;
      const pickedWinner = predProbWinner >= 0.5;
      return {
        betId: bet.id,
        alpha: marketAlphaDelta(predProbWinner, marketProbWinner),
        brier: Math.pow(predProbWinner - (pickedWinner ? 1 : 0), 2),
        correct: pickedWinner,
      };
    });
}

/** 0–100. Higher = steadier alpha from pick to pick (needs 2+ resolved picks). */
export function consistencyScore(state: ChoraMarketState, person: string): number | null {
  const picks = personPickHistory(state, person);
  if (picks.length < 2) return null;
  const alphas = picks.map((p) => p.alpha);
  const mean = alphas.reduce((s, a) => s + a, 0) / alphas.length;
  const variance = alphas.reduce((s, a) => s + (a - mean) ** 2, 0) / alphas.length;
  return clamp01(1 - Math.sqrt(variance) / 0.35) * 100;
}

/** Recent-half vs early-half alpha gain in percentage points (needs 4+ picks). */
export function improvementDelta(state: ChoraMarketState, person: string): number | null {
  const picks = personPickHistory(state, person);
  if (picks.length < 4) return null;
  const mid = Math.floor(picks.length / 2);
  const early = picks.slice(0, mid);
  const recent = picks.slice(mid);
  const avg = (arr: PersonPick[]) => arr.reduce((s, p) => s + p.alpha, 0) / arr.length;
  return (avg(recent) - avg(early)) * 100;
}

/** Consecutive correct sides on resolved picks, counting back from the most recent. */
export function predictionStreak(state: ChoraMarketState, person: string): number {
  const picks = personPickHistory(state, person);
  let streak = 0;
  for (let i = picks.length - 1; i >= 0; i--) {
    if (picks[i].correct) streak++;
    else break;
  }
  return streak;
}

export const HOT_STREAK_MIN = 2;

export function hotStreakLeaders(state: ChoraMarketState, min = HOT_STREAK_MIN) {
  return peopleWithBetStats(state)
    .map((p) => ({ person: p, streak: predictionStreak(state, p) }))
    .filter((x) => x.streak >= min)
    .sort((a, b) => b.streak - a.streak || a.person.localeCompare(b.person));
}

export function reputationDelta(
  predProbWinner: number,
  marketProbWinner: number,
  correct: boolean
) {
  const confidence = Math.abs(predProbWinner - 0.5) / 0.5;
  const alpha = marketAlphaDelta(predProbWinner, marketProbWinner);
  const base = 16;
  const alphaBonus = 12 * alpha;
  const confBonus = base * confidence;
  return Math.round((correct ? 1 : -1) * confBonus + alphaBonus);
}

export function calibrationGrade(state: ChoraMarketState, person: string) {
  const st = state.stats[person] || { correct: 0, wrong: 0, brierSum: 0 };
  const n = (st.correct || 0) + (st.wrong || 0);
  if (!n || !st.brierSum) return "—";
  const brier = st.brierSum / n;
  if (brier <= 0.12) return "A+";
  if (brier <= 0.16) return "A";
  if (brier <= 0.2) return "B";
  if (brier <= 0.25) return "C";
  return "D";
}

export function rankingScore(state: ChoraMarketState, person: string, mode = "overall") {
  const st = state.stats[person] || { correct: 0, wrong: 0, elo: 1000, brierSum: 0 };
  const n = totalPicks(state, person);
  const acc = accuracyPct(state, person);
  const alpha = alphaPct(state, person);
  const rep = repScore(state, person);
  const brier = brierScore(state, person);
  const wilson = wilsonLowerBound(st.correct || 0, n);
  const sampleBoost = Math.log1p(n) / 10;
  if (mode === "alpha") return alpha + sampleBoost * 0.01 + wilson * 0.005 - brier * 0.003 + rep / 100000;
  if (mode === "accuracy") return wilson * 0.7 + acc * 0.2 + alpha * 0.08 - brier * 0.05 + sampleBoost * 0.02 + rep / 100000;
  if (mode === "rep") return rep + alpha * 50 + wilson * 25 - brier * 10 + sampleBoost;
  return rep / 1000 + alpha * 0.5 + wilson * 0.3 - brier * 0.2 + sampleBoost;
}

export function comparePeople(state: ChoraMarketState, mode = "overall") {
  return (a: string, b: string) =>
    rankingScore(state, b, mode) - rankingScore(state, a, mode) ||
    totalPicks(state, b) - totalPicks(state, a) ||
    alphaPct(state, b) - alphaPct(state, a) ||
    repScore(state, b) - repScore(state, a) ||
    a.localeCompare(b);
}

export function personDebtBreakdown(state: ChoraMarketState, person: string) {
  const open = state.debts.filter((d) => !d.settled);
  const owedToMe = open.filter((d) => d.owed === person);
  const iOwe = open.filter((d) => d.owes === person);
  const byPerson: Record<string, { owesMe: number; iOwe: number; items: typeof open }> = {};
  owedToMe.forEach((d) => {
    byPerson[d.owes] = byPerson[d.owes] || { owesMe: 0, iOwe: 0, items: [] };
    byPerson[d.owes].owesMe += Number(d.amount);
    byPerson[d.owes].items.push(d);
  });
  iOwe.forEach((d) => {
    byPerson[d.owed] = byPerson[d.owed] || { owesMe: 0, iOwe: 0, items: [] };
    byPerson[d.owed].iOwe += Number(d.amount);
    byPerson[d.owed].items.push(d);
  });
  const categoryTotals: Record<string, number> = {};
  open
    .filter((d) => d.owed === person || d.owes === person)
    .forEach((d) => {
      categoryTotals[d.category] = (categoryTotals[d.category] || 0) + Number(d.amount);
    });
  const owedToMeTotal = owedToMe.reduce((s, d) => s + Number(d.amount), 0);
  const iOweTotal = iOwe.reduce((s, d) => s + Number(d.amount), 0);
  return { owedToMe, iOwe, byPerson, categoryTotals, owedToMeTotal, iOweTotal, net: owedToMeTotal - iOweTotal };
}
