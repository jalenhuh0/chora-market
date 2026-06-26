import { APP_NAME, defaultRanks, normalizeState, uid } from "@/lib/market/defaults";
import type { TabMarketState } from "@/lib/market/types";

export function createDemoState(): TabMarketState {
  return normalizeState({
    settings: { app: APP_NAME, creditors: "Net Creditors", mooches: "Biggest Mooches" },
    dashboardTitles: { profit: "Net Profit / Loss", shame: "Hall of Shame" },
    scale: [
      { label: "🐐 GOAT", mod: 1.2 },
      { label: "📈 Sharp", mod: 1.1 },
      { label: "😐 Neutral", mod: 1.0 },
      { label: "📉 Sus", mod: 0.9 },
      { label: "🚨 Giga Scammer", mod: 0.8 },
    ],
    ranks: defaultRanks(),
    people: ["Jalen", "Will", "Sarah", "Matt", "Kevin"],
    debts: [
      { id: uid(), reason: "Lost Cane's bet", owed: "Jalen", owes: "Matt", amount: 17, category: "Food", settled: false },
      { id: uid(), reason: "Borrowed hoodie replacement value", owed: "Sarah", owes: "Will", amount: 45, category: "Item", settled: false },
      { id: uid(), reason: "Covered sushi", owed: "Kevin", owes: "Matt", amount: 38, category: "Food", settled: false },
    ],
    bets: [
      {
        id: uid(),
        title: "Joseph 6/15 three-point challenge",
        sideAUser: "Will",
        sideBUser: "Jalen",
        sideATake: "Joseph makes 6 of 15 threes",
        sideBTake: "Joseph does not make 6 of 15 threes",
        creator: "Sarah",
        stake: 20,
        notes: "Demo bet showing live odds and custom fair payout.",
        status: "open",
        votes: {
          Sarah: { pick: "a", probA: 60 },
          Matt: { pick: "b", probA: 45 },
          Kevin: { pick: "a", probA: 55 },
        },
        live: { target: 6, total: 15, made: 5, attempted: 13, p: 35 },
        doubleDowns: [],
        created: Date.now(),
      },
    ],
    notifs: [{ title: "Demo active bet loaded", text: "Open Bet Market to see Custom Live Bet at Fair Odds." }],
    activity: [],
    tagVotes: {},
    verdictLabels: { good: "🫡 Respectable", bad: "🐷 Lucky Piggy" },
    verdictVotes: {},
    stats: {
      Jalen: { correct: 2, wrong: 1, profit: 20, elo: 1088, alphaSum: 0.22, alphaCount: 3, brierSum: 0.52 },
      Will: { correct: 1, wrong: 2, profit: -20, elo: 963, alphaSum: -0.12, alphaCount: 3, brierSum: 0.73 },
      Sarah: { correct: 3, wrong: 1, profit: 40, elo: 1125, alphaSum: 0.31, alphaCount: 4, brierSum: 0.61 },
      Matt: { correct: 0, wrong: 3, profit: -60, elo: 910, alphaSum: -0.38, alphaCount: 3, brierSum: 0.92 },
      Kevin: { correct: 2, wrong: 2, profit: 0, elo: 1002, alphaSum: 0.02, alphaCount: 4, brierSum: 0.78 },
    },
  });
}
