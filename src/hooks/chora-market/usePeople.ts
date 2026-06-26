"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { renamePlayerInState, getMyPlayerName, memberPlayerName } from "@/lib/market/members";
import { updateMemberLedgerName } from "@/lib/market/db";
import { applyExclusiveScaleVote, nowTime } from "@/hooks/chora-market/helpers";
import type { ChoraMarketCore } from "@/hooks/chora-market/useChoraMarketCore";

export function usePeople(core: ChoraMarketCore) {
  const { state, stateRef, groupMembers, setGroupMembers, supabase, groupId, userId, save, saveWithActivity, showToast } = core;

  const [tagPerson, setTagPerson] = useState("");
  const [tagName, setTagName] = useState("");
  const [tagVoter, setTagVoter] = useState("");
  const [verdictPerson, setVerdictPerson] = useState("");
  const [verdictChoice, setVerdictChoice] = useState("good");
  const [verdictVoter, setVerdictVoter] = useState("");
  const didInit = useRef(false);

  useEffect(() => {
    didInit.current = false;
  }, [core.groupId]);

  useEffect(() => {
    if (core.loading || didInit.current) return;
    didInit.current = true;
    if (core.state.people.length) {
      setTagPerson(core.state.people[0]);
      setTagVoter(core.state.people[0]);
      setVerdictPerson(core.state.people[0]);
      setVerdictVoter(core.state.people[0]);
    }
    if (core.state.scale?.length) setTagName(core.state.scale[0].label);
  }, [core.loading, core.state.people, core.state.scale, core.groupId]);

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

  const castTag = useCallback(async () => {
    if (tagPerson === tagVoter) return showToast("You can tag yourself, but pick someone else for better drama.");
    await saveWithActivity(
      (s) => {
        applyExclusiveScaleVote(s, tagPerson, tagVoter, tagName);
      },
      { title: "Community Rating", text: `${tagVoter} rated ${tagPerson}: ${tagName}.` }
    );
    showToast("Rating saved. GOAT and worst-title votes are exclusive per voter.");
  }, [tagPerson, tagVoter, tagName, saveWithActivity, showToast]);

  const quickTag = useCallback(
    async (target: string, tag: string) => {
      const voter = prompt("Who is casting this tag vote?", state.people[0] || "");
      if (!voter) return;
      if (!state.people.includes(voter)) return showToast("Voter must be in the group.");
      await saveWithActivity(
        (s) => {
          applyExclusiveScaleVote(s, target, voter, tag);
        },
        { title: "Community Rating", text: `${voter} rated ${target}: ${tag}.` }
      );
      showToast("Rating saved. GOAT and worst-title votes are exclusive per voter.");
    },
    [state.people, saveWithActivity, showToast]
  );

  const castVerdictVote = useCallback(async () => {
    if (verdictPerson === verdictVoter) return showToast("Pick someone else for the verdict.");
    await saveWithActivity(
      (s) => {
        s.verdictVotes[verdictPerson] = s.verdictVotes[verdictPerson] || {};
        s.verdictVotes[verdictPerson][verdictVoter] = verdictChoice;
      },
      {
        title: "Community Verdict",
        text: `${verdictVoter} voted ${verdictPerson} as ${verdictChoice === "good" ? state.verdictLabels.good : state.verdictLabels.bad}.`,
      }
    );
    showToast("Verdict vote saved.");
  }, [verdictPerson, verdictVoter, verdictChoice, state.verdictLabels, saveWithActivity, showToast]);

  return {
    myPlayerName: getMyPlayerName(groupMembers, userId),
    renameMyPlayer,
    tagPerson,
    setTagPerson,
    tagName,
    setTagName,
    tagVoter,
    setTagVoter,
    castTag,
    quickTag,
    verdictPerson,
    setVerdictPerson,
    verdictChoice,
    setVerdictChoice,
    verdictVoter,
    setVerdictVoter,
    castVerdictVote,
  };
}
