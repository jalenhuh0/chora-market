"use client";

import { useMemo } from "react";
import {
  alphaPct,
  balances,
  brierScore,
  comparePeople,
  consistencyScore,
  hotStreakLeaders,
  improvementDelta,
  peopleWithBetStats,
  personDebtBreakdown,
  predictionStreak,
  predictorScore,
  rankingScore,
  repScore,
  tagCounts,
  totalGroupVolume as computeTotalGroupVolume,
  totalPicks,
  accuracyPct,
  wilsonLowerBound,
} from "@/lib/market/calculations";
import { normalizeState } from "@/lib/market/defaults";
import type { ChoraMarketState } from "@/lib/market/types";

export function useChoraMarketComputed(state: ChoraMarketState, personModal: string | null) {
  const normalized = useMemo(() => normalizeState(structuredClone(state)), [state]);

  const openDebts = useMemo(
    () =>
      normalized.debts
        .filter((d) => !d.settled)
        .sort((a, b) => (a.created || 0) - (b.created || 0)),
    [normalized.debts]
  );
  const groupVolume = useMemo(() => computeTotalGroupVolume(normalized), [normalized]);
  const activeBets = useMemo(
    () => normalized.bets.filter((b) => !b.status || b.status === "open"),
    [normalized.bets]
  );
  const resolvedBets = useMemo(
    () =>
      normalized.bets
        .filter((b) => b.status === "resolved")
        .sort((a, b) => (b.created || 0) - (a.created || 0)),
    [normalized.bets]
  );
  const bal = useMemo(() => balances(normalized), [normalized]);
  const sortedBal = useMemo(() => Object.entries(bal).sort((a, b) => b[1] - a[1]), [bal]);
  const counts = useMemo(() => tagCounts(normalized), [normalized]);
  const worstLabel = normalized.scale?.[2]?.label || "🚨 Giga Scammer";

  const predictors = useMemo(
    () =>
      peopleWithBetStats(normalized)
        .filter((p) => totalPicks(normalized, p) > 0)
        .sort(
          (a, b) =>
            predictorScore(normalized, b) - predictorScore(normalized, a) ||
            alphaPct(normalized, b) - alphaPct(normalized, a) ||
            accuracyPct(normalized, b) - accuracyPct(normalized, a) ||
            repScore(normalized, b) - repScore(normalized, a) ||
            totalPicks(normalized, b) - totalPicks(normalized, a) ||
            a.localeCompare(b)
        ),
    [normalized]
  );

  const alphaRows = useMemo(
    () =>
      peopleWithBetStats(normalized)
        .filter((p) => (normalized.stats[p]?.alphaCount || 0) > 0)
        .sort(comparePeople(normalized, "alpha"))
        .map(
          (p) =>
            [
              p,
              alphaPct(normalized, p),
              repScore(normalized, p),
              normalized.stats[p]?.alphaCount || 0,
              rankingScore(normalized, p, "alpha"),
            ] as const
        ),
    [normalized]
  );

  const profitRows = useMemo(
    () =>
      peopleWithBetStats(normalized)
        .map((p) => {
          const st = normalized.stats[p] || {};
          return [p, Number(st.profit || 0), repScore(normalized, p), alphaPct(normalized, p), totalPicks(normalized, p)] as const;
        })
        .filter((row) => row[4] > 0 || row[1] !== 0)
        .sort((a, b) => b[1] - a[1] || b[2] - a[2] || b[3] - a[3] || b[4] - a[4] || a[0].localeCompare(b[0])),
    [normalized]
  );

  const brierRows = useMemo(
    () =>
      peopleWithBetStats(normalized)
        .filter((p) => totalPicks(normalized, p) > 0)
        .map((p) => [p, brierScore(normalized, p), totalPicks(normalized, p)] as const)
        .sort((a, b) => a[1] - b[1] || b[2] - a[2] || a[0].localeCompare(b[0])),
    [normalized]
  );

  const accuracyRows = useMemo(
    () =>
      peopleWithBetStats(normalized)
        .filter((p) => totalPicks(normalized, p) > 0)
        .map((p) => {
          const st = normalized.stats[p] || { correct: 0, wrong: 0 };
          const n = totalPicks(normalized, p);
          return [p, accuracyPct(normalized, p), wilsonLowerBound(st.correct || 0, n), n] as const;
        })
        .sort((a, b) => b[2] - a[2] || b[1] - a[1] || b[3] - a[3] || a[0].localeCompare(b[0])),
    [normalized]
  );

  const consistencyRows = useMemo(
    () =>
      peopleWithBetStats(normalized)
        .map((p) => [p, consistencyScore(normalized, p), totalPicks(normalized, p)] as const)
        .filter((row): row is [string, number, number] => row[1] !== null)
        .sort((a, b) => b[1] - a[1] || b[2] - a[2] || a[0].localeCompare(b[0])),
    [normalized]
  );

  const improvedRows = useMemo(
    () =>
      peopleWithBetStats(normalized)
        .map((p) => [p, improvementDelta(normalized, p), totalPicks(normalized, p)] as const)
        .filter((row): row is [string, number, number] => row[1] !== null)
        .sort((a, b) => b[1] - a[1] || b[2] - a[2] || a[0].localeCompare(b[0])),
    [normalized]
  );

  const hotStreaks = useMemo(() => hotStreakLeaders(normalized), [normalized]);

  const shameRows = useMemo(
    () =>
      normalized.people
        .map((p) => [p, counts[p]?.[worstLabel] || 0] as const)
        .sort((a, b) => b[1] - a[1])
        .filter((x) => x[1] > 0),
    [normalized, counts, worstLabel]
  );

  const personDetail = useMemo(() => {
    if (!personModal) return null;
    const person = personModal;
    const data = personDebtBreakdown(normalized, person);
    const st = normalized.stats[person] || { correct: 0, wrong: 0, profit: 0 };
    const games = (st.correct || 0) + (st.wrong || 0);
    const acc = games ? Math.round((st.correct / games) * 100) : 0;
    const relationships = Object.entries(data.byPerson).sort(
      (a, b) => Math.abs(b[1].owesMe - b[1].iOwe) - Math.abs(a[1].owesMe - a[1].iOwe)
    );
    const items = [
      ...data.owedToMe.map((d) => ({ ...d, dir: `${d.owes} owes ${person}`, cls: "pos" as const })),
      ...data.iOwe.map((d) => ({ ...d, dir: `${person} owes ${d.owed}`, cls: "neg" as const })),
    ].sort((a, b) => Number(b.amount) - Number(a.amount));
    return { person, data, st, games, acc, streak: predictionStreak(normalized, person), relationships, items };
  }, [personModal, normalized]);

  return {
    normalized,
    openDebts,
    groupVolume,
    activeBets,
    resolvedBets,
    sortedBal,
    counts,
    worstLabel,
    predictors,
    alphaRows,
    profitRows,
    brierRows,
    accuracyRows,
    consistencyRows,
    improvedRows,
    hotStreaks,
    shameRows,
    personDetail,
  };
}
