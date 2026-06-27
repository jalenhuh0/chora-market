"use client";

import { LegalFooter } from "@/components/LegalFooter";
import type { GroupInvitePreview } from "@/lib/market/db";

type CtaProps = {
  onJoin: () => void;
  onCreate: () => void;
  onSignIn: () => void;
};

function ChoraGreeceBackground() {
  return (
    <div className="marketingChoraBg" aria-hidden>
      <svg className="marketingChoraSvg" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMax slice">
        <defs>
          <linearGradient id="choraSky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1a3d52" />
            <stop offset="45%" stopColor="#2d6a8f" />
            <stop offset="100%" stopColor="#4a8fb5" />
          </linearGradient>
          <linearGradient id="choraSea" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1f5570" />
            <stop offset="100%" stopColor="#143848" />
          </linearGradient>
          <linearGradient id="choraSun" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f5d78e" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#f5d78e" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width="1440" height="900" fill="url(#choraSky)" />
        <circle cx="1180" cy="120" r="90" fill="url(#choraSun)" />
        <circle cx="1180" cy="120" r="42" fill="#f8e8b0" opacity="0.85" />
        <rect x="0" y="620" width="1440" height="280" fill="url(#choraSea)" />
        <path
          d="M0 640 Q360 610 720 635 T1440 620 L1440 900 L0 900 Z"
          fill="#1a4a62"
          opacity="0.45"
        />
        {/* Hillside village — cycladic chora silhouette */}
        <path
          d="M0 720 L120 680 L210 700 L320 640 L430 670 L540 610 L650 650 L760 590 L870 630 L980 580 L1090 620 L1200 570 L1320 600 L1440 580 L1440 900 L0 900 Z"
          fill="#c8d5df"
          opacity="0.22"
        />
        <g fill="#f4f0e6" opacity="0.92">
          <rect x="180" y="560" width="70" height="55" rx="2" />
          <rect x="255" y="545" width="55" height="70" rx="2" />
          <rect x="320" y="575" width="90" height="40" rx="2" />
          <rect x="420" y="530" width="65" height="85" rx="2" />
          <rect x="495" y="555" width="50" height="60" rx="2" />
          <rect x="560" y="515" width="80" height="100" rx="2" />
          <rect x="650" y="540" width="60" height="75" rx="2" />
          <rect x="720" y="505" width="95" height="110" rx="2" />
          <rect x="825" y="535" width="55" height="80" rx="2" />
          <rect x="890" y="520" width="75" height="95" rx="2" />
          <rect x="975" y="550" width="65" height="65" rx="2" />
          <rect x="1050" y="510" width="85" height="105" rx="2" />
          <rect x="1145" y="540" width="70" height="75" rx="2" />
          <rect x="1225" y="525" width="60" height="90" rx="2" />
        </g>
        {/* Blue dome */}
        <ellipse cx="760" cy="505" rx="28" ry="18" fill="#3b6ea8" opacity="0.95" />
        <rect x="738" y="505" width="44" height="28" fill="#f4f0e6" opacity="0.92" />
        {/* Windmill */}
        <rect x="1088" y="490" width="12" height="70" fill="#e8e4da" opacity="0.85" />
        <path d="M1094 490 L1094 455 M1094 490 L1068 505 M1094 490 L1120 505" stroke="#e8e4da" strokeWidth="3" opacity="0.7" />
      </svg>
      <div className="marketingChoraScrim" />
    </div>
  );
}

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
      <ChoraGreeceBackground />

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
          <div className="card marketingCompare">
            <h2 className="marketingSectionTitle">Group chat vs Chora</h2>
            <div className="marketingCompareGrid">
              <div className="marketingCompareCol">
                <h3 className="marketingCompareLabel muted">Group chat</h3>
                <ul className="marketingCompareList">
                  <li>Odds argued every time</li>
                  <li>IOUs lost in scrollback</li>
                  <li>No scoreboard for who&apos;s sharp</li>
                </ul>
              </div>
              <div className="marketingCompareCol marketingCompareColChora">
                <h3 className="marketingCompareLabel">Chora</h3>
                <ul className="marketingCompareList">
                  <li>One vote sets fair odds</li>
                  <li>Open IOUs with ongoing status</li>
                  <li>Leaderboards update on resolve</li>
                </ul>
              </div>
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
