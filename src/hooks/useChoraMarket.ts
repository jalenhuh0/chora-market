"use client";

import {
  alphaPct,
  communitySettlement,
  fairProfit,
  liveProbability,
  liveSummary,
  predictionStreak,
  predictorColor,
  predictorScore,
  rankingScore,
  repScore,
  totalPicks,
  accuracyPct,
  brierScore,
  calibrationGrade,
  verdictLabel,
  verdictSummary,
  rankForScore,
  wilsonLowerBound,
} from "@/lib/market/calculations";
import { initials, iouUnsettledFor, money } from "@/lib/market/defaults";
import { CATEGORIES } from "@/hooks/chora-market/constants";
import { useBets } from "@/hooks/chora-market/useBets";
import { useChoraMarketComputed } from "@/hooks/chora-market/useChoraMarketComputed";
import { useChoraMarketCore } from "@/hooks/chora-market/useChoraMarketCore";
import { useDebts } from "@/hooks/chora-market/useDebts";
import { usePeople } from "@/hooks/chora-market/usePeople";
import { useSettings } from "@/hooks/chora-market/useSettings";
import type { UseChoraMarketProps } from "@/hooks/chora-market/types";

export type { Screen, UseChoraMarketProps, VoteDraft, LiveDraft, DoubleDownDraft } from "@/hooks/chora-market/types";

export function useChoraMarket(props: UseChoraMarketProps) {
  const core = useChoraMarketCore(props);
  const debts = useDebts(core);
  const bets = useBets(core);
  const people = usePeople(core);
  const settings = useSettings(core);

  const {
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
    verdictRows,
    shameRows,
    personDetail,
  } = useChoraMarketComputed(core.state, core.personModal);

  return {
    loading: core.loading,
    state: normalized,
    screen: core.screen,
    showScreen: core.showScreen,
    toast: core.toast,
    personModal: core.personModal,
    personDetail,
    showPersonDetail: core.showPersonDetail,
    closePersonDetail: core.closePersonDetail,
    localGroupName: core.localGroupName,
    profile: core.profile,
    groupMembers: core.groupMembers,
    userId: core.userId,
    refreshGroupMembers: core.refreshGroupMembers,
    onSignOut: core.onSignOut,
    onSwitchGroup: core.onSwitchGroup,
    copyInviteLink: core.copyInviteLink,
    inviteCode: core.inviteCode,
    categories: CATEGORIES,

    groupVolume,
    openDebts,
    activeBets,
    resolvedBets,
    sortedBal,
    predictors,
    alphaRows,
    profitRows,
    brierRows,
    accuracyRows,
    consistencyRows,
    improvedRows,
    hotStreaks,
    verdictRows,
    shameRows,
    counts,
    worstLabel,

    ...debts,
    ...bets,
    ...people,
    ...settings,

    money,
    iouUnsettledFor,
    initials,
    alphaPct: (p: string) => alphaPct(normalized, p),
    repScore: (p: string) => repScore(normalized, p),
    rankForScore: (score: number) => rankForScore(normalized, score),
    verdictLabel: (p: string) => verdictLabel(normalized, p),
    verdictSummary: (p: string) => verdictSummary(normalized, p),
    predictorScore: (p: string) => predictorScore(normalized, p),
    predictorColor,
    totalPicks: (p: string) => totalPicks(normalized, p),
    accuracyPct: (p: string) => accuracyPct(normalized, p),
    calibrationGrade: (p: string) => calibrationGrade(normalized, p),
    brierScore: (p: string) => brierScore(normalized, p),
    predictionStreak: (p: string) => predictionStreak(normalized, p),
    wilsonLowerBound,
    rankingScore: (p: string, mode?: string) => rankingScore(normalized, p, mode),
    liveProbability,
    liveSummary,
    fairProfit,
    communitySettlement,
  };
}

export type ChoraMarketHook = ReturnType<typeof useChoraMarket>;
