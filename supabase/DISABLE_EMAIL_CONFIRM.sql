-- Disable email verification for new signups (Dashboard):
-- Authentication → Providers → Email → turn OFF "Confirm email"
--
-- One-time: confirm users stuck without a verified email (SQL Editor):

update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, now())
where email_confirmed_at is null;
