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
    <div className="marketingMockStage" aria-hidden>
      <div className="marketingMockGlow" />
      <div className="marketingMockShell">
        <div className="marketingMockChrome">
          <span className="marketingMockDot" />
          <span className="marketingMockDot" />
          <span className="marketingMockDot" />
          <span className="marketingMockUrl">chora.app / your-group</span>
        </div>
        <div className="marketingMockBody">
          <div className="card marketingMockBet">
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
            <div className="marketingMockSides">
              <span className="marketingMockSide">Joseph · Yes</span>
              <span className="marketingMockSide muted">Group · No</span>
            </div>
          </div>

          <div className="card marketingMockFloat marketingMockIou">
            <span className="pill iouOpenPill">Ongoing · 3 days</span>
            <strong>Will owes Jalen $20</strong>
            <span className="small muted">Lost the threes bet</span>
          </div>

          <div className="card marketingMockFloat marketingMockRank">
            <span className="marketingPreviewLabel">Top predictor</span>
            <div className="marketingMockRankRow">
              <span className="marketingMockAvatar">J</span>
              <div>
                <strong>Jalen</strong>
                <span className="small pos">+18 rating · 72% accuracy</span>
              </div>
            </div>
          </div>
        </div>
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
    icon: "⚖️",
    title: "Group-set fair odds",
    text: "Everyone votes their probability. Chora aggregates the room — no arguing about lines in the chat.",
  },
  {
    icon: "📒",
    title: "IOUs that stick",
    text: "Track food, rides, and bet debts in one private ledger. Settle when you're ready.",
  },
  {
    icon: "📈",
    title: "Predictor reputation",
    text: "Leaderboards for accuracy, calibration, and edge vs the group over time.",
  },
  {
    icon: "🔒",
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
      <div className="marketingBg" aria-hidden>
        <div className="marketingBgOrb marketingBgOrb1" />
        <div className="marketingBgOrb marketingBgOrb2" />
      </div>

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
            <p className="marketingEyebrow">Private prediction markets for friend groups</p>
            <h1 className="marketingHeroTitle">
              The running tab for your <span className="marketingGradient">group chat</span>
            </h1>
            <p className="marketingHeroSubtitle">
              Chora is where your crew sets fair odds on bets, tracks IOUs, and builds a reputation score for
              who actually reads the room — Splitwise energy, prediction-market mechanics, zero strangers.
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

        <section className="marketingStats" aria-label="What Chora tracks">
          <div className="marketingStat">
            <strong>Bets</strong>
            <span className="small muted">Head-to-head markets</span>
          </div>
          <div className="marketingStat">
            <strong>IOUs</strong>
            <span className="small muted">Food, rides, stakes</span>
          </div>
          <div className="marketingStat">
            <strong>Rankings</strong>
            <span className="small muted">Alpha & calibration</span>
          </div>
        </section>

        <section id="features" className="marketingSection">
          <div className="marketingSectionHead">
            <p className="marketingEyebrow">Built for your crew</p>
            <h2 className="marketingSectionTitle">Everything the group chat loses track of</h2>
            <p className="marketingSectionLead">
              Not another public market. Chora is the private ledger where bets, debts, and bragging rights
              actually get recorded.
            </p>
          </div>
          <div className="marketingBento">
            {FEATURES.map((f) => (
              <div key={f.title} className="card marketingBentoItem">
                <span className="marketingBentoIcon" aria-hidden>
                  {f.icon}
                </span>
                <h3>{f.title}</h3>
                <p className="small muted">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how" className="marketingSection">
          <div className="marketingSectionHead">
            <p className="marketingEyebrow">How it works</p>
            <h2 className="marketingSectionTitle">From group chat bet to settled IOU</h2>
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
          <div className="card marketingCompare">
            <div className="marketingSectionHead marketingSectionHeadLeft">
              <p className="marketingEyebrow">Why not just the group chat?</p>
              <h2 className="marketingSectionTitle">Chora keeps the record straight</h2>
            </div>
            <div className="marketingCompareGrid">
              <div className="marketingCompareCol">
                <h3 className="marketingCompareLabel muted">Group chat</h3>
                <ul className="marketingCompareList">
                  <li>Odds argued every time</li>
                  <li>IOUs forgotten in scrollback</li>
                  <li>No scoreboard for who&apos;s sharp</li>
                </ul>
              </div>
              <div className="marketingCompareCol marketingCompareColChora">
                <h3 className="marketingCompareLabel">Chora</h3>
                <ul className="marketingCompareList">
                  <li>One community vote sets fair odds</li>
                  <li>Open IOUs with ongoing status</li>
                  <li>Leaderboards that update on resolve</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section id="story" className="marketingSection marketingStory card">
          <p className="marketingEyebrow">The name</p>
          <h2 className="marketingSectionTitle">Chora — the center of the island</h2>
          <p className="marketingStoryText">
            In Greece, the <em>Chora</em> was the heart of an island community — a trusted place where people
            gathered. We built Chora Market with the same idea: a private home where your friend group makes
            predictions together, settles up honestly, and remembers who called it best.
          </p>
        </section>

        <section className="marketingSection marketingFinalCta card">
          <h2 className="marketingFinalTitle">Start your group&apos;s market tonight</h2>
          <p className="small muted">
            Create a private community in minutes. Invite friends when you&apos;re ready — first bet takes less
            than a minute.
          </p>
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
