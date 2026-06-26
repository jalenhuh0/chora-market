import type { SupabaseClient } from "@supabase/supabase-js";
import type { Bet, ChoraMarketState } from "./types";
import { createDefaultState, inviteCode, normalizeState } from "./defaults";
import { syncPeopleFromMembers } from "./members";

type DbMarket = {
  id: string;
  group_id: string;
  external_id: string;
  title: string;
  side_a_user: string | null;
  side_b_user: string | null;
  side_a_take: string | null;
  side_b_take: string | null;
  creator: string | null;
  stake: number;
  notes: string | null;
  status: string;
  winner: string | null;
  live: Bet["live"] | null;
  double_downs: Bet["doubleDowns"];
};

type DbPrediction = {
  id: string;
  market_id: string;
  voter_name: string;
  prob_a: number;
  pick: string | null;
  user_id: string | null;
};

function marketToBet(m: DbMarket, votes: Record<string, { pick: "a" | "b"; probA: number }>): Bet {
  return {
    id: m.external_id,
    title: m.title,
    sideAUser: m.side_a_user || "Person 1",
    sideBUser: m.side_b_user || "Person 2",
    sideATake: m.side_a_take || "Take A",
    sideBTake: m.side_b_take || "Take B",
    creator: m.creator || "",
    stake: Number(m.stake),
    notes: m.notes || "",
    status: m.status,
    winner: m.winner || undefined,
    live: m.live || undefined,
    doubleDowns: m.double_downs || [],
    votes,
  };
}

function betToMarketRow(groupId: string, bet: Bet) {
  return {
    group_id: groupId,
    external_id: bet.id,
    title: bet.title,
    side_a_user: bet.sideAUser,
    side_b_user: bet.sideBUser,
    side_a_take: bet.sideATake,
    side_b_take: bet.sideBTake,
    creator: bet.creator,
    stake: bet.stake,
    notes: bet.notes,
    status: bet.status || "open",
    winner: bet.winner || null,
    live: bet.live || null,
    double_downs: bet.doubleDowns || [],
    updated_at: new Date().toISOString(),
  };
}

export async function loadGroupState(
  supabase: SupabaseClient,
  groupId: string
): Promise<ChoraMarketState> {
  const [{ data: group, error: gErr }, { data: markets, error: mErr }] = await Promise.all([
    supabase.from("groups").select("app_state").eq("id", groupId).single(),
    supabase.from("markets").select("*").eq("group_id", groupId),
  ]);

  if (gErr) throw gErr;
  if (mErr) throw mErr;

  const base = normalizeState({
    ...createDefaultState(),
    ...(group?.app_state as Partial<ChoraMarketState>),
  });

  if (!markets?.length) {
    base.bets = base.bets || [];
    return base;
  }

  const marketIds = markets.map((m) => m.id);
  const { data: predictions, error: pErr } = await supabase
    .from("predictions")
    .select("*")
    .in("market_id", marketIds);

  if (pErr) throw pErr;

  const predsByMarket: Record<string, DbPrediction[]> = {};
  (predictions || []).forEach((p) => {
    predsByMarket[p.market_id] = predsByMarket[p.market_id] || [];
    predsByMarket[p.market_id].push(p as DbPrediction);
  });

  base.bets = markets.map((m) => {
    const votes: Bet["votes"] = {};
    (predsByMarket[m.id] || []).forEach((p) => {
      votes[p.voter_name] = {
        pick: (p.pick as "a" | "b") || (p.prob_a >= 50 ? "a" : "b"),
        probA: Number(p.prob_a),
      };
    });
    return marketToBet(m as DbMarket, votes);
  });

  return normalizeState(base);
}

export async function saveGroupState(
  supabase: SupabaseClient,
  groupId: string,
  state: ChoraMarketState
) {
  const normalized = normalizeState(structuredClone(state));

  const appState = {
    settings: normalized.settings,
    dashboardTitles: normalized.dashboardTitles,
    scale: normalized.scale,
    ranks: normalized.ranks,
    people: normalized.people,
    debts: normalized.debts,
    notifs: normalized.notifs,
    activity: normalized.activity,
    tagVotes: normalized.tagVotes,
    verdictVotes: normalized.verdictVotes,
    verdictLabels: normalized.verdictLabels,
    stats: normalized.stats,
  };

  const { error: groupErr } = await supabase
    .from("groups")
    .update({ app_state: appState, updated_at: new Date().toISOString() })
    .eq("id", groupId);

  if (groupErr) throw groupErr;

  const { data: existingMarkets, error: emErr } = await supabase
    .from("markets")
    .select("id, external_id")
    .eq("group_id", groupId);

  if (emErr) throw emErr;

  const externalToDbId = new Map(
    (existingMarkets || []).map((m) => [m.external_id, m.id as string])
  );
  const currentExternalIds = new Set(normalized.bets.map((b) => b.id));

  for (const old of existingMarkets || []) {
    if (!currentExternalIds.has(old.external_id)) {
      await supabase.from("markets").delete().eq("id", old.id);
    }
  }

  for (const bet of normalized.bets) {
    const row = betToMarketRow(groupId, bet);
    let marketDbId = externalToDbId.get(bet.id);

    if (marketDbId) {
      const { error } = await supabase.from("markets").update(row).eq("id", marketDbId);
      if (error) throw error;
    } else {
      const { data, error } = await supabase
        .from("markets")
        .insert(row)
        .select("id")
        .single();
      if (error) throw error;
      marketDbId = data.id as string;
      externalToDbId.set(bet.id, marketDbId);
    }

    await supabase.from("predictions").delete().eq("market_id", marketDbId);

    const predRows = Object.entries(bet.votes || {}).map(([voter, v]) => ({
      market_id: marketDbId!,
      group_id: groupId,
      voter_name: voter,
      prob_a: Number(v.probA ?? 50),
      pick: v.pick,
    }));

    if (predRows.length) {
      const { error } = await supabase.from("predictions").insert(predRows);
      if (error) throw error;
    }
  }
}

export async function ensureUserProfile(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) return;

  const row = {
    id: user.id,
    email: user.email ?? null,
    display_name:
      (user.user_metadata?.display_name as string) ||
      user.email?.split("@")[0] ||
      "User",
  };

  const { error } = await supabase.from("users").upsert(row, { onConflict: "id" });
  if (error) {
    const { error: insertErr } = await supabase.from("users").insert(row);
    if (insertErr && !/duplicate|unique|already exists/i.test(insertErr.message)) {
      console.warn("ensureUserProfile:", insertErr.message);
    }
  }
}

export async function createGroup(
  supabase: SupabaseClient,
  userId: string,
  name: string,
  ledgerName?: string
) {
  // Profile is optional for group create (FK points to auth.users after SIMPLE_FIX.sql)
  void ensureUserProfile(supabase);

  const code = inviteCode();
  const { data, error } = await supabase
    .from("groups")
    .insert({
      name,
      invite_code: code,
      created_by: userId,
      app_state: createDefaultState(),
    })
    .select("id, name, invite_code")
    .single();

  if (error) throw error;

  const memberLedger = await resolveMemberLedgerName(supabase, userId, ledgerName);

  const { error: memberErr } = await supabase.from("group_members").insert({
    group_id: data.id,
    user_id: userId,
    ledger_name: memberLedger,
    role: "owner",
  });

  if (memberErr) throw memberErr;
  await syncGroupPlayersFromMembers(supabase, data.id);
  return data;
}

async function resolveMemberLedgerName(
  supabase: SupabaseClient,
  userId: string,
  ledgerName?: string
): Promise<string | null> {
  const trimmed = ledgerName?.trim();
  if (trimmed) return trimmed;

  const { data: profile } = await supabase
    .from("users")
    .select("display_name, email")
    .eq("id", userId)
    .maybeSingle();

  return (
    profile?.display_name?.trim() ||
    profile?.email?.split("@")[0]?.trim() ||
    null
  );
}

export async function syncGroupPlayersFromMembers(
  supabase: SupabaseClient,
  groupId: string
): Promise<ChoraMarketState> {
  const members = await listGroupMembers(supabase, groupId);
  const loaded = await loadGroupState(supabase, groupId);
  const { state, changed } = syncPeopleFromMembers(loaded, members);
  if (changed) await saveGroupState(supabase, groupId, state);
  return state;
}

export async function updateMemberLedgerName(
  supabase: SupabaseClient,
  groupId: string,
  userId: string,
  ledgerName: string
) {
  const { error } = await supabase
    .from("group_members")
    .update({ ledger_name: ledgerName })
    .eq("group_id", groupId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function joinGroupByCode(
  supabase: SupabaseClient,
  userId: string,
  code: string,
  ledgerName?: string
) {
  void ensureUserProfile(supabase);

  const { data, error } = await supabase.rpc("join_group_by_invite", {
    p_code: code.trim().toUpperCase(),
    p_ledger_name: ledgerName?.trim() || null,
  });

  if (error) throw error;

  const group = Array.isArray(data) ? data[0] : data;
  if (!group?.id) throw new Error("Invalid invite code");

  await syncGroupPlayersFromMembers(supabase, group.id as string);
  return group as { id: string; name: string; invite_code: string };
}

export async function listGroupMembers(supabase: SupabaseClient, groupId: string) {
  const { data: members, error: memberErr } = await supabase
    .from("group_members")
    .select("user_id, ledger_name, role, joined_at")
    .eq("group_id", groupId);

  if (memberErr) throw memberErr;
  if (!members?.length) return [];

  const userIds = members.map((m) => m.user_id as string);
  const { data: profiles, error: profileErr } = await supabase
    .from("users")
    .select("id, display_name, avatar_url, email")
    .in("id", userIds);

  if (profileErr) throw profileErr;

  const profileById = new Map(
    (profiles || []).map((p) => [p.id as string, p])
  );

  const rows = members.map((m) => {
    const p = profileById.get(m.user_id as string);
    return {
      user_id: m.user_id as string,
      ledger_name: m.ledger_name as string | null,
      role: m.role as string,
      joined_at: m.joined_at as string,
      display_name: (p?.display_name as string | null) ?? null,
      avatar_url: (p?.avatar_url as string | null) ?? null,
      email: (p?.email as string | null) ?? null,
    };
  });

  return rows.sort((a, b) => {
    if (a.role === "owner" && b.role !== "owner") return -1;
    if (b.role === "owner" && a.role !== "owner") return 1;
    return new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime();
  });
}

export async function uploadAvatar(
  supabase: SupabaseClient,
  userId: string,
  file: File
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file (JPG, PNG, GIF, or WebP).");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Image must be 5 MB or smaller.");
  }

  const ext =
    file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${userId}/avatar.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadErr) throw uploadErr;

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  const publicUrl = `${data.publicUrl}?t=${Date.now()}`;
  return publicUrl;
}

export async function getGroupByInviteCode(supabase: SupabaseClient, code: string) {
  const { data, error } = await supabase
    .from("groups_public")
    .select("id, name, invite_code")
    .eq("invite_code", code.trim().toUpperCase())
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function isGroupMember(
  supabase: SupabaseClient,
  groupId: string,
  userId: string
) {
  const { data, error } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

export type UserGroupRow = {
  group_id: string;
  ledger_name: string | null;
  role: string;
  groups: { id: string; name: string; invite_code: string } | null;
};

export async function listUserGroups(
  supabase: SupabaseClient,
  userId: string
): Promise<UserGroupRow[]> {
  const { data, error } = await supabase
    .from("group_members")
    .select("group_id, ledger_name, role, groups(id, name, invite_code)")
    .eq("user_id", userId);

  if (error) throw error;

  return (data || []).map((row) => {
    const groups = row.groups as
      | { id: string; name: string; invite_code: string }
      | { id: string; name: string; invite_code: string }[]
      | null;

    return {
      group_id: row.group_id as string,
      ledger_name: row.ledger_name as string | null,
      role: row.role as string,
      groups: Array.isArray(groups) ? groups[0] ?? null : groups,
    };
  });
}

export async function getUserProfile(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase.from("users").select("*").eq("id", userId).single();
  if (error) throw error;
  return data;
}

export async function updateUserProfile(
  supabase: SupabaseClient,
  userId: string,
  patch: Record<string, unknown>
) {
  const { error } = await supabase
    .from("users")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) throw error;
}

export async function renameGroup(
  supabase: SupabaseClient,
  groupId: string,
  name: string
) {
  const { error } = await supabase
    .from("groups")
    .update({ name, updated_at: new Date().toISOString() })
    .eq("id", groupId);
  if (error) throw error;
}

export function inviteLink(code: string) {
  if (typeof window === "undefined") return `/join/${code}`;
  return `${window.location.origin}/join/${code}`;
}
