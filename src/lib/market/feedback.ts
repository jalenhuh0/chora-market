import type { SupabaseClient } from "@supabase/supabase-js";

export const FEEDBACK_EMAIL = "privacy@chora-market.app";

export type FeedbackCategory = "bug" | "idea" | "other";

export type FeedbackInput = {
  category: FeedbackCategory;
  message: string;
  replyEmail?: string;
  userId?: string | null;
  pageUrl?: string;
};

export async function submitFeedback(supabase: SupabaseClient, input: FeedbackInput) {
  const message = input.message.trim();
  if (!message) throw new Error("Please enter a message.");

  const { error } = await supabase.from("feedback").insert({
    user_id: input.userId ?? null,
    reply_email: input.replyEmail?.trim() || null,
    category: input.category,
    message,
    page_url: input.pageUrl ?? null,
  });

  if (error) throw error;
}

export function feedbackMailtoUrl(input: FeedbackInput) {
  const subject = encodeURIComponent(`Chora feedback (${input.category})`);
  const body = encodeURIComponent(
    [
      input.message.trim(),
      "",
      input.replyEmail?.trim() ? `Reply to: ${input.replyEmail.trim()}` : "",
      input.pageUrl ? `Page: ${input.pageUrl}` : "",
    ]
      .filter(Boolean)
      .join("\n")
  );
  return `mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`;
}
