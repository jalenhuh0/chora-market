/** Where Supabase should send users after email confirmation or magic links. */
export function authCallbackUrl(nextPath = "/") {
  if (typeof window === "undefined") {
    const site =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    const next = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
    return `${site}/auth/callback?next=${encodeURIComponent(next)}`;
  }

  const next = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

export function authRedirectAfterSignup(joinCode?: string | null) {
  const next = joinCode ? `/?join=${encodeURIComponent(joinCode.toUpperCase())}` : "/";
  return authCallbackUrl(next);
}

/** After clicking the password reset link in email. */
export function authRedirectPasswordReset() {
  return authCallbackUrl("/auth/reset-password");
}
