"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ChoraMarketApp from "@/components/ChoraMarketApp";
import { clearActiveGroupId, getActiveGroupId, setActiveGroupId } from "@/lib/storage";
import { AuthForm } from "@/components/AuthForm";
import { GroupGate } from "@/components/GroupGate";
import { ChoraHomepage, HomeInviteHero } from "@/components/marketing/ChoraHomepage";
import {
  getGroupByInviteCode,
  getGroupInvitePreview,
  isGroupMember,
  type GroupInvitePreview,
} from "@/lib/market/db";
import { APP_NAME } from "@/lib/market/defaults";

type GroupInfo = {
  id: string;
  name: string;
  invite_code: string;
};

type PostAuthIntent = "join" | "create" | null;

export default function HomeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const joinCode = searchParams.get("join");
  const inviterRef = searchParams.get("ref");

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [showGroupGate, setShowGroupGate] = useState(false);
  const [pendingInvite, setPendingInvite] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [postAuthIntent, setPostAuthIntent] = useState<PostAuthIntent>(null);
  const [invitePreview, setInvitePreview] = useState<GroupInvitePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const supabase = createClient();

  const loadInvitePreview = useCallback(async (code: string) => {
    setPreviewLoading(true);
    try {
      const preview = await getGroupInvitePreview(supabase, code);
      setInvitePreview(preview);
    } catch (e) {
      console.error("invite preview failed", e);
      setInvitePreview(null);
    } finally {
      setPreviewLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    const code = joinCode?.trim().toUpperCase();
    if (!code) {
      setInvitePreview(null);
      return;
    }
    void loadInvitePreview(code);
  }, [joinCode, loadInvitePreview]);

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

    setShowAuth(false);

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
            setActiveGroupId(invitedGroup.id);
            setGroup(invitedGroup);
            setShowGroupGate(false);
            setPendingInvite(null);
            setLoading(false);
            router.replace("/");
            return;
          }

          setGroup(null);
          setShowGroupGate(true);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error("invite lookup failed", e);
      }
    }

    const storedGroupId = getActiveGroupId();
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
    clearActiveGroupId();
    setGroup(null);
    setShowGroupGate(true);
    setPendingInvite(null);
    setShowAuth(false);
    setPostAuthIntent(null);
    router.push("/");
  };

  const handleGroupSelected = (g: GroupInfo) => {
    setActiveGroupId(g.id);
    setGroup(g);
    setShowGroupGate(false);
    setPendingInvite(null);
    setPostAuthIntent(null);
    router.replace("/");
  };

  const handleSwitchGroup = () => {
    clearActiveGroupId();
    setGroup(null);
    setShowGroupGate(true);
    setPendingInvite(null);
  };

  const openSignup = (intent: PostAuthIntent) => {
    setAuthMode("signup");
    setPostAuthIntent(intent);
    setShowAuth(true);
  };

  const openSignIn = () => {
    setAuthMode("login");
    setShowAuth(true);
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
    if (showAuth) {
      return (
        <div className="authGate">
          <div className="authCard authCardEmbedded">
            <button type="button" className="landingBackBtn small" onClick={() => setShowAuth(false)}>
              ← Back
            </button>
            <AuthForm
              embedded
              initialMode={authMode}
              joinCode={joinCode || undefined}
              onSuccess={() => loadSession()}
            />
          </div>
        </div>
      );
    }

    const code = joinCode?.trim().toUpperCase();
    const showInviteHero = !!code && (previewLoading || !!invitePreview);

    return (
      <div className="authGate authGateMarketing">
        {showInviteHero && (
          <div className="marketingInviteWrap">
            <HomeInviteHero
              invitePreview={
                invitePreview ?? {
                  id: "",
                  name: "Community",
                  invite_code: code!,
                  member_count: 0,
                  resolved_bets: 0,
                }
              }
              inviterName={inviterRef?.trim() || undefined}
              previewLoading={previewLoading}
              onJoin={() => openSignup("join")}
              onSignIn={openSignIn}
            />
          </div>
        )}
        <ChoraHomepage
          onJoin={() => openSignup(code ? "join" : "join")}
          onCreate={() => openSignup("create")}
          onSignIn={openSignIn}
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
          initialIntent={postAuthIntent || (joinCode ? "join" : undefined)}
          onGroupReady={handleGroupSelected}
          onSignOut={handleSignOut}
        />
      </div>
    );
  }

  return (
    <ChoraMarketApp
      groupId={group.id}
      groupName={group.name}
      inviteCode={group.invite_code}
      userId={userId}
      onSignOut={handleSignOut}
      onSwitchGroup={handleSwitchGroup}
    />
  );
}
