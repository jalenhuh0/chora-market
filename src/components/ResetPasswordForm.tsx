"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { APP_NAME } from "@/lib/market/defaults";

export function ResetPasswordForm() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!cancelled) {
        setHasSession(!!user);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase.auth]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const { error: updateErr } = await supabase.auth.updateUser({ password });
      if (updateErr) throw updateErr;
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update password.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="authCard">
        <div className="logo">CM</div>
        <p className="muted">Loading…</p>
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="authCard">
        <div className="brand" style={{ marginBottom: 20 }}>
          <div className="logo">CM</div>
          <div>
            <h1>{APP_NAME}</h1>
            <div className="sub">Reset password</div>
          </div>
        </div>
        <p className="small">
          This link is invalid or expired. Request a new reset email from the sign-in page.
        </p>
        <div className="actions" style={{ marginTop: 16 }}>
          <Link className="btn green" href="/">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="authCard">
      <div className="brand" style={{ marginBottom: 20 }}>
        <div className="logo">CM</div>
        <div>
          <h1>{APP_NAME}</h1>
          <div className="sub">Choose a new password</div>
        </div>
      </div>

      <form onSubmit={submit}>
        <label>New password</label>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
          autoComplete="new-password"
        />
        <label>Confirm new password</label>
        <input
          type="password"
          required
          minLength={6}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Same as above"
          autoComplete="new-password"
        />

        {error && <p className="small neg" style={{ marginTop: 12 }}>{error}</p>}

        <div className="actions">
          <button className="btn green" type="submit" disabled={busy}>
            {busy ? "Saving…" : "Update password"}
          </button>
          <Link className="btn secondary" href="/">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
