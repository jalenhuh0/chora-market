import type { ChoraMarketState } from "@/lib/market/types";
import { isExclusiveAllegation } from "@/lib/market/allegations";

export function nowTime() {
  return new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function applyExclusiveScaleVote(state: ChoraMarketState, target: string, voter: string, tag: string) {
  state.tagVotes[target] = state.tagVotes[target] || {};
  if (isExclusiveAllegation(tag)) {
    Object.keys(state.tagVotes).forEach((person) => {
      if (person !== target && state.tagVotes[person]?.[voter] === tag) {
        delete state.tagVotes[person][voter];
      }
    });
  }
  state.tagVotes[target][voter] = tag;
}
