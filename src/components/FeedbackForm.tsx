"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  feedbackMailtoUrl,
  submitFeedback,
  type FeedbackCategory,
} from "@/lib/market/feedback";
import { APP_NAME } from "@/lib/market/defaults";
import { LegalFooter } from "@/components/LegalFooter";

export function FeedbackForm() {
  const supabase = useMemo(() => createClient(), []);
  const [category, setCategory] = useState<FeedbackCategory>("idea");
  const [message, setMessage] = useState("");
  const [replyEmail, setReplyEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const email = data.user?.email;
      if (email) setReplyEmail(email);
    });
  }, [supabase]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const payload = {
      category,
      message,
      replyEmail,
      pageUrl: typeof window !== "undefined" ? window.location.href : undefined,
    };

    try {
      const { data } = await supabase.auth.getUser();
      await submitFeedback(supabase, {
        ...payload,
        userId: data.user?.id ?? null,
      });
      setSent(true);
      setMessage("");
    } catch (err) {
      try {
        window.location.href = feedbackMailtoUrl(payload);
        setSent(true);
      } catch {
        setError(err instanceof Error ? err.message : "Could not send feedback. Try email instead.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="legalPage">
      <div className="legalCard feedbackCard">
        <Link href="/" className="legalBack small">
          ← Back
        </Link>
        <h1>Send feedback</h1>
        <p className="legalUpdated muted small">
          Bug reports, ideas, or anything that felt off in {APP_NAME}. We read every message.
        </p>

        {sent ? (
          <div className="feedbackSuccess">
            <p className="small" style={{ color: "var(--green)" }}>
              Thanks — your feedback was sent.
            </p>
            <Link href="/" className="btn secondary" style={{ marginTop: 16, display: "inline-block" }}>
              Back to app
            </Link>
          </div>
        ) : (
          <form onSubmit={submit}>
            <label htmlFor="feedback-category">Type</label>
            <select
              id="feedback-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
            >
              <option value="bug">Bug / something broken</option>
              <option value="idea">Feature idea</option>
              <option value="other">Other</option>
            </select>

            <label htmlFor="feedback-message">Message</label>
            <textarea
              id="feedback-message"
              required
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What were you trying to do? What happened?"
            />

            <label htmlFor="feedback-email">Email (optional — if you want a reply)</label>
            <input
              id="feedback-email"
              type="email"
              value={replyEmail}
              onChange={(e) => setReplyEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />

            {error && (
              <p className="small neg" style={{ marginTop: 12 }}>
                {error}
              </p>
            )}

            <div className="actions" style={{ marginTop: 16 }}>
              <button className="btn green" type="submit" disabled={loading || !message.trim()}>
                {loading ? "Sending…" : "Send feedback"}
              </button>
            </div>
          </form>
        )}

        <LegalFooter className="legalFooterBottom" />
      </div>
    </main>
  );
}
