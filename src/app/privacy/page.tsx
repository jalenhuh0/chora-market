import Link from "next/link";
import { LegalFooter } from "@/components/LegalFooter";
import { APP_NAME } from "@/lib/market/defaults";

export const metadata = {
  title: `Privacy Policy — ${APP_NAME}`,
};

export default function PrivacyPage() {
  return (
    <main className="legalPage">
      <div className="legalCard">
        <Link href="/" className="legalBack small">
          ← Back
        </Link>
        <h1>Privacy Policy</h1>
        <p className="legalUpdated muted small">Last updated: June 24, 2025</p>

        <section>
          <h2>What we collect</h2>
          <p>
            When you create an account, we store your email address, display name, and optional profile
            photo. When you use a group, we store group name, invite code, IOUs, bets, votes, activity
            feed entries, and other content you and your group members add.
          </p>
        </section>

        <section>
          <h2>How we use it</h2>
          <p>
            Data is used to run {APP_NAME}: authenticate you, sync your group ledger, and show avatars
            and activity to members of the same group. We do not sell your personal data or use it for
            advertising.
          </p>
        </section>

        <section>
          <h2>Who can see your data</h2>
          <p>
            Group IOUs, bets, stats, and activity are visible to members of that group. Profile photos
            are stored in a public storage bucket so they can display in the app. Your email is visible
            to other members of groups you join.
          </p>
        </section>

        <section>
          <h2>Where data is stored</h2>
          <p>
            We use Supabase (database, authentication, file storage) and Vercel (hosting). Data is
            processed in the United States unless your Supabase project region differs.
          </p>
        </section>

        <section>
          <h2>Informal tracking only</h2>
          <p>
            {APP_NAME} tracks informal IOUs and friend-group bets for entertainment. It is not a bank,
            payment processor, or legal contract. Do not rely on it for tax, debt collection, or
            financial decisions.
          </p>
        </section>

        <section>
          <h2>Retention and deletion</h2>
          <p>
            We keep your data while your account and groups exist. To request account or data deletion,
            email{" "}
            <a href="mailto:privacy@chora-market.app">privacy@chora-market.app</a>. We will respond within
            a reasonable time.
          </p>
        </section>

        <section>
          <h2>Changes</h2>
          <p>
            We may update this policy as the product evolves. Continued use after changes means you
            accept the updated policy.
          </p>
        </section>

        <LegalFooter className="legalFooterBottom" />
      </div>
    </main>
  );
}
