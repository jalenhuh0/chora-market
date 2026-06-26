import { describe, expect, it } from "vitest";
import { communitySettlement, marketAlphaDelta, marketStats } from "./calculations";
import type { Bet } from "./types";

function makeBet(votes: Bet["votes"] = {}): Bet {
  return {
    id: "bet-1",
    title: "Test bet",
    sideAUser: "Alice",
    sideBUser: "Bob",
    sideATake: "A wins",
    sideBTake: "B wins",
    creator: "Alice",
    stake: 20,
    notes: "",
    status: "open",
    votes,
    doubleDowns: [],
  };
}

describe("marketStats", () => {
  it("returns hasMarket false with no votes", () => {
    const stats = marketStats(makeBet());
    expect(stats.hasMarket).toBe(false);
    expect(stats.voteCount).toBe(0);
    expect(stats.pa).toBe(0.5);
    expect(stats.pb).toBe(0.5);
  });

  it("computes weighted odds with votes", () => {
    const stats = marketStats(
      makeBet({
        Voter1: { pick: "a", probA: 60 },
        Voter2: { pick: "b", probA: 40 },
      })
    );
    expect(stats.hasMarket).toBe(true);
    expect(stats.voteCount).toBe(2);
    expect(stats.pa).toBeCloseTo(0.5, 5);
    expect(stats.pb).toBeCloseTo(0.5, 5);
  });
});

describe("communitySettlement", () => {
  it("returns stake plus fair profit at community odds", () => {
    const stake = 20;
    const winnerProb = 0.6;
    const settlement = communitySettlement(stake, winnerProb);
    expect(settlement).toBeGreaterThan(stake);
    expect(settlement).toBeCloseTo(stake + stake * (1 / winnerProb - 1), 5);
  });

  it("returns zero for zero stake", () => {
    expect(communitySettlement(0, 0.5)).toBe(0);
  });
});

describe("marketAlphaDelta", () => {
  it("is positive when prediction exceeds market", () => {
    expect(marketAlphaDelta(0.7, 0.5)).toBeCloseTo(0.2);
  });

  it("is negative when prediction is below market", () => {
    expect(marketAlphaDelta(0.4, 0.55)).toBeCloseTo(-0.15);
  });
});
