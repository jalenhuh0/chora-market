"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  createGroup,
  joinGroupByCode,
  listUserGroups,
  type UserGroupRow,
} from "@/lib/market/db";

type GroupInfo = {
  id: string;
  name: string;
  invite_code: string;
};

type Props = {
  userId: string;
  email: string | null;
  initialJoinCode?: string;
  initialIntent?: "join" | "create";
  onGroupReady: (group: GroupInfo) => void;
  onSignOut: () => void;
};

function formatError(e: unknown): string {
  if (e && typeof e === "object" && "message" in e) {
    const msg = String((e as { message: string }).message);
    const details = "details" in e ? String((e as { details: string }).details) : "";
    const hint = "hint" in e ? String((e as { hint: string }).hint) : "";
    return [msg, details, hint].filter(Boolean).join(" — ");
  }
  return "Could not create group";
}

export function GroupGate({
  userId,
  email,
  initialJoinCode,
  initialIntent,
  onGroupReady,
  onSignOut,
}: Props) {
  const supabase = createClient();

  const [groups, setGroups] = useState<UserGroupRow[]>([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [ledgerName, setLedgerName] = useState(email?.split("@")[0] || "");
  const [joinCode, setJoinCode] = useState(initialJoinCode?.toUpperCase() || "");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joiningInvite, setJoiningInvite] = useState(false);
  const autoJoinAttempted = useRef(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const rows = await listUserGroups(supabase, userId);
      setGroups(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load groups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [userId]);

  const handleCreate = async () => {
    if (!newGroupName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const g = await createGroup(supabase, userId, newGroupName.trim(), ledgerName.trim());
      onGroupReady({ id: g.id, name: g.name, invite_code: g.invite_code });
    } catch (e) {
      setError(formatError(e));
    } finally {
      setBusy(false);
    }
  };

  const handleJoin = async (code?: string) => {
    const c = (code || joinCode).trim();
    if (!c) return;
    setBusy(true);
    setJoiningInvite(!!initialJoinCode);
    setError(null);
    try {
      const g = await joinGroupByCode(supabase, userId, c, ledgerName.trim() || undefined);
      onGroupReady({ id: g.id, name: g.name, invite_code: g.invite_code });
    } catch (e) {
      setError(formatError(e));
    } finally {
      setBusy(false);
      setJoiningInvite(false);
    }
  };

  useEffect(() => {
    if (initialJoinCode && !loading && !autoJoinAttempted.current) {
      autoJoinAttempted.current = true;
      void handleJoin(initialJoinCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialJoinCode, loading]);

  return (
    <div className="groupGate">
      <div className="authCard" style={{ maxWidth: 520 }}>
        <div className="brand" style={{ marginBottom: 20 }}>
          <div className="logo">CM</div>
          <div>
            <h1>Choose a group</h1>
            <div className="sub">Create a private group or join with an invite code</div>
          </div>
        </div>

        <label>Your player name</label>
        <input
          value={ledgerName}
          onChange={(e) => setLedgerName(e.target.value)}
          placeholder="How friends know you in IOUs and bets"
        />

        {initialJoinCode && (
          <p className="pill" style={{ marginTop: 16 }}>
            {joiningInvite || busy
              ? `Joining group with invite ${initialJoinCode}…`
              : `Invite code: ${initialJoinCode}`}
          </p>
        )}

        {!loading && groups.length > 0 && !initialJoinCode && (
          <div style={{ marginTop: 20 }}>
            <h2 style={{ fontSize: 16, marginBottom: 10 }}>Your groups</h2>
            <div className="list">
              {groups.map((row) =>
                row.groups ? (
                  <div className="item clickable" key={row.group_id}>
                    <div>
                      <strong>{row.groups.name}</strong>
                      <div className="small">
                        {row.role} · invite {row.groups.invite_code}
                      </div>
                    </div>
                    <button
                      className="btn secondary"
                      onClick={() => onGroupReady(row.groups!)}
                      disabled={busy}
                    >
                      Open
                    </button>
                  </div>
                ) : null
              )}
            </div>
          </div>
        )}

        {!initialJoinCode && initialIntent !== "join" && (
        <div className="card" style={{ marginTop: 20, boxShadow: "none" }}>
          <h2>Create new group</h2>
          <label>Group name</label>
          <input
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="College friends"
          />
          <div className="actions">
            <button className="btn green" onClick={handleCreate} disabled={busy}>
              Create group
            </button>
          </div>
        </div>
        )}

        {!initialJoinCode && initialIntent !== "create" && (
        <div className="card" style={{ marginTop: 16, boxShadow: "none" }}>
          <h2>Join with invite code</h2>
          <label>Invite code</label>
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="ABC123XY"
          />
          <div className="actions">
            <button className="btn blue" onClick={() => handleJoin()} disabled={busy}>
              Join group
            </button>
          </div>
        </div>
        )}

        {error && <p className="small neg" style={{ marginTop: 12 }}>{error}</p>}

        <div className="actions" style={{ marginTop: 20 }}>
          <button className="btn secondary" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
