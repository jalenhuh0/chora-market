import type { ChoraMarketState } from "@/lib/market/types";

export function nowTime() {
  return new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function applyExclusiveScaleVote(state: ChoraMarketState, target: string, voter: string, tag: string) {
  state.tagVotes[target] = state.tagVotes[target] || {};
  const best = state.scale?.[0]?.label;
  const worst = state.scale?.[4]?.label;
  if (tag === best || tag === worst) {
    Object.keys(state.tagVotes).forEach((person) => {
      if (person !== target && state.tagVotes[person]?.[voter] === tag) {
        delete state.tagVotes[person][voter];
      }
    });
  }
  state.tagVotes[target][voter] = tag;
}
