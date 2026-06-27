import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDefaultState, iouAgeLabel, iouOpenLabel, normalizeState } from "./defaults";

describe("iouOpenLabel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-24T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns Ongoing when created is missing", () => {
    expect(iouOpenLabel()).toBe("Ongoing");
  });

  it("returns Ongoing for very recent IOUs", () => {
    expect(iouOpenLabel(Date.now() - 30_000)).toBe("Ongoing");
  });

  it("includes elapsed age after the first day", () => {
    expect(iouOpenLabel(Date.now() - 3 * 86400000)).toBe("Ongoing · 3 days");
  });
});

describe("iouAgeLabel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-24T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null without created", () => {
    expect(iouAgeLabel()).toBeNull();
  });

  it("formats days", () => {
    expect(iouAgeLabel(Date.now() - 86400000)).toBe("1 day");
  });
});

describe("normalizeState IOU backfill", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-24T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("backfills created on open IOUs missing it", () => {
    const state = createDefaultState();
    state.debts = [
      {
        id: "d1",
        reason: "Lunch",
        owed: "Alice",
        owes: "Bob",
        amount: 10,
        category: "Food",
        settled: false,
      },
    ];

    normalizeState(state);

    expect(state.debts[0].created).toBe(Date.now());
    expect(iouOpenLabel(state.debts[0].created)).toBe("Ongoing");
  });

  it("does not backfill settled IOUs", () => {
    const state = createDefaultState();
    state.debts = [
      {
        id: "d1",
        reason: "Lunch",
        owed: "Alice",
        owes: "Bob",
        amount: 10,
        category: "Food",
        settled: true,
      },
    ];

    normalizeState(state);

    expect(state.debts[0].created).toBeUndefined();
  });

  it("preserves existing created timestamps", () => {
    const created = Date.now() - 5 * 86400000;
    const state = createDefaultState();
    state.debts = [
      {
        id: "d1",
        reason: "Lunch",
        owed: "Alice",
        owes: "Bob",
        amount: 10,
        category: "Food",
        settled: false,
        created,
      },
    ];

    normalizeState(state);

    expect(state.debts[0].created).toBe(created);
  });
});
