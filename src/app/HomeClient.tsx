"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import TabMarketApp from "@/components/TabMarketApp";
import { AuthForm } from "@/components/AuthForm";
import { GroupGate } from "@/components/GroupGate";
import { getGroupByInviteCode, isGroupMember } from "@/lib/market/db";
import { APP_NAME } from "@/lib/market/defaults";

type GroupInfo = {
  id: string;
  name: string;
  invite_code: string;
};

export default function HomeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const joinCode = searchParams.get("join");

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [showGroupGate, setShowGroupGate] = useState(false);
  const [pendingInvite, setPendingInvite] = useState<string | null>(null);

  const supabase = createClient();

  const loadSession = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUserId(user?.id ?? null);
    setEmail(user?.email ?? null);

    if (!user) {
      setGroup(null);
      setShowGroupGate(false);
      setPendingInvite(null);
      setLoading(false);
      return;
    }

    try {
      const { ensureUserProfile } = await import("@/lib/market/db");
      await ensureUserProfile(supabase);
    } catch (e) {
      console.warn("ensureUserProfile", e);
    }

    const pendingJoin = joinCode?.trim().toUpperCase() || null;
    setPendingInvite(pendingJoin);

    if (pendingJoin) {
      try {
        const invitedGroup = await getGroupByInviteCode(supabase, pendingJoin);
        if (invitedGroup) {
          const alreadyMember = await isGroupMember(supabase, invitedGroup.id, user.id);
          if (alreadyMember) {
            localStorage.setItem("tabMarketActiveGroup", invitedGroup.id);
            setGroup(invitedGroup);
            setShowGroupGate(false);
            setPendingInvite(null);
            setLoading(false);
            router.replace("/");
            return;
          }

          // Invite link takes priority over a previously opened group.
          setGroup(null);
          setShowGroupGate(true);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error("invite lookup failed", e);
      }
    }

    const storedGroupId = localStorage.getItem("tabMarketActiveGroup");
    if (storedGroupId) {
      const { data } = await supabase
        .from("groups")
        .select("id, name, invite_code")
        .eq("id", storedGroupId)
        .single();

      if (data) {
        const member = await isGroupMember(supabase, storedGroupId, user.id);

        if (member) {
          setGroup(data);
          setShowGroupGate(false);
          setLoading(false);
          return;
        }
      }
    }

    setGroup(null);
    setShowGroupGate(true);
    setLoading(false);
  }, [supabase, joinCode, router]);

  useEffect(() => {
    loadSession();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadSession();
    });
    return () => subscription.unsubscribe();
  }, [loadSession, supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("tabMarketActiveGroup");
    setGroup(null);
    setShowGroupGate(true);
    setPendingInvite(null);
    router.push("/");
  };

  const handleGroupSelected = (g: GroupInfo) => {
    localStorage.setItem("tabMarketActiveGroup", g.id);
    setGroup(g);
    setShowGroupGate(false);
    setPendingInvite(null);
    router.replace("/");
  };

  const handleSwitchGroup = () => {
    localStorage.removeItem("tabMarketActiveGroup");
    setGroup(null);
    setShowGroupGate(true);
    setPendingInvite(null);
  };

  if (loading) {
    return (
      <div className="authGate">
        <div className="authCard">
          <div className="logo">CM</div>
          <p className="muted">Loading {APP_NAME}…</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="authGate">
        <AuthForm
          initialMode={joinCode ? "signup" : "login"}
          joinHint={joinCode ? `Invite code: ${joinCode.toUpperCase()}` : undefined}
          joinCode={joinCode || undefined}
          onSuccess={() => loadSession()}
        />
      </div>
    );
  }

  if (showGroupGate || !group) {
    return (
      <div className="authGate">
        <GroupGate
          userId={userId}
          email={email}
          initialJoinCode={pendingInvite || joinCode || undefined}
          onGroupReady={handleGroupSelected}
          onSignOut={handleSignOut}
        />
      </div>
    );
  }

  return (
    <TabMarketApp
      groupId={group.id}
      groupName={group.name}
      inviteCode={group.invite_code}
      userId={userId}
      onSignOut={handleSignOut}
      onSwitchGroup={handleSwitchGroup}
    />
  );
}
