import type { ChoraMarketState } from "./types";

export const APP_NAME = "Chora Market";

export const defaultRanks = () => [
  { title: "🐐 GOAT", min: 1500 },
  { title: "🧠 Sharp", min: 1300 },
  { title: "📈 Winning", min: 1150 },
  { title: "🙂 Average", min: 1000 },
  { title: "📉 Sus", min: 850 },
  { title: "🚨 Giga Scammer", min: 0 },
];

export const defaultScale = () => [
  { label: "🐐 GOAT", mod: 1.2 },
  { label: "📈 Sharp", mod: 1.1 },
  { label: "😐 Neutral", mod: 1.0 },
  { label: "📉 Sus", mod: 0.9 },
  { label: "🚨 Giga Scammer", mod: 0.8 },
];

export function createDefaultState(): ChoraMarketState {
  return {
    settings: {
      app: APP_NAME,
      creditors: "Top Net Creditors",
      mooches: "Biggest Mooches",
    },
    dashboardTitles: { profit: "Net Profit / Loss", shame: "Hall of Shame" },
    scale: defaultScale(),
    ranks: defaultRanks(),
    people: [],
    debts: [],
    bets: [],
    notifs: [],
    activity: [],
    tagVotes: {},
    verdictVotes: {},
    verdictLabels: { good: "🫡 Respectable", bad: "🐷 Lucky Piggy" },
    stats: {},
  };
}

export function normalizeState(state: ChoraMarketState): ChoraMarketState {
  state.settings = state.settings || {
    app: APP_NAME,
    creditors: "Top Net Creditors",
    mooches: "Biggest Mooches",
  };
  if (state.settings.app === "Tab Market") {
    state.settings.app = APP_NAME;
  }

  state.dashboardTitles = state.dashboardTitles || {
    profit: "Net Profit / Loss",
    shame: "Hall of Shame",
  };
  state.scale = state.scale || defaultScale();
  state.ranks = state.ranks || defaultRanks();
  state.people = state.people || [];
  state.debts = state.debts || [];
  state.bets = state.bets || [];
  state.notifs = state.notifs || [];
  state.activity = state.activity || [];
  state.tagVotes = state.tagVotes || {};
  state.verdictVotes = state.verdictVotes || {};
  state.verdictLabels = state.verdictLabels || {
    good: "🫡 Respectable",
    bad: "🐷 Lucky Piggy",
  };
  state.stats = state.stats || {};

  state.people.forEach((p) => {
    state.stats[p] = state.stats[p] || {
      correct: 0,
      wrong: 0,
      profit: 0,
      elo: 1000,
      alphaSum: 0,
      alphaCount: 0,
      brierSum: 0,
    };
    const st = state.stats[p];
    if (st.elo === undefined) st.elo = 1000;
    if (st.alphaSum === undefined) st.alphaSum = 0;
    if (st.alphaCount === undefined) st.alphaCount = 0;
    if (st.brierSum === undefined) st.brierSum = 0;
  });

  state.bets.forEach((b) => {
    if (!b.sideAUser && b.a) {
      b.sideAUser = b.creator || state.people[0] || "Person 1";
      b.sideBUser = state.people.find((p) => p !== b.sideAUser) || "Person 2";
      b.sideATake = b.a;
      b.sideBTake = b.b!;
    }
    b.status = b.status || "open";
    b.votes = b.votes || {};
    b.doubleDowns = b.doubleDowns || [];
  });

  return state;
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function inviteCode() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

export function money(n: number | string | undefined) {
  return "$" + Number(n || 0).toFixed(2);
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function initials(n: string) {
  return String(n || "?")
    .split(" ")
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function estimate(text: string) {
  text = (text || "").toLowerCase();
  if (/golf/.test(text)) return 80;
  if (/dinner|sushi/.test(text)) return 35;
  if (/boba|coffee/.test(text)) return 7;
  if (/chipotle|cane|burger|food|lunch/.test(text)) return 15;
  if (/airport|ride|uber/.test(text)) return 32;
  if (/hoodie/.test(text)) return 45;
  if (/monitor/.test(text)) return 140;
  if (/beer|drink/.test(text)) return 9;
  return 20;
}

/** Human-readable time since an IOU was opened. */
export function iouUnsettledFor(created?: number): string | null {
  if (!created) return null;
  const ms = Math.max(0, Date.now() - created);
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"}`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `${days} day${days === 1 ? "" : "s"}`;
  const weeks = Math.floor(days / 7);
  if (days < 60) return `${weeks} week${weeks === 1 ? "" : "s"}`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? "" : "s"}`;
}
