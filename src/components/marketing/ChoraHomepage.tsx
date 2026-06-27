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

function HomePreviewCard() {
  return (
    <div className="card marketingPreview">
      <div className="marketingPreviewHeader">
        <span className="pill">Live bet</span>
        <span className="pill">8 votes</span>
      </div>
      <h3 className="marketingPreviewTitle">Will Joseph make over 6 threes?</h3>
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
        <span className="marketingPreviewIou">Will owes Jalen $20</span>
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

export function ChoraHomepage({ onJoin, onCreate, onSignIn }: CtaProps) {
  return (
    <div className="marketingPage">
      <header className="marketingNav">
        <div className="marketingNavBrand">
          <div className="logo marketingLogo">CM</div>
          <span>CHORA</span>
        </div>
        <button type="button" className="btn secondary btnCompact marketingNavSignIn" onClick={onSignIn}>
          Sign In
        </button>
      </header>

      <main className="marketingMain">
        <section className="marketingHero">
          <div className="marketingHeroCopy">
            <h1 className="marketingHeroBrand">CHORA</h1>
            <p className="marketingHeroTitle">Fair odds for your friend group.</p>
            <p className="marketingHeroSubtitle">
              Friends already make bets. Chora helps your group set fair odds, track IOUs, and see who
              actually makes the best predictions.
            </p>
            <HeroActions onJoin={onJoin} onCreate={onCreate} onSignIn={onSignIn} />
          </div>
          <div className="marketingHeroVisual">
            <HomePreviewCard />
          </div>
        </section>

        <section className="marketingSection">
          <h2 className="marketingSectionTitle">How it works</h2>
          <div className="marketingSteps">
            <div className="card marketingStep">
              <span className="marketingStepNum">1</span>
              <h3>Create a bet</h3>
              <p className="small muted">Set up a head-to-head market for anything your group cares about.</p>
            </div>
            <div className="card marketingStep">
              <span className="marketingStepNum">2</span>
              <h3>Let the group vote</h3>
              <p className="small muted">Everyone submits odds. Chora finds fair community pricing.</p>
            </div>
            <div className="card marketingStep">
              <span className="marketingStepNum">3</span>
              <h3>Settle and build reputation</h3>
              <p className="small muted">Resolve bets, track IOUs, and see who reads the room best.</p>
            </div>
          </div>
        </section>

        <section className="marketingSection">
          <h2 className="marketingSectionTitle">Why Chora</h2>
          <div className="marketingWhyGrid">
            <div className="card marketingWhy">
              <h3>Discover fair odds</h3>
              <p className="small muted">Stop arguing about lines in the group chat. Vote once, settle together.</p>
            </div>
            <div className="card marketingWhy">
              <h3>Track bets and IOUs</h3>
              <p className="small muted">Private ledger for friend-group stakes — like Splitwise for bets.</p>
            </div>
            <div className="card marketingWhy">
              <h3>Build predictor reputation</h3>
              <p className="small muted">Rankings for accuracy, calibration, and edge over time.</p>
            </div>
          </div>
        </section>

        <section className="marketingSection marketingStory card">
          <h2 className="marketingSectionTitle">The name</h2>
          <p className="marketingStoryText">
            In Greece, the <em>Chora</em> was the center of an island community — a trusted place where people
            gathered. We built Chora with the same idea: a private home where your community can make
            predictions together.
          </p>
        </section>

        <section className="marketingSection marketingFinalCta card">
          <h2 className="marketingFinalTitle">Ready to settle your next bet?</h2>
          <p className="small muted">Create a private community in minutes. Invite friends when you&apos;re ready.</p>
          <div className="marketingActions marketingActionsCenter">
            <button type="button" className="btn green" onClick={onCreate}>
              Create a Community
            </button>
          </div>
        </section>
      </main>

      <LegalFooter className="marketingFooter" />
    </div>
  );
}
