"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { APP_NAME, createDefaultState, defaultRanks } from "@/lib/market/defaults";
import { renameGroup, updateUserProfile, uploadAvatar } from "@/lib/market/db";
import { createDemoState } from "@/hooks/chora-market/demo-state";
import { nowTime } from "@/hooks/chora-market/helpers";
import type { ChoraMarketCore } from "@/hooks/chora-market/useChoraMarketCore";

export function useSettings(core: ChoraMarketCore) {
  const {
    supabase,
    groupId,
    userId,
    save,
    saveWithActivity,
    showToast,
    refreshGroupMembers,
    setProfile,
    setLocalGroupName,
    setScreen,
    initialGroupName,
    loading,
    state,
  } = core;

  const [setAppName, setSetAppName] = useState("");
  const [setCredTitle, setSetCredTitle] = useState("");
  const [setMoochTitle, setSetMoochTitle] = useState("");
  const [setProfitTitle, setSetProfitTitle] = useState("");
  const [setShameTitle, setSetShameTitle] = useState("");
  const [verdictGood, setVerdictGood] = useState("");
  const [verdictBad, setVerdictBad] = useState("");
  const [rankInputs, setRankInputs] = useState<{ title: string; min: number }[]>(defaultRanks());
  const [groupRename, setGroupRename] = useState(initialGroupName);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [notifyEnabled, setNotifyEnabled] = useState(true);
  const [notifyBets, setNotifyBets] = useState(true);
  const [notifyIous, setNotifyIous] = useState(true);
  const [notifyInvites, setNotifyInvites] = useState(true);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const didInit = useRef(false);

  useEffect(() => {
    setGroupRename(initialGroupName);
  }, [initialGroupName]);

  useEffect(() => {
    didInit.current = false;
  }, [core.groupId]);

  useEffect(() => {
    if (loading || didInit.current) return;
    didInit.current = true;
    setSetAppName(state.settings.app);
    setSetCredTitle(state.settings.creditors);
    setSetMoochTitle(state.settings.mooches);
    setSetProfitTitle(state.dashboardTitles?.profit || "Net Profit / Loss");
    setSetShameTitle(state.dashboardTitles?.shame || "Hall of Shame");
    setVerdictGood(state.verdictLabels.good);
    setVerdictBad(state.verdictLabels.bad);
    setRankInputs(state.ranks || defaultRanks());
    const prof = core.profile;
    if (prof) {
      setDisplayName(prof.display_name || "");
      setAvatarUrl(prof.avatar_url || "");
      setNotifyEnabled(prof.notify_enabled ?? true);
      setNotifyBets(prof.notify_bets ?? true);
      setNotifyIous(prof.notify_ious ?? true);
      setNotifyInvites(prof.notify_invites ?? true);
    }
  }, [loading, state, core.groupId, core.profile]);

  const saveProfile = useCallback(async () => {
    try {
      await updateUserProfile(supabase, userId, {
        display_name: displayName.trim() || null,
        avatar_url: avatarUrl.trim() || null,
        notify_enabled: notifyEnabled,
        notify_bets: notifyBets,
        notify_ious: notifyIous,
        notify_invites: notifyInvites,
      });
      setProfile((p) =>
        p
          ? {
              ...p,
              display_name: displayName.trim() || null,
              avatar_url: avatarUrl.trim() || null,
              notify_enabled: notifyEnabled,
              notify_bets: notifyBets,
              notify_ious: notifyIous,
              notify_invites: notifyInvites,
            }
          : p
      );
      await refreshGroupMembers();
      showToast("Profile saved.");
    } catch (e) {
      console.error(e);
      showToast("Failed to save profile.");
    }
  }, [
    supabase,
    userId,
    displayName,
    avatarUrl,
    notifyEnabled,
    notifyBets,
    notifyIous,
    notifyInvites,
    refreshGroupMembers,
    showToast,
    setProfile,
  ]);

  const uploadProfilePhoto = useCallback(
    async (file: File) => {
      setAvatarUploading(true);
      try {
        const url = await uploadAvatar(supabase, userId, file);
        setAvatarUrl(url);
        await updateUserProfile(supabase, userId, { avatar_url: url });
        setProfile((p) => (p ? { ...p, avatar_url: url } : p));
        await refreshGroupMembers();
        showToast("Profile photo updated.");
      } catch (e) {
        console.error(e);
        showToast(e instanceof Error ? e.message : "Photo upload failed.");
      } finally {
        setAvatarUploading(false);
      }
    },
    [supabase, userId, refreshGroupMembers, showToast, setProfile]
  );

  const changePassword = useCallback(
    async (newPassword: string, confirmPassword: string) => {
      if (newPassword.length < 6) return showToast("Password must be at least 6 characters.");
      if (newPassword !== confirmPassword) return showToast("Passwords do not match.");
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        showToast(error.message);
        return false;
      }
      showToast("Password updated.");
      return true;
    },
    [supabase, showToast]
  );

  const saveGroupName = useCallback(async () => {
    const name = groupRename.trim();
    if (!name) return showToast("Group name cannot be empty.");
    try {
      await renameGroup(supabase, groupId, name);
      setLocalGroupName(name);
      showToast("Group renamed.");
    } catch (e) {
      console.error(e);
      showToast("Failed to rename group.");
    }
  }, [supabase, groupId, groupRename, showToast, setLocalGroupName]);

  const saveSettings = useCallback(async () => {
    await saveWithActivity((s) => {
      s.settings.app = setAppName || APP_NAME;
      s.settings.creditors = setCredTitle || "Top Net Creditors";
      s.settings.mooches = setMoochTitle || "Biggest Mooches";
      s.dashboardTitles = s.dashboardTitles || { profit: "Net Profit / Loss", shame: "Hall of Shame" };
      s.dashboardTitles.profit = setProfitTitle || "Net Profit / Loss";
      s.dashboardTitles.shame = setShameTitle || "Hall of Shame";
    });
    showToast("Custom names saved.");
  }, [setAppName, setCredTitle, setMoochTitle, setProfitTitle, setShameTitle, saveWithActivity, showToast]);

  const saveVerdicts = useCallback(async () => {
    await saveWithActivity((s) => {
      s.verdictLabels = {
        good: (verdictGood || "🫡 Respectable").trim(),
        bad: (verdictBad || "🐷 Lucky Piggy").trim(),
      };
    });
    showToast("Community verdict labels saved.");
  }, [verdictGood, verdictBad, saveWithActivity, showToast]);

  const resetVerdicts = useCallback(async () => {
    setVerdictGood("🫡 Respectable");
    setVerdictBad("🐷 Lucky Piggy");
    await saveWithActivity((s) => {
      s.verdictLabels = { good: "🫡 Respectable", bad: "🐷 Lucky Piggy" };
    });
    showToast("Community verdict labels reset.");
  }, [saveWithActivity, showToast]);

  const saveRankTitles = useCallback(async () => {
    const defaults = defaultRanks();
    const ranks = rankInputs
      .map((r, i) => ({
        title: (r.title || defaults[i]?.title || "").trim(),
        min: Number(r.min ?? defaults[i]?.min ?? 0),
      }))
      .filter((r) => r.title && Number.isFinite(r.min))
      .sort((a, b) => Number(b.min) - Number(a.min));
    await saveWithActivity((s) => {
      s.ranks = ranks.length ? ranks : defaults;
    });
    showToast("Rank titles saved.");
  }, [rankInputs, saveWithActivity, showToast]);

  const resetRankTitles = useCallback(async () => {
    const defaults = defaultRanks();
    setRankInputs(defaults);
    await saveWithActivity((s) => {
      s.ranks = defaults;
    });
    showToast("Rank titles reset.");
  }, [saveWithActivity, showToast]);

  const loadDemoData = useCallback(async () => {
    const demo = createDemoState();
    demo.activity.unshift({
      title: "Demo loaded",
      text: "Go to Bet Market to see the active market and Custom Live Bet at Fair Odds.",
      time: nowTime(),
    });
    await save(demo);
    setScreen("bets");
    showToast("Demo data loaded with an active live-odds bet.");
  }, [save, showToast, setScreen]);

  const resetData = useCallback(async () => {
    if (!confirm("Reset everything?")) return;
    await save(createDefaultState());
    showToast("App reset.");
  }, [save, showToast]);

  return {
    setAppName,
    setSetAppName,
    setCredTitle,
    setSetCredTitle,
    setMoochTitle,
    setSetMoochTitle,
    setProfitTitle,
    setSetProfitTitle,
    setShameTitle,
    setSetShameTitle,
    saveSettings,
    verdictGood,
    setVerdictGood,
    verdictBad,
    setVerdictBad,
    saveVerdicts,
    resetVerdicts,
    rankInputs,
    setRankInputs,
    saveRankTitles,
    resetRankTitles,
    groupRename,
    setGroupRename,
    saveGroupName,
    displayName,
    setDisplayName,
    avatarUrl,
    setAvatarUrl,
    notifyEnabled,
    setNotifyEnabled,
    notifyBets,
    setNotifyBets,
    notifyIous,
    setNotifyIous,
    notifyInvites,
    setNotifyInvites,
    saveProfile,
    uploadProfilePhoto,
    changePassword,
    avatarUploading,
    loadDemoData,
    resetData,
  };
}
