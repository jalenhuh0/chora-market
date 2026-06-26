"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  alphaPct,
  communitySettlement,
  fairProfit,
  liveProbability,
  liveSummary,
  marketStats,
  marketStatsExcluding,
  missingVoters,
  predictionStreak,
  predictorColor,
  predictorScore,
  rankingScore,
  repScore,
  totalPicks,
  accuracyPct,
  brierScore,
  calibrationGrade,
  verdictLabel,
  verdictSummary,
  rankForScore,
  marketAlphaDelta,
  reputationDelta,
  wilsonLowerBound,
} from "@/lib/market/calculations";
import {
  APP_NAME,
  clamp,
  createDefaultState,
  defaultRanks,
  estimate,
  initials,
  iouUnsettledFor,
  money,
  normalizeState,
  uid,
} from "@/lib/market/defaults";
import {
  getUserProfile,
  inviteLink,
  listGroupMembers,
  loadGroupState,
  renameGroup,
  saveGroupState,
  updateMemberLedgerName,
  updateUserProfile,
  uploadAvatar,
} from "@/lib/market/db";
import {
  getMyPlayerName,
  memberPlayerName,
  renamePlayerInState,
  syncPeopleFromMembers,
  type GroupMemberProfile,
} from "@/lib/market/members";
import type { Bet, TabMarketState, UserProfile } from "@/lib/market/types";
import { CATEGORIES } from "@/hooks/tab-market/constants";
import { createDemoState } from "@/hooks/tab-market/demo-state";
import { applyExclusiveScaleVote, nowTime } from "@/hooks/tab-market/helpers";
import type { DoubleDownDraft, LiveDraft, Screen, UseTabMarketProps, VoteDraft } from "@/hooks/tab-market/types";
import { useTabMarketComputed } from "@/hooks/tab-market/useTabMarketComputed";

export type { Screen, UseTabMarketProps } from "@/hooks/tab-market/types";

export function useTabMarket({
  groupId,
  groupName: initialGroupName,
  inviteCode,
  userId,
  onSignOut,
  onSwitchGroup,
}: UseTabMarketProps) {
  const supabase = useMemo(() => createClient(), []);
  const [state, setState] = useState<TabMarketState>(() => createDefaultState());
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [toast, setToast] = useState<string | null>(null);
  const [personModal, setPersonModal] = useState<string | null>(null);
  const [localGroupName, setLocalGroupName] = useState(initialGroupName);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMemberProfile[]>([]);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Entry form
  const [reason, setReason] = useState("");
  const [owedSelect, setOwedSelect] = useState("");
  const [owesSelect, setOwesSelect] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");

  // Bet form
  const [betTitle, setBetTitle] = useState("");
  const [sideAUser, setSideAUser] = useState("");
  const [sideBUser, setSideBUser] = useState("");
  const [sideATake, setSideATake] = useState("");
  const [sideBTake, setSideBTake] = useState("");
  const [betStake, setBetStake] = useState("");
  const [betNotes, setBetNotes] = useState("");

  // People form
  const [tagPerson, setTagPerson] = useState("");
  const [tagName, setTagName] = useState("");
  const [tagVoter, setTagVoter] = useState("");
  const [verdictPerson, setVerdictPerson] = useState("");
  const [verdictChoice, setVerdictChoice] = useState("good");
  const [verdictVoter, setVerdictVoter] = useState("");

  // Settings form
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

  // Per-bet drafts
  const [voteDrafts, setVoteDrafts] = useState<Record<string, { a: VoteDraft; b: VoteDraft }>>({});
  const [liveDrafts, setLiveDrafts] = useState<Record<string, LiveDraft>>({});
  const [ddDrafts, setDdDrafts] = useState<Record<string, DoubleDownDraft>>({});

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 3300);
  }, []);

  const save = useCallback(
    async (next: TabMarketState) => {
      const normalized = normalizeState(structuredClone(next));
      setState(normalized);
      try {
        await saveGroupState(supabase, groupId, normalized);
      } catch (e) {
        console.error("Save failed", e);
        showToast("Save warning: could not sync to server.");
      }
    },
    [supabase, groupId, showToast]
  );

  const saveWithActivity = useCallback(
    async (mutate: (s: TabMarketState) => void, activity?: { title: string; text: string }) => {
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
        setSetAppName(synced.settings.app);
        setSetCredTitle(synced.settings.creditors);
        setSetMoochTitle(synced.settings.mooches);
        setSetProfitTitle(synced.dashboardTitles?.profit || "Net Profit / Loss");
        setSetShameTitle(synced.dashboardTitles?.shame || "Hall of Shame");
        setVerdictGood(synced.verdictLabels.good);
        setVerdictBad(synced.verdictLabels.bad);
        setRankInputs(synced.ranks || defaultRanks());
        if (synced.people.length) {
          setOwedSelect(synced.people[0]);
          setOwesSelect(synced.people[1] || synced.people[0]);
          setSideAUser(synced.people[0]);
          setSideBUser(synced.people[1] || synced.people[0]);
          setTagPerson(synced.people[0]);
          setTagVoter(synced.people[0]);
          setVerdictPerson(synced.people[0]);
          setVerdictVoter(synced.people[0]);
        }
        if (synced.scale?.length) setTagName(synced.scale[0].label);
        if (prof) {
          setProfile(prof);
          setDisplayName(prof.display_name || "");
          setAvatarUrl(prof.avatar_url || "");
          setNotifyEnabled(prof.notify_enabled ?? true);
          setNotifyBets(prof.notify_bets ?? true);
          setNotifyIous(prof.notify_ious ?? true);
          setNotifyInvites(prof.notify_invites ?? true);
        }
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
    setGroupRename(initialGroupName);
  }, [initialGroupName]);

  const showScreen = useCallback((name: Screen) => {
    setScreen(name);
  }, []);

  const copyInviteLink = useCallback(async () => {
    const link = inviteLink(inviteCode);
    try {
      await navigator.clipboard.writeText(link);
      showToast("Invite link copied.");
    } catch {
      showToast(link);
    }
  }, [inviteCode, showToast]);

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
    [supabase, userId, refreshGroupMembers, showToast]
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
  }, [supabase, groupId, groupRename, showToast]);

  const addDebt = useCallback(async () => {
    const owed = owedSelect;
    const owes = owesSelect;
    const r = reason.trim() || "Untitled IOU";
    if (owed === owes) return showToast("Owed and owes must be different people.");
    const amt = amount || String(estimate(r));
    await saveWithActivity(
      (s) => {
        s.debts.unshift({
          id: uid(),
          reason: r,
          owed,
          owes,
          amount: Number(amt),
          category,
          settled: false,
          created: Date.now(),
        });
      },
      { title: "New IOU", text: `${owes} owes ${owed} ${money(amt)} for ${r}` }
    );
    setReason("");
    setAmount("");
    showToast("IOU added to the market.");
  }, [owedSelect, owesSelect, reason, amount, category, saveWithActivity, showToast]);

  const parseReason = useCallback(() => {
    const r = reason.toLowerCase();
    state.people.forEach((p) => {
      const re = new RegExp(p.toLowerCase());
      if (re.test(r)) {
        if (/owes|lost/.test(r)) setOwesSelect(p);
        else setOwedSelect(p);
      }
    });
    setAmount(String(estimate(r)));
    if (/bet|lost|wins|winner/.test(r)) setCategory("Bet");
    else if (/borrowed|hoodie|monitor|item/.test(r)) setCategory("Item");
    else if (/ride|airport|uber/.test(r)) setCategory("Ride");
    else if (/food|dinner|boba|coffee|sushi|cane|chipotle/.test(r)) setCategory("Food");
    showToast("Parsed reason and suggested fields.");
  }, [reason, state.people, showToast]);

  const settleDebt = useCallback(
    async (id: string) => {
      const d = state.debts.find((x) => x.id === id);
      if (!d) return;
      await saveWithActivity(
        (s) => {
          const debt = s.debts.find((x) => x.id === id);
          if (debt) debt.settled = true;
        },
        { title: "Settled IOU", text: `${d.owes} settled ${money(d.amount)} with ${d.owed}.` }
      );
    },
    [state.debts, saveWithActivity]
  );

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
  }, [groupMembers, userId, showToast, supabase, groupId, save]);

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

  const createBet = useCallback(async () => {
    const title = betTitle.trim();
    if (!title) return showToast("Add a bet title first.");
    if (sideAUser === sideBUser) return showToast("Pick two different people.");
    const creator = getMyPlayerName(groupMembers, userId);
    if (!creator) return showToast("Set your player name in People before creating a bet.");
    await saveWithActivity(
      (s) => {
        const bet: Bet = {
          id: uid(),
          title,
          sideAUser,
          sideBUser,
          sideATake: sideATake || "Take A",
          sideBTake: sideBTake || "Take B",
          creator,
          stake: Number(betStake || 20),
          notes: betNotes,
          status: "open",
          votes: {},
          doubleDowns: [],
          created: Date.now(),
        };
        s.bets.unshift(bet);
        s.notifs.unshift({
          title: "New friend bet market",
          text: `${bet.sideAUser} vs ${bet.sideBUser}: ${bet.title}. Group can submit odds now.`,
        });
      },
      {
        title: "Bet market launched",
        text: `${sideAUser} backs "${sideATake || "Take A"}" vs ${sideBUser} backs "${sideBTake || "Take B"}"`,
      }
    );
    setBetTitle("");
    setSideATake("");
    setSideBTake("");
    setBetStake("");
    setBetNotes("");
    setScreen("bets");
    showToast("Active bet market created.");
  }, [betTitle, sideAUser, sideBUser, sideATake, sideBTake, groupMembers, userId, betStake, betNotes, saveWithActivity, showToast]);

  const deleteBet = useCallback(
    async (betId: string) => {
      const b = stateRef.current.bets.find((x) => x.id === betId);
      if (!b) return;
      const myName = getMyPlayerName(groupMembers, userId);
      if (!myName || b.creator !== myName) {
        showToast("Only the bet creator can delete this market.");
        return;
      }
      if (b.status && b.status !== "open") {
        showToast("Resolved bets cannot be deleted.");
        return;
      }
      if (!confirm(`Delete "${b.title || "Untitled Bet"}"? This cannot be undone.`)) return;

      await saveWithActivity(
        (s) => {
          s.bets = s.bets.filter((x) => x.id !== betId);
          s.notifs.unshift({
            title: "Bet market deleted",
            text: `${myName} removed ${b.title || "a bet market"}.`,
          });
        },
        {
          title: "Bet market deleted",
          text: `${b.title || "Untitled Bet"} was removed by ${myName}.`,
        }
      );
      showToast("Bet market deleted.");
    },
    [groupMembers, userId, saveWithActivity, showToast]
  );

  const defaultVoteVoter = useCallback(
    () => getMyPlayerName(groupMembers, userId) || state.people[0] || "",
    [groupMembers, userId, state.people]
  );

  const getVoteDraft = useCallback(
    (betId: string, side: "a" | "b"): VoteDraft => {
      const fallback = defaultVoteVoter();
      const bet = state.bets.find((x) => x.id === betId);
      const market = bet ? marketStats(bet) : null;
      const defaultConfA = market?.hasMarket ? Math.round(market.pa * 100) : 50;
      const defaultConfB = market?.hasMarket ? Math.round(market.pb * 100) : 50;
      const defaultConf = side === "a" ? defaultConfA : defaultConfB;
      const d = voteDrafts[betId];
      const raw = d ? (side === "a" ? d.a : d.b) : { voter: "", conf: defaultConf };
      return {
        voter: raw.voter.trim() || fallback,
        conf: raw.conf ?? defaultConf,
      };
    },
    [voteDrafts, defaultVoteVoter, state.bets]
  );

  const setVoteDraft = useCallback(
    (betId: string, side: "a" | "b", patch: Partial<VoteDraft>) => {
      setVoteDrafts((prev) => {
        const fallback = defaultVoteVoter();
        const bet = state.bets.find((x) => x.id === betId);
        const market = bet ? marketStats(bet) : null;
        const defaultConfA = market?.hasMarket ? Math.round(market.pa * 100) : 50;
        const defaultConfB = market?.hasMarket ? Math.round(market.pb * 100) : 50;
        const current = prev[betId] || {
          a: { voter: fallback, conf: defaultConfA },
          b: { voter: fallback, conf: defaultConfB },
        };
        const key = side === "a" ? "a" : "b";
        return { ...prev, [betId]: { ...current, [key]: { ...current[key], ...patch } } };
      });
    },
    [defaultVoteVoter, state.bets]
  );

  const voteBet = useCallback(
    async (betId: string, pick: "a" | "b") => {
      const draft = getVoteDraft(betId, pick);
      const voter = draft.voter.trim();
      if (!voter) {
        showToast("Pick a voter before submitting odds.");
        return;
      }
      const raw = clamp(Number(draft.conf || 50), 1, 99);
      const probA = pick === "a" ? raw : 100 - raw;
      const bet = state.bets.find((x) => x.id === betId);
      if (!bet) return;
      await saveWithActivity(
        (s) => {
          const b = s.bets.find((x) => x.id === betId);
          if (!b) return;
          if (!s.people.includes(voter)) s.people.push(voter);
          b.votes[voter] = { pick: probA >= 50 ? "a" : "b", probA, ts: Date.now() };
          s.notifs.unshift({
            title: "Market probability split",
            text: `${voter} set ${b.sideAUser} ${probA}% / ${b.sideBUser} ${100 - probA}% in ${b.title}.`,
          });
        },
        undefined
      );
      showToast(`${voter} set odds: ${bet.sideAUser} ${probA}% / ${bet.sideBUser} ${100 - probA}%.`);
    },
    [getVoteDraft, state.bets, saveWithActivity, showToast]
  );

  const resolveBet = useCallback(
    async (betId: string) => {
      const b = stateRef.current.bets.find((x) => x.id === betId);
      if (!b) return;
      if (!Object.keys(b.votes || {}).length) {
        showToast("Resolving with no market votes. Prediction stats will not change.");
      }
      const winner = prompt(
        `Who won the bet? Type A for ${b.sideAUser}: "${b.sideATake}" or B for ${b.sideBUser}: "${b.sideBTake}"`,
        "A"
      );
      if (!winner) return;
      const winSide = winner.toLowerCase().startsWith("b") ? "b" : "a";
      const winnerPerson = winSide === "a" ? b.sideAUser : b.sideBUser;
      const loserPerson = winSide === "a" ? b.sideBUser : b.sideAUser;
      const stake = Number(b.stake || 0);
      const market = marketStats(b);
      const winProb = winSide === "a" ? market.pa : market.pb;
      const iouAmount =
        stake > 0 && market.hasMarket ? communitySettlement(stake, winProb) : stake;
      const marketPct = Math.round(winProb * 100);

      await saveWithActivity((s) => {
        const bet = s.bets.find((x) => x.id === betId);
        if (!bet) return;

        const defaultStats = () => ({
          correct: 0,
          wrong: 0,
          profit: 0,
          elo: 1000,
          alphaSum: 0,
          alphaCount: 0,
          brierSum: 0,
        });

        Object.entries(bet.votes || {}).forEach(([p, v]) => {
          const voter = p.trim();
          if (!voter) return;
          if (!s.people.includes(voter)) s.people.push(voter);
          s.stats[voter] = s.stats[voter] || defaultStats();

          const peerMarket = marketStatsExcluding(bet, voter);
          const marketProbWinner = winSide === "a" ? peerMarket.pa : peerMarket.pb;
          const predProbWinner =
            (winSide === "a" ? Number(v.probA ?? 50) : 100 - Number(v.probA ?? 50)) / 100;
          const pickedWinner = predProbWinner >= 0.5;
          const delta = reputationDelta(predProbWinner, marketProbWinner, pickedWinner);
          if (pickedWinner) {
            s.stats[voter].correct++;
          } else {
            s.stats[voter].wrong++;
          }
          const alpha = marketAlphaDelta(predProbWinner, marketProbWinner);
          s.stats[voter].alphaSum = (s.stats[voter].alphaSum || 0) + alpha;
          s.stats[voter].alphaCount = (s.stats[voter].alphaCount || 0) + 1;
          const outcome = pickedWinner ? 1 : 0;
          s.stats[voter].brierSum = (s.stats[voter].brierSum || 0) + Math.pow(predProbWinner - outcome, 2);
          s.stats[voter].elo = clamp((s.stats[voter].elo || 1000) + delta, 100, 3000);
        });

        if ((bet.doubleDowns || []).length) {
          const liveResult = prompt(
            "For custom live bets, did the live YES condition happen? Type Y for yes or N for no.",
            "Y"
          );
          if (liveResult) {
            const yesWon = liveResult.toLowerCase().startsWith("y");
            bet.doubleDowns.forEach((dd) => {
              const won = (dd.side === "yes") === yesWon;
              dd.resolved = true;
              dd.won = won;
              const person = dd.person.trim();
              if (person && !s.people.includes(person)) s.people.push(person);
              if (person) {
                s.stats[person] = s.stats[person] || defaultStats();
                // Custom live bets do not change stake W/L — track via IOUs manually if needed.
              }
            });
            s.activity.unshift({
              title: "Custom live bets resolved",
              text: `${bet.doubleDowns.length} custom live bet(s) settled on the bet market.`,
              time: nowTime(),
            });
          }
        }

        bet.status = "resolved";
        bet.winner = winSide;

        if (stake > 0 && winnerPerson !== loserPerson) {
          const oddsNote = market.hasMarket
            ? ` at ${marketPct}% community odds`
            : " (flat stake — no community odds yet)";
          const iouReason = `Bet: ${bet.title || "Untitled"} — ${loserPerson} lost${oddsNote}`;
          s.debts.unshift({
            id: uid(),
            reason: iouReason,
            owed: winnerPerson,
            owes: loserPerson,
            amount: iouAmount,
            category: "Bet",
            settled: false,
            created: Date.now(),
          });
          s.notifs.unshift({
            title: "Bet IOU recorded",
            text: `${loserPerson} owes ${winnerPerson} ${money(iouAmount)} for ${bet.title || "resolved bet"}${market.hasMarket ? ` (${marketPct}% community price)` : ""}.`,
          });

          if (!s.stats[winnerPerson]) s.stats[winnerPerson] = defaultStats();
          if (!s.stats[loserPerson]) s.stats[loserPerson] = defaultStats();
          s.stats[winnerPerson].profit += iouAmount;
          s.stats[loserPerson].profit -= iouAmount;
        }

        s.activity.unshift({
          title: "Bet resolved",
          text:
            stake > 0 && winnerPerson !== loserPerson
              ? `${winnerPerson} beat ${loserPerson} on ${bet.title}. IOU: ${loserPerson} owes ${winnerPerson} ${money(iouAmount)}${market.hasMarket ? ` at ${marketPct}% community odds` : ""}.`
              : `${winnerPerson} beat ${loserPerson} on ${bet.title}. Prediction stats updated.`,
          time: nowTime(),
        });
      });
      setScreen("dashboard");
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      showToast(
        stake > 0 && winnerPerson !== loserPerson
          ? market.hasMarket
            ? `Bet resolved. ${loserPerson} owes ${winnerPerson} ${money(iouAmount)} at ${marketPct}% community odds.`
            : `Bet resolved. ${loserPerson} owes ${winnerPerson} ${money(iouAmount)} (flat stake — add group odds next time for community pricing).`
          : "Bet resolved. Dashboard updated with predictors, alpha, and profit/loss."
      );
    },
    [saveWithActivity, showToast]
  );

  const getLiveDraft = useCallback(
    (bet: Bet): LiveDraft => {
      const base = bet.live || { target: "", total: "", made: "", attempted: "", p: 35 };
      return { ...base, ...liveDrafts[bet.id] };
    },
    [liveDrafts]
  );

  const setLiveDraft = useCallback((betId: string, patch: Partial<LiveDraft>) => {
    setLiveDrafts((prev) => ({ ...prev, [betId]: { ...prev[betId], ...patch } }));
  }, []);

  const updateLiveOdds = useCallback(
    async (betId: string) => {
      const bet = state.bets.find((x) => x.id === betId);
      if (!bet) return;
      const draft = getLiveDraft(bet);
      const live = {
        target: Number(draft.target || 0),
        total: Number(draft.total || 0),
        made: Number(draft.made || 0),
        attempted: Number(draft.attempted || 0),
        p: Number(draft.p || 35),
      };
      if (live.attempted > live.total) return showToast("Attempted so far cannot be bigger than total attempts.");
      if (live.made > live.attempted) return showToast("Made so far cannot be bigger than attempted so far.");
      await saveWithActivity(
        (s) => {
          const b = s.bets.find((x) => x.id === betId);
          if (b) b.live = live;
        },
        {
          title: "Live odds updated",
          text: `${bet.title}: ${liveSummary({ ...bet, live })}. Current YES odds ${Math.round((liveProbability({ ...bet, live }) || 0) * 100)}%.`,
        }
      );
      showToast("Current live odds calculated.");
    },
    [state.bets, getLiveDraft, saveWithActivity, showToast]
  );

  const getDdDraft = useCallback(
    (bet: Bet): DoubleDownDraft => {
      const base: DoubleDownDraft = {
        person: state.people[0] || "",
        side: "yes",
        stake: Number(bet.stake || 20),
      };
      return { ...base, ...ddDrafts[bet.id] };
    },
    [ddDrafts, state.people]
  );

  const setDdDraft = useCallback((betId: string, patch: Partial<DoubleDownDraft>) => {
    setDdDrafts((prev) => ({ ...prev, [betId]: { ...prev[betId], ...patch } as DoubleDownDraft }));
  }, []);

  const previewLiveBet = useCallback(
    (bet: Bet) => {
      const prob = liveProbability(bet);
      if (prob === null) return null;
      const dd = getDdDraft(bet);
      const sideProb = dd.side === "yes" ? prob : 1 - prob;
      const stake = Number(dd.stake || bet.stake || 20);
      const profit = fairProfit(stake, sideProb);
      return {
        odds: Math.round(sideProb * 100) + "%",
        risk: money(stake),
        profit: money(profit),
        payout: money(stake + profit),
      };
    },
    [getDdDraft]
  );

  const addDoubleDown = useCallback(
    async (betId: string) => {
      const bet = state.bets.find((x) => x.id === betId);
      if (!bet) return;
      const prob = liveProbability(bet);
      if (prob === null) return showToast("Calculate current odds before adding a custom live bet.");
      const dd = getDdDraft(bet);
      const sideProb = dd.side === "yes" ? prob : 1 - prob;
      const stake = Number(dd.stake || bet.stake || 20);
      const fair = fairProfit(stake, sideProb);
      const totalPayout = stake + fair;
      await saveWithActivity(
        (s) => {
          const b = s.bets.find((x) => x.id === betId);
          if (!b) return;
          b.doubleDowns = b.doubleDowns || [];
          b.doubleDowns.unshift({
            id: uid(),
            person: dd.person,
            side: dd.side,
            stake,
            prob: sideProb,
            fairProfit: fair,
            totalPayout,
            note: liveSummary(b),
            created: Date.now(),
          });
          s.notifs.unshift({
            title: "Custom live bet placed",
            text: `${dd.person} put ${money(stake)} on ${dd.side === "yes" ? "YES" : "NO"} in ${b.title}. Fair payout: ${money(totalPayout)}.`,
          });
          s.activity.unshift({
            title: "Custom live bet",
            text: `${dd.person} risked ${money(stake)} on ${dd.side === "yes" ? "YES" : "NO"} at ${Math.round(sideProb * 100)}% live odds. Fair payout ${money(totalPayout)}.`,
            time: nowTime(),
          });
        },
        undefined
      );
      showToast("Custom live bet added.");
    },
    [state.bets, getDdDraft, saveWithActivity, showToast]
  );

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
  }, [save, showToast]);

  const resetData = useCallback(async () => {
    if (!confirm("Reset everything?")) return;
    await save(createDefaultState());
    showToast("App reset.");
  }, [save, showToast]);

  const showPersonDetail = useCallback((person: string) => setPersonModal(person), []);
  const closePersonDetail = useCallback(() => setPersonModal(null), []);

  const {
    normalized,
    openDebts,
    groupVolume,
    activeBets,
    resolvedBets,
    sortedBal,
    counts,
    worstLabel,
    predictors,
    alphaRows,
    profitRows,
    brierRows,
    accuracyRows,
    consistencyRows,
    improvedRows,
    hotStreaks,
    verdictRows,
    shameRows,
    personDetail,
  } = useTabMarketComputed(state, personModal);

  return {
    loading,
    state: normalized,
    screen,
    showScreen,
    toast,
    personModal,
    personDetail,
    showPersonDetail,
    closePersonDetail,
    localGroupName,
    profile,
    groupMembers,
    userId,
    avatarUploading,
    uploadProfilePhoto,
    changePassword,
    refreshGroupMembers,
    onSignOut,
    onSwitchGroup,
    copyInviteLink,
    inviteCode,
    categories: CATEGORIES,

    // Metrics
    groupVolume,
    openDebts,
    activeBets,
    resolvedBets,
    sortedBal,
    predictors,
    alphaRows,
    profitRows,
    brierRows,
    accuracyRows,
    consistencyRows,
    improvedRows,
    hotStreaks,
    verdictRows,
    shameRows,
    counts,
    worstLabel,

    // Entry form
    reason,
    setReason,
    owedSelect,
    setOwedSelect,
    owesSelect,
    setOwesSelect,
    amount,
    setAmount,
    category,
    setCategory,
    addDebt,
    parseReason,
    settleDebt,

    // Bet form
    betTitle,
    setBetTitle,
    sideAUser,
    setSideAUser,
    sideBUser,
    setSideBUser,
    sideATake,
    setSideATake,
    sideBTake,
    setSideBTake,
    betStake,
    setBetStake,
    betNotes,
    setBetNotes,
    createBet,
    deleteBet,
    voteBet,
    resolveBet,
    getVoteDraft,
    setVoteDraft,
    getLiveDraft,
    setLiveDraft,
    updateLiveOdds,
    getDdDraft,
    setDdDraft,
    previewLiveBet,
    addDoubleDown,
    missingVoters: (b: Bet) => missingVoters(b, normalized.people),
    marketStats,

    // People
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

    // Settings
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
    loadDemoData,
    resetData,

    // Helpers
    money,
    iouUnsettledFor,
    initials,
    alphaPct: (p: string) => alphaPct(normalized, p),
    repScore: (p: string) => repScore(normalized, p),
    rankForScore: (score: number) => rankForScore(normalized, score),
    verdictLabel: (p: string) => verdictLabel(normalized, p),
    verdictSummary: (p: string) => verdictSummary(normalized, p),
    predictorScore: (p: string) => predictorScore(normalized, p),
    predictorColor,
    totalPicks: (p: string) => totalPicks(normalized, p),
    accuracyPct: (p: string) => accuracyPct(normalized, p),
    calibrationGrade: (p: string) => calibrationGrade(normalized, p),
    brierScore: (p: string) => brierScore(normalized, p),
    predictionStreak: (p: string) => predictionStreak(normalized, p),
    wilsonLowerBound,
    rankingScore: (p: string, mode?: string) => rankingScore(normalized, p, mode),
    liveProbability,
    liveSummary,
    fairProfit,
    communitySettlement,
  };
}

export type TabMarketHook = ReturnType<typeof useTabMarket>;
