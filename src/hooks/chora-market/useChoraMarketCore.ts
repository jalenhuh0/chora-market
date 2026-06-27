"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createDefaultState, normalizeState, SAVE_DEBOUNCE_MS } from "@/lib/market/defaults";
import {
  getUserProfile,
  inviteLink,
  listGroupMembers,
  loadGroupState,
  saveGroupState,
} from "@/lib/market/db";
import { syncPeopleFromMembers, type GroupMemberProfile } from "@/lib/market/members";
import type { ChoraMarketState, UserProfile } from "@/lib/market/types";
import { nowTime } from "@/hooks/chora-market/helpers";
import type { Screen, UseChoraMarketProps } from "@/hooks/chora-market/types";

export function useChoraMarketCore({
  groupId,
  groupName: initialGroupName,
  inviteCode,
  userId,
  onSignOut,
  onSwitchGroup,
}: UseChoraMarketProps) {
  const supabase = useMemo(() => createClient(), []);
  const [state, setState] = useState<ChoraMarketState>(() => createDefaultState());
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [toast, setToast] = useState<string | null>(null);
  const [personModal, setPersonModal] = useState<string | null>(null);
  const [localGroupName, setLocalGroupName] = useState(initialGroupName);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMemberProfile[]>([]);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef(state);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = useRef<ChoraMarketState | null>(null);
  const supabaseRef = useRef(supabase);
  const groupIdRef = useRef(groupId);

  useEffect(() => {
    supabaseRef.current = supabase;
    groupIdRef.current = groupId;
  }, [supabase, groupId]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 3300);
  }, []);

  const flushSave = useCallback(async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    const pending = pendingSaveRef.current;
    if (!pending) return;
    pendingSaveRef.current = null;
    try {
      await saveGroupState(supabaseRef.current, groupIdRef.current, pending);
    } catch (e) {
      console.error("Save failed", e);
      showToast("Save warning: could not sync to server.");
    }
  }, [showToast]);

  const scheduleSave = useCallback(
    (normalized: ChoraMarketState) => {
      pendingSaveRef.current = normalized;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        saveTimerRef.current = null;
        void flushSave();
      }, SAVE_DEBOUNCE_MS);
    },
    [flushSave]
  );

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      const pending = pendingSaveRef.current;
      if (pending) {
        pendingSaveRef.current = null;
        saveGroupState(supabaseRef.current, groupIdRef.current, pending).catch((e) => {
          console.error("Save flush on unmount failed", e);
        });
      }
    };
  }, []);

  const save = useCallback(
    async (next: ChoraMarketState) => {
      const normalized = normalizeState(structuredClone(next));
      setState(normalized);
      scheduleSave(normalized);
    },
    [scheduleSave]
  );

  const saveWithActivity = useCallback(
    async (mutate: (s: ChoraMarketState) => void, activity?: { title: string; text: string }) => {
      const next = normalizeState(structuredClone(stateRef.current));
      mutate(next);
      if (activity) next.activity.unshift({ ...activity, time: nowTime() });
      await save(next);
    },
    [save]
  );

  const refreshGroupMembers = useCallback(async () => {
    try {
      const members = await listGroupMembers(supabase, groupId);
      setGroupMembers(members);
      setState((prev) => {
        const { state: synced, changed } = syncPeopleFromMembers(prev, members);
        if (changed) {
          saveGroupState(supabase, groupId, synced).catch((e) => {
            console.error("sync players failed", e);
          });
        }
        return synced;
      });
    } catch (e) {
      console.warn("refreshGroupMembers", e);
    }
  }, [supabase, groupId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [loaded, prof, members] = await Promise.all([
          loadGroupState(supabase, groupId),
          getUserProfile(supabase, userId).catch(() => null),
          listGroupMembers(supabase, groupId).catch((e) => {
            console.error("listGroupMembers", e);
            return [] as Awaited<ReturnType<typeof listGroupMembers>>;
          }),
        ]);
        if (cancelled) return;
        setGroupMembers(members);
        const normalized = normalizeState(loaded);
        const { state: synced, changed } = syncPeopleFromMembers(normalized, members);
        if (changed) {
          await saveGroupState(supabase, groupId, synced);
        }
        setState(synced);
        if (prof) setProfile(prof);
      } catch (e) {
        console.error("Load failed", e);
        showToast("Failed to load group data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, groupId, userId, showToast]);

  useEffect(() => {
    setLocalGroupName(initialGroupName);
  }, [initialGroupName]);

  const showScreen = useCallback((name: Screen) => {
    setScreen(name);
  }, []);

  const copyInviteLink = useCallback(async () => {
    const ref =
      profile?.display_name?.trim() ||
      groupMembers.find((m) => m.user_id === userId)?.ledger_name?.trim() ||
      undefined;
    const link = inviteLink(inviteCode, ref);
    try {
      await navigator.clipboard.writeText(link);
      showToast("Invite link copied.");
    } catch {
      showToast(link);
    }
  }, [inviteCode, profile?.display_name, groupMembers, userId, showToast]);

  const showPersonDetail = useCallback((person: string) => setPersonModal(person), []);
  const closePersonDetail = useCallback(() => setPersonModal(null), []);

  return {
    supabase,
    groupId,
    userId,
    inviteCode,
    onSignOut,
    onSwitchGroup,
    state,
    setState,
    stateRef,
    loading,
    screen,
    setScreen,
    showScreen,
    toast,
    personModal,
    localGroupName,
    setLocalGroupName,
    profile,
    setProfile,
    groupMembers,
    setGroupMembers,
    showToast,
    save,
    saveWithActivity,
    refreshGroupMembers,
    copyInviteLink,
    showPersonDetail,
    closePersonDetail,
    initialGroupName,
  };
}

export type ChoraMarketCore = ReturnType<typeof useChoraMarketCore>;
