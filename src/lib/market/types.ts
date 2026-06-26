export type PersonStats = {
  correct: number;
  wrong: number;
  profit: number;
  elo: number;
  alphaSum: number;
  alphaCount: number;
  brierSum: number;
};

export type Debt = {
  id: string;
  reason: string;
  owed: string;
  owes: string;
  amount: number;
  category: string;
  settled: boolean;
  created?: number;
};

export type BetVote = {
  pick: "a" | "b";
  probA: number;
  ts?: number;
};

export type LiveState = {
  target: number | string;
  total: number | string;
  made: number | string;
  attempted: number | string;
  p: number | string;
};

export type DoubleDown = {
  id: string;
  person: string;
  side: "yes" | "no";
  stake: number;
  prob: number;
  fairProfit: number;
  totalPayout?: number;
  note: string;
  created?: number;
  resolved?: boolean;
  won?: boolean;
};

export type Bet = {
  id: string;
  title: string;
  sideAUser: string;
  sideBUser: string;
  sideATake: string;
  sideBTake: string;
  creator: string;
  stake: number;
  notes: string;
  status: string;
  votes: Record<string, BetVote>;
  doubleDowns: DoubleDown[];
  live?: LiveState;
  winner?: string;
  created?: number;
  a?: string;
  b?: string;
};

export type TabMarketState = {
  settings: {
    app: string;
    creditors: string;
    mooches: string;
  };
  dashboardTitles?: {
    profit: string;
    shame: string;
  };
  scale: { label: string; mod: number }[];
  ranks: { title: string; min: number }[];
  people: string[];
  debts: Debt[];
  bets: Bet[];
  notifs: { title: string; text: string }[];
  activity: { title: string; text: string; time: string }[];
  tagVotes: Record<string, Record<string, string>>;
  verdictVotes: Record<string, Record<string, string>>;
  verdictLabels: { good: string; bad: string };
  stats: Record<string, PersonStats>;
};

export type GroupRow = {
  id: string;
  name: string;
  invite_code: string;
  app_state: Partial<TabMarketState>;
  created_by: string | null;
};

export type UserProfile = {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  notify_enabled: boolean;
  notify_bets: boolean;
  notify_ious: boolean;
  notify_invites: boolean;
};
