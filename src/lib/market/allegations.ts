import type { ChoraMarketState } from "./types";

/** Friend allegation tags — the only three options in the app. */
export const ALLEGATION_GOAT = "🐐 GOAT";
export const ALLEGATION_LUCKY_PIGGY = "🐷 Lucky Piggy";
export const ALLEGATION_GIGA_SCAMMER = "🚨 Giga Scammer";

export const ALLEGATION_LABELS = [
  ALLEGATION_GOAT,
  ALLEGATION_LUCKY_PIGGY,
  ALLEGATION_GIGA_SCAMMER,
] as const;

export type AllegationLabel = (typeof ALLEGATION_LABELS)[number];

export function defaultAllegationScale() {
  return [
    { label: ALLEGATION_GOAT, mod: 1.2 },
    { label: ALLEGATION_LUCKY_PIGGY, mod: 1.0 },
    { label: ALLEGATION_GIGA_SCAMMER, mod: 0.8 },
  ];
}

export function isExclusiveAllegation(tag: string): boolean {
  return tag === ALLEGATION_GOAT || tag === ALLEGATION_GIGA_SCAMMER;
}

/** Map legacy tag labels from older app versions into the 3-option set. */
export function migrateAllegationLabel(tag: string): AllegationLabel | null {
  if (ALLEGATION_LABELS.includes(tag as AllegationLabel)) return tag as AllegationLabel;
  const lower = tag.toLowerCase();
  if (lower.includes("goat")) return ALLEGATION_GOAT;
  if (lower.includes("scammer") || lower.includes("giga")) return ALLEGATION_GIGA_SCAMMER;
  if (lower.includes("piggy") || lower.includes("lucky") || lower.includes("respectable")) {
    return ALLEGATION_LUCKY_PIGGY;
  }
  return null;
}

export function normalizeAllegations(state: ChoraMarketState): void {
  state.scale = defaultAllegationScale();

  for (const target of Object.keys(state.tagVotes || {})) {
    const voters = state.tagVotes[target];
    for (const voter of Object.keys(voters)) {
      const migrated = migrateAllegationLabel(voters[voter]);
      if (migrated) voters[voter] = migrated;
      else delete voters[voter];
    }
  }
}
