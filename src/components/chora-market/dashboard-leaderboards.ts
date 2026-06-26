import type { ChoraMarketHook } from "@/hooks/useChoraMarket";

type Row = readonly (readonly [string, ...unknown[]])[];

export type LeaderboardConfig = {
  title: string;
  hint?: string;
  empty: string;
  getRows: (tm: ChoraMarketHook) => Row;
  formatAmount: (tm: ChoraMarketHook, row: readonly [string, ...unknown[]]) => string;
  amountClass?: (row: readonly [string, ...unknown[]]) => string;
};

/** Format a 0–1 ratio as a signed percentage (e.g. +8.2%). */
function signedPercent(ratio: number, decimals = 1): string {
  return `${ratio >= 0 ? "+" : ""}${(ratio * 100).toFixed(decimals)}%`;
}

function edgeAmountClass(row: readonly [string, ...unknown[]]): string {
  return (row[1] as number) >= 0 ? "alphaGood" : "alphaBad";
}

function moneyAmountClass(row: readonly [string, ...unknown[]]): string {
  return (row[1] as number) >= 0 ? "pos" : "neg";
}

function accuracyAmountClass(row: readonly [string, ...unknown[]]): string {
  const pct = Math.round((row[1] as number) * 100);
  if (pct < 50) return "neg";
  if (pct === 50) return "accEven";
  return "pos";
}

const largestEdge: LeaderboardConfig = {
  title: "📈 Largest Edge",
  hint: "Beat the group on who wins.",
  empty: "No edge scored yet.",
  getRows: (tm) => tm.alphaRows,
  formatAmount: (_tm, row) => signedPercent(row[1] as number),
  amountClass: edgeAmountClass,
};

const biggestWinner: LeaderboardConfig = {
  title: "💰 Biggest Winner",
  hint: "W/L from resolved bet stakes (side A vs side B).",
  empty: "No resolved stake results yet.",
  getRows: (tm) => tm.profitRows,
  formatAmount: (tm, row) => tm.money(row[1] as number),
  amountClass: moneyAmountClass,
};

const lowestBrier: LeaderboardConfig = {
  title: "🎯 Lowest Brier Score",
  hint: "Best calibrated probabilities. Lower is sharper.",
  empty: "No calibration data yet.",
  getRows: (tm) => tm.brierRows,
  formatAmount: (_tm, row) => (row[1] as number).toFixed(3),
};

const highestAccuracy: LeaderboardConfig = {
  title: "🔥 Highest Accuracy",
  hint: "Right side most often (sample-adjusted rank).",
  empty: "No picks scored yet.",
  getRows: (tm) => tm.accuracyRows,
  formatAmount: (_tm, row) => `${Math.round((row[1] as number) * 100)}%`,
  amountClass: accuracyAmountClass,
};

const mostConsistent: LeaderboardConfig = {
  title: "🧠 Most Consistent",
  hint: "Steady edge from pick to pick. Needs 2+ resolves.",
  empty: "Need more picks for consistency.",
  getRows: (tm) => tm.consistencyRows,
  formatAmount: (_tm, row) => (row[1] as number).toFixed(1),
};

const mostImproved: LeaderboardConfig = {
  title: "⭐ Most Improved",
  hint: "Recent picks vs early picks. Needs 4+ resolves.",
  empty: "Need more picks to track improvement.",
  getRows: (tm) => tm.improvedRows,
  formatAmount: (_tm, row) => {
    const pts = row[1] as number;
    return `${pts >= 0 ? "+" : ""}${pts.toFixed(1)}%`;
  },
  amountClass: edgeAmountClass,
};

/** Shown on the main dashboard without expanding. */
export const PRIMARY_LEADERBOARDS: LeaderboardConfig[] = [biggestWinner];

/** Collapsed under “Advanced stats” on the dashboard. */
export const ADVANCED_LEADERBOARDS: LeaderboardConfig[] = [
  largestEdge,
  lowestBrier,
  highestAccuracy,
  mostConsistent,
  mostImproved,
];

export const ADVANCED_STATS_SUMMARY = "Edge, Brier, accuracy, consistency, improvement";
