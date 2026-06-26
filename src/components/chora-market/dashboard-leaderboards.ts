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

export const PRIMARY_LEADERBOARDS: LeaderboardConfig[] = [
  {
    title: "📈 Highest Alpha",
    hint: "Beat the group on who wins.",
    empty: "No alpha scored yet.",
    getRows: (tm) => tm.alphaRows,
    formatAmount: (_tm, row) => {
      const a = row[1] as number;
      return `${a >= 0 ? "+" : ""}${(a * 100).toFixed(1)}%`;
    },
    amountClass: (row) => ((row[1] as number) >= 0 ? "alphaGood" : "alphaBad"),
  },
  {
    title: "💰 Biggest Winner",
    hint: "W/L from resolved bet stakes (side A vs side B).",
    empty: "No resolved stake results yet.",
    getRows: (tm) => tm.profitRows,
    formatAmount: (tm, row) => tm.money(row[1] as number),
    amountClass: (row) => ((row[1] as number) >= 0 ? "pos" : "neg"),
  },
];

export const ADVANCED_LEADERBOARDS: LeaderboardConfig[] = [
  {
    title: "🎯 Lowest Brier Score",
    hint: "Best calibrated probabilities. Lower is sharper.",
    empty: "No calibration data yet.",
    getRows: (tm) => tm.brierRows,
    formatAmount: (_tm, row) => (row[1] as number).toFixed(3),
  },
  {
    title: "🔥 Highest Accuracy",
    hint: "Right side most often (sample-adjusted rank).",
    empty: "No picks scored yet.",
    getRows: (tm) => tm.accuracyRows,
    formatAmount: (_tm, row) => `${Math.round((row[1] as number) * 100)}%`,
    amountClass: (row) => {
      const pct = Math.round((row[1] as number) * 100);
      if (pct < 50) return "neg";
      if (pct === 50) return "accEven";
      return "pos";
    },
  },
  {
    title: "🧠 Most Consistent",
    hint: "Steady alpha pick after pick. Needs 2+ resolves.",
    empty: "Need more picks for consistency.",
    getRows: (tm) => tm.consistencyRows,
    formatAmount: (_tm, row) => (row[1] as number).toFixed(1),
  },
  {
    title: "⭐ Most Improved",
    hint: "Recent picks vs early picks. Needs 4+ resolves.",
    empty: "Need more picks to track improvement.",
    getRows: (tm) => tm.improvedRows,
    formatAmount: (_tm, row) => {
      const d = row[1] as number;
      return `${d >= 0 ? "+" : ""}${d.toFixed(1)}%`;
    },
    amountClass: (row) => ((row[1] as number) >= 0 ? "alphaGood" : "alphaBad"),
  },
];
