import type { LiveState } from "@/lib/market/types";

export type Screen = "dashboard" | "entry" | "bets" | "people" | "settings";

export type UseTabMarketProps = {
  groupId: string;
  groupName: string;
  inviteCode: string;
  userId: string;
  onSignOut: () => void;
  onSwitchGroup: () => void;
};

export type VoteDraft = { voter: string; conf: number };
export type LiveDraft = LiveState;
export type DoubleDownDraft = { person: string; side: "yes" | "no"; stake: number };
