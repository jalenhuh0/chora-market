"use client";

import { useCallback } from "react";
import { renamePlayerInState, getMyPlayerName, memberPlayerName } from "@/lib/market/members";
import { updateMemberLedgerName } from "@/lib/market/db";
import { applyExclusiveScaleVote, nowTime } from "@/hooks/chora-market/helpers";
import type { ChoraMarketCore } from "@/hooks/chora-market/useChoraMarketCore";

export function usePeople(core: ChoraMarketCore) {
  const { stateRef, groupMembers, setGroupMembers, supabase, groupId, userId, save, saveWithActivity, showToast } = core;

  const renameMyPlayer = useCallback(async () => {
    const old = getMyPlayerName(groupMembers, userId);
    if (!old) {
      showToast("Could not find your player name.");
      return;
    }

    const n = prompt("New player name", old)?.trim();
    if (!n || n === old) return;

    if (groupMembers.some((m) => m.user_id !== userId && memberPlayerName(m) === n)) {
      showToast("That name is already taken by another member.");
      return;
    }

    try {
      await updateMemberLedgerName(supabase, groupId, userId, n);
    } catch (e) {
      console.error("updateMemberLedgerName", e);
      showToast("Could not update your player name.");
      return;
    }

    setGroupMembers((prev) =>
      prev.map((m) => (m.user_id === userId ? { ...m, ledger_name: n } : m))
    );

    const next = renamePlayerInState(stateRef.current, old, n);
    next.activity.unshift({
      title: "Renamed player",
      text: `You are now ${n} in this group.`,
      time: nowTime(),
    });
    await save(next);
    showToast(`You are now ${n}.`);
  }, [groupMembers, userId, showToast, supabase, groupId, save, setGroupMembers, stateRef]);

  const quickTag = useCallback(
    async (target: string, tag: string) => {
      const voter = getMyPlayerName(groupMembers, userId);
      if (!voter) return showToast("Set your player name when you join the group.");
      if (target === voter) return showToast("Pick someone else for an allegation.");

      await saveWithActivity(
        (s) => {
          applyExclusiveScaleVote(s, target, voter, tag);
        },
        { title: "Friend allegation", text: `${voter} tagged ${target}: ${tag}.` }
      );
      showToast("Allegation saved.");
    },
    [groupMembers, userId, saveWithActivity, showToast]
  );

  return {
    myPlayerName: getMyPlayerName(groupMembers, userId),
    renameMyPlayer,
    quickTag,
  };
}
