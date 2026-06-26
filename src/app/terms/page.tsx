import Link from "next/link";
import { APP_NAME } from "@/lib/market/defaults";

export const metadata = {
  title: `Terms of Service — ${APP_NAME}`,
};

export default function TermsPage() {
  return (
    <main className="legalPage">
      <div className="legalCard">
        <Link href="/" className="legalBack small">
          ← Back
        </Link>
        <h1>Terms of Service</h1>
        <p className="legalUpdated muted small">Last updated: June 24, 2025</p>

        <section>
          <h2>Acceptance</h2>
          <p>
            By creating an account or using {APP_NAME}, you agree to these terms and our{" "}
            <Link href="/privacy">Privacy Policy</Link>.
          </p>
        </section>

        <section>
          <h2>What {APP_NAME} is</h2>
          <p>
            {APP_NAME} is a private friend-group tool for tracking informal IOUs, bets, and prediction
            stats. It is for entertainment and social bookkeeping among people who know each other — not
            a regulated prediction market, casino, or payment service.
          </p>
        </section>

        <section>
          <h2>No real-money settlement</h2>
          <p>
            Amounts and bets in the app are user-entered and not enforced by us. We do not hold funds,
            process payments, or guarantee that group members settle debts in real life. Any real-money
            arrangements are solely between you and your friends.
          </p>
        </section>

        <section>
          <h2>Your content and conduct</h2>
          <p>
            You are responsible for what you post in groups (bet titles, IOU notes, tags, allegations).
            Do not use the service for harassment, illegal activity, or content you do not have permission
            to share. Groups are invite-only; only share invite links with people you trust.
          </p>
        </section>

        <section>
          <h2>Age</h2>
          <p>You must be at least 13 years old to use {APP_NAME}. If you are under 18, use it only with
            parent or guardian permission where required by law.</p>
        </section>

        <section>
          <h2>Account termination</h2>
          <p>
            We may suspend or terminate accounts that abuse the service, spam groups, or violate these
            terms. You may stop using the app at any time and request data deletion per our privacy
            policy.
          </p>
        </section>

        <section>
          <h2>Disclaimer</h2>
          <p>
            The service is provided &quot;as is&quot; without warranties. We are not liable for disputes
            between group members, lost data, or decisions made based on in-app stats or IOU balances.
          </p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>
            Questions: <a href="mailto:privacy@chora-market.app">privacy@chora-market.app</a>
          </p>
        </section>

        <p className="legalFooter small muted legalFooterBottom">
          <Link href="/privacy">Privacy Policy</Link>
        </p>
      </div>
    </main>
  );
}
