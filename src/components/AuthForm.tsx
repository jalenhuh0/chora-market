"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { authRedirectAfterSignup, authRedirectPasswordReset } from "@/lib/supabase/auth-redirect";
import { APP_NAME } from "@/lib/market/defaults";
import { LegalFooter } from "@/components/LegalFooter";

type Props = {
  initialMode?: "login" | "signup";
  joinHint?: string;
  joinCode?: string;
  onSuccess?: () => void;
};

export function AuthForm({ initialMode = "login", joinHint, joinCode, onSuccess }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<"login" | "signup" | "forgot">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (mode === "signup" && !acceptedTerms) {
      setError("Please accept the Terms and Privacy Policy to create an account.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "forgot") {
        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: authRedirectPasswordReset(),
        });
        if (resetErr) throw resetErr;
        setMessage("Check your email for a password reset link.");
        return;
      }

      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName || email.split("@")[0] },
            emailRedirectTo: authRedirectAfterSignup(joinCode),
          },
        });
        if (signUpError) throw signUpError;

        if (data.session) {
          onSuccess?.();
          router.refresh();
          return;
        }

        setMessage(
          "Account created, but email confirmation is still required. Turn off Confirm email in Supabase (Authentication → Providers → Email), then sign up again or check your inbox."
        );
        setMode("login");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        onSuccess?.();
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="authCard">
      <div className="brand" style={{ marginBottom: 20 }}>
        <div className="logo">CM</div>
        <div>
          <h1>{APP_NAME}</h1>
          <div className="sub">Sign in to your friend group economy</div>
        </div>
      </div>

      {joinHint && <p className="pill" style={{ marginBottom: 16 }}>{joinHint}</p>}

      {mode === "forgot" ? (
        <form onSubmit={submit}>
          <p className="small muted" style={{ marginBottom: 16 }}>
            Enter your account email. We&apos;ll send a link to reset your password.
          </p>
          <label>Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
          {error && <p className="small neg" style={{ marginTop: 12 }}>{error}</p>}
          {message && (
            <p className="small" style={{ marginTop: 12, color: "var(--green)" }}>
              {message}
            </p>
          )}
          <div className="actions">
            <button className="btn green" type="submit" disabled={loading}>
              {loading ? "Sending…" : "Send reset link"}
            </button>
            <button
              className="btn secondary"
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
                setMessage(null);
              }}
            >
              Back to sign in
            </button>
          </div>
        </form>
      ) : (
      <form onSubmit={submit}>
        {mode === "signup" && (
          <>
            <label>Display name</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Jalen"
            />
          </>
        )}
        <label>Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
        <label>Password</label>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
        />
        {mode === "login" ? (
          <button
            type="button"
            className="small linkish"
            style={{
              marginTop: 8,
              background: "none",
              border: "none",
              padding: 0,
              color: "var(--blue)",
              cursor: "pointer",
              textAlign: "left",
            }}
            onClick={() => {
              setMode("forgot");
              setError(null);
              setMessage(null);
            }}
          >
            Forgot password?
          </button>
        ) : null}

        {mode === "signup" && (
          <label className="termsCheck small">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
            />
            <span>
              I agree to the <Link href="/terms">Terms</Link> and{" "}
              <Link href="/privacy">Privacy Policy</Link>
            </span>
          </label>
        )}

        {error && <p className="small neg" style={{ marginTop: 12 }}>{error}</p>}
        {message && <p className="small" style={{ marginTop: 12, color: "var(--green)" }}>{message}</p>}

        <div className="actions">
          <button
            className="btn green"
            type="submit"
            disabled={loading || (mode === "signup" && !acceptedTerms)}
          >
            {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
          </button>
          <button
            className="btn secondary"
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError(null);
              setMessage(null);
              setAcceptedTerms(false);
            }}
          >
            {mode === "login" ? "Need an account?" : "Already have an account?"}
          </button>
        </div>
      </form>
      )}
      <LegalFooter />
    </div>
  );
}
