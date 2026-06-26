import { normalizeState } from "./defaults";
import type { TabMarketState, UserProfile } from "./types";

export type { UserProfile };

export type GroupMemberProfile = {
  user_id: string;
  ledger_name: string | null;
  role: string;
  joined_at: string;
  display_name: string | null;
  avatar_url: string | null;
  email: string | null;
};

/** All names that might refer to the same group member in the player ledger. */
export function memberAliases(member: GroupMemberProfile): string[] {
  const names = new Set<string>();
  for (const value of [member.ledger_name, member.display_name, member.email?.split("@")[0]]) {
    const trimmed = value?.trim();
    if (trimmed) names.add(trimmed);
  }
  return [...names];
}

/** Resolve the name used in IOUs, bets, and leaderboards for a group member. */
export function memberPlayerName(member: GroupMemberProfile): string | null {
  const name =
    member.ledger_name?.trim() ||
    member.display_name?.trim() ||
    member.email?.split("@")[0]?.trim();
  return name || null;
}

export function findMemberForPlayer(
  members: GroupMemberProfile[],
  playerName: string
): GroupMemberProfile | undefined {
  const target = playerName.trim();
  if (!target) return undefined;
  return members.find((m) => memberAliases(m).includes(target));
}

export function getMyPlayerName(
  members: GroupMemberProfile[],
  userId: string
): string | null {
  const member = members.find((m) => m.user_id === userId);
  return member ? memberPlayerName(member) : null;
}

/** Rename a player everywhere in group state and dedupe the people list. */
export function renamePlayerInState(
  state: TabMarketState,
  oldName: string,
  newName: string
): TabMarketState {
  const next = normalizeState(structuredClone(state));
  if (!oldName || !newName || oldName === newName) return next;

  next.people = [...new Set(next.people.map((p) => (p === oldName ? newName : p)))];
  next.debts.forEach((d) => {
    if (d.owed === oldName) d.owed = newName;
    if (d.owes === oldName) d.owes = newName;
  });
  next.bets.forEach((b) => {
    if (b.creator === oldName) b.creator = newName;
    if (b.sideAUser === oldName) b.sideAUser = newName;
    if (b.sideBUser === oldName) b.sideBUser = newName;
    Object.keys(b.votes).forEach((k) => {
      if (k === oldName) {
        b.votes[newName] = b.votes[k];
        delete b.votes[k];
      }
    });
  });
  if (next.stats[oldName]) {
    next.stats[newName] = next.stats[newName] || next.stats[oldName];
    delete next.stats[oldName];
  }
  if (next.tagVotes[oldName]) {
    next.tagVotes[newName] = next.tagVotes[newName] || next.tagVotes[oldName];
    delete next.tagVotes[oldName];
  }
  Object.values(next.tagVotes).forEach((v) => {
    if (v[oldName]) {
      v[newName] = v[newName] || v[oldName];
      delete v[oldName];
    }
  });
  if (next.verdictVotes?.[oldName]) {
    next.verdictVotes[newName] = next.verdictVotes[newName] || next.verdictVotes[oldName];
    delete next.verdictVotes[oldName];
  }
  Object.values(next.verdictVotes || {}).forEach((v) => {
    if (v[oldName]) {
      v[newName] = v[newName] || v[oldName];
      delete v[oldName];
    }
  });

  return next;
}

/** Keep one player entry per signed-in member; remove stale alias duplicates. */
export function syncPeopleFromMembers(
  state: TabMarketState,
  members: GroupMemberProfile[]
): { state: TabMarketState; changed: boolean } {
  const next = normalizeState(structuredClone(state));
  let changed = false;

  for (const member of members) {
    const canonical = memberPlayerName(member);
    if (!canonical) continue;

    const aliases = new Set(memberAliases(member));
    const staleNames = next.people.filter((p) => aliases.has(p) && p !== canonical);

    if (!next.people.includes(canonical)) {
      next.people.push(canonical);
      changed = true;
    }

    for (const stale of staleNames) {
      next.people = next.people.filter((p) => p !== stale);
      if (next.stats[stale] && !next.stats[canonical]) {
        next.stats[canonical] = next.stats[stale];
      }
      delete next.stats[stale];
      if (next.tagVotes[stale]) {
        next.tagVotes[canonical] = next.tagVotes[canonical] || next.tagVotes[stale];
        delete next.tagVotes[stale];
      }
      changed = true;
    }
  }

  return { state: next, changed };
}
