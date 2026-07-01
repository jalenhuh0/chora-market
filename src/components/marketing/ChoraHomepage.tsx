"use client";

import { LegalFooter } from "@/components/LegalFooter";
import type { GroupInvitePreview } from "@/lib/market/db";

type CtaProps = {
  onJoin: () => void;
  onCreate: () => void;
  onSignIn: () => void;
};

function HeroActions({ onJoin, onCreate, onSignIn, stack }: CtaProps & { stack?: boolean }) {
  return (
    <>
      <div className={`marketingActions${stack ? " marketingActionsStack" : ""}`}>
        <button type="button" className="btn green" onClick={onCreate}>
          Create a Community
        </button>
        <button type="button" className="btn secondary" onClick={onJoin}>
          Join a Community
        </button>
      </div>
      <p className="marketingSignIn">
        Already have an account?{" "}
        <button type="button" className="marketingLinkBtn" onClick={onSignIn}>
          Sign In
        </button>
      </p>
    </>
  );
}

function ProductMock() {
  return (
    <div className="card marketingPreview">
      <div className="marketingPreviewHeader">
        <span className="pill marketingPillLive">Live bet</span>
        <span className="pill">8 votes</span>
      </div>
      <h3 className="marketingPreviewTitle">Will Joseph make over 6 threes?</h3>
      <div className="marketingOddsBar">
        <div className="marketingOddsFill" style={{ width: "64%" }} />
      </div>
      <div className="marketingPreviewGrid">
        <div className="marketingPreviewStat">
          <span className="marketingPreviewLabel">Community odds</span>
          <strong className="marketingPreviewValue pos">64%</strong>
        </div>
        <div className="marketingPreviewStat">
          <span className="marketingPreviewLabel">Stake</span>
          <strong className="marketingPreviewValue">$20</strong>
        </div>
      </div>
      <div className="marketingPreviewRow">
        <span className="small muted">IOU</span>
        <span className="marketingPreviewIou">Will owes Jalen $20 · Ongoing</span>
      </div>
      <div className="marketingPreviewRow">
        <span className="small muted">Top predictor</span>
        <span className="marketingPreviewRank">Jalen · +18 rating</span>
      </div>
    </div>
  );
}

type InviteProps = {
  invitePreview: GroupInvitePreview;
  inviterName?: string;
  previewLoading?: boolean;
  onJoin: () => void;
  onSignIn: () => void;
};

export function HomeInviteHero({
  invitePreview,
  inviterName,
  previewLoading,
  onJoin,
  onSignIn,
}: InviteProps) {
  return (
    <section className="marketingInvite card">
      <div className="marketingInviteIcon" aria-hidden>
        🏀
      </div>
      <p className="marketingInviteLead">
        {inviterName ? (
          <>
            <strong>{inviterName}</strong> invited you to
          </>
        ) : (
          "You're invited to join"
        )}
      </p>
      {previewLoading ? (
        <p className="muted">Loading community…</p>
      ) : (
        <>
          <h2 className="marketingInviteGroup">{invitePreview.name}</h2>
          <p className="marketingInviteStats">
            {invitePreview.member_count} members · {invitePreview.resolved_bets} bets resolved
          </p>
        </>
      )}
      <div className="marketingActions marketingActionsStack marketingInviteActions">
        <button type="button" className="btn green" onClick={onJoin} disabled={previewLoading}>
          Join Community
        </button>
      </div>
      <p className="marketingSignIn">
        Already have an account?{" "}
        <button type="button" className="marketingLinkBtn" onClick={onSignIn}>
          Sign In
        </button>
      </p>
    </section>
  );
}

const FEATURES = [
  {
    title: "Group-set fair odds",
    text: "Everyone votes their probability. Chora aggregates the room — no arguing about lines in the chat.",
  },
  {
    title: "IOUs that stick",
    text: "Track food, rides, and bet debts in one private ledger. Settle when you're ready.",
  },
  {
    title: "Predictor reputation",
    text: "Leaderboards for accuracy, calibration, and edge vs the group over time.",
  },
  {
    title: "Invite-only groups",
    text: "Your community, your rules. Not a public exchange — just the people you actually know.",
  },
];

const STEPS = [
  {
    num: "1",
    title: "Create a bet",
    text: "Pick two sides on anything — sports, dares, deadlines. Set a stake your group cares about.",
  },
  {
    num: "2",
    title: "Let the group vote",
    text: "Everyone submits odds. Chora finds community pricing before anything resolves.",
  },
  {
    num: "3",
    title: "Settle & score",
    text: "Resolve the outcome, record IOUs automatically, and update who's actually sharp.",
  },
];

export function ChoraHomepage({ onJoin, onCreate, onSignIn }: CtaProps) {
  return (
    <div className="marketingPage">
      <header className="marketingNav">
        <div className="marketingNavBrand">
          <div className="logo marketingLogo">CM</div>
          <span>CHORA</span>
        </div>
        <nav className="marketingNavLinks" aria-label="Page sections">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="#story">About</a>
        </nav>
        <button type="button" className="btn secondary btnCompact marketingNavSignIn" onClick={onSignIn}>
          Sign In
        </button>
      </header>

      <main className="marketingMain">
        <section className="marketingHero">
          <div className="marketingHeroCopy">
            <p className="marketingEyebrow">Private markets for friend groups</p>
            <h1 className="marketingHeroTitle">
              Fair odds for your <span className="marketingGradient">group chat</span>
            </h1>
            <p className="marketingHeroSubtitle">
              Chora helps your crew set community odds, track IOUs, and see who actually reads the room —
              like Splitwise for bets, built for people you trust.
            </p>
            <HeroActions onJoin={onJoin} onCreate={onCreate} onSignIn={onSignIn} />
            <ul className="marketingTrust">
              <li>Free for friends</li>
              <li>Invite-only</li>
              <li>No house edge</li>
            </ul>
          </div>
          <div className="marketingHeroVisual">
            <ProductMock />
          </div>
        </section>

        <section id="features" className="marketingSection">
          <div className="marketingSectionHead">
            <p className="marketingEyebrow">Built for your crew</p>
            <h2 className="marketingSectionTitle">Everything the group chat loses track of</h2>
          </div>
          <div className="marketingBento">
            {FEATURES.map((f) => (
              <div key={f.title} className="card marketingBentoItem">
                <h3>{f.title}</h3>
                <p className="small muted">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how" className="marketingSection">
          <div className="marketingSectionHead">
            <p className="marketingEyebrow">How it works</p>
            <h2 className="marketingSectionTitle">From bet to settled IOU</h2>
          </div>
          <div className="marketingSteps">
            {STEPS.map((s) => (
              <div key={s.num} className="card marketingStep">
                <span className="marketingStepNum">{s.num}</span>
                <h3>{s.title}</h3>
                <p className="small muted">{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="marketingSection">
          <div className="marketingSectionHead">
            <p className="marketingEyebrow">Why not just the group chat?</p>
            <h2 className="marketingSectionTitle">Chora keeps the record straight</h2>
          </div>
          <div className="marketingCompareRows card">
            <div className="marketingCompareRow">
              <span className="marketingCompareTopic">Odds</span>
              <span className="marketingCompareBefore muted">Argued every time</span>
              <span className="marketingCompareAfter">One community vote</span>
            </div>
            <div className="marketingCompareRow">
              <span className="marketingCompareTopic">IOUs</span>
              <span className="marketingCompareBefore muted">Lost in scrollback</span>
              <span className="marketingCompareAfter">Tracked until settled</span>
            </div>
            <div className="marketingCompareRow">
              <span className="marketingCompareTopic">Reputation</span>
              <span className="marketingCompareBefore muted">No scoreboard</span>
              <span className="marketingCompareAfter">Leaderboards on resolve</span>
            </div>
          </div>
        </section>

        <section id="story" className="marketingSection marketingStory card">
          <p className="marketingEyebrow">The name</p>
          <h2 className="marketingSectionTitle">Chora — the center of the island</h2>
          <p className="marketingStoryText">
            In Greece, the <em>Chora</em> is the heart of an island village — whitewashed walls, blue domes,
            and the place everyone gathers. We built Chora Market with that spirit: a private home where your
            friend group makes predictions together and settles up honestly.
          </p>
        </section>

        <section className="marketingSection marketingFinalCta card">
          <h2 className="marketingFinalTitle">Start your group&apos;s market tonight</h2>
          <p className="small muted">Create a community in minutes. Invite friends when you&apos;re ready.</p>
          <div className="marketingActions marketingActionsCenter">
            <button type="button" className="btn green" onClick={onCreate}>
              Create a Community
            </button>
            <button type="button" className="btn secondary" onClick={onJoin}>
              Join with invite code
            </button>
          </div>
        </section>
      </main>

      <LegalFooter className="marketingFooter" />
    </div>
  );
}
