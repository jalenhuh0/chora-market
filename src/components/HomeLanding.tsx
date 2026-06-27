"use client";

import { LegalFooter } from "@/components/LegalFooter";
import type { GroupInvitePreview } from "@/lib/market/db";

type Props = {
  invitePreview?: GroupInvitePreview | null;
  inviterName?: string;
  previewLoading?: boolean;
  onJoin: () => void;
  onCreate: () => void;
  onSignIn: () => void;
};

export function HomeLanding({
  invitePreview,
  inviterName,
  previewLoading,
  onJoin,
  onCreate,
  onSignIn,
}: Props) {
  const isInvite = !!invitePreview;

  return (
    <div className="homeLanding">
      <div className={`homeLandingCard${isInvite ? " homeLandingInvite" : ""}`}>
        {isInvite ? (
          <>
            <div className="landingInviteIcon" aria-hidden>
              🏀
            </div>
            <p className="landingInviteLead">
              {inviterName ? (
                <>
                  <strong>{inviterName}</strong> invited you to
                </>
              ) : (
                "You're invited to join"
              )}
            </p>
            {previewLoading ? (
              <p className="landingTagline muted">Loading community…</p>
            ) : (
              <>
                <h1 className="landingGroupName">{invitePreview.name}</h1>
                <div className="landingStats">
                  <span>{invitePreview.member_count} members</span>
                  <span className="landingStatDot" aria-hidden>
                    ·
                  </span>
                  <span>{invitePreview.resolved_bets} bets resolved</span>
                </div>
              </>
            )}
            <div className="landingDivider" />
            <div className="landingActions landingActionsStack">
              <button type="button" className="btn green landingBtn" onClick={onJoin} disabled={previewLoading}>
                Join Community
              </button>
            </div>
          </>
        ) : (
          <>
            <h1 className="landingBrand">CHORA</h1>
            <p className="landingTagline landingTaglineMobile">Private bets with your friends.</p>
            <div className="landingDesktopCopy">
              <p className="landingTagline landingTaglineDesktop">
                The easiest way for communities to discover fair odds.
              </p>
              <p className="landingBody">
                Create private prediction markets.
                <br />
                Track bets &amp; IOUs.
                <br />
                See who&apos;s actually the best predictor.
              </p>
            </div>
            <div className="landingDivider landingDividerMobile" />
            <ul className="landingFeatures landingFeaturesMobile">
              <li>🏀 Create fair odds together</li>
              <li>💸 Track bets &amp; IOUs</li>
              <li>🏆 See who&apos;s actually right</li>
            </ul>
            <div className="landingDivider landingDividerMobile" />
            <div className="landingActions landingActionsStack landingActionsMobile">
              <button type="button" className="btn green landingBtn" onClick={onJoin}>
                Join a Community
              </button>
              <button type="button" className="btn secondary landingBtn" onClick={onCreate}>
                Create Your Community
              </button>
            </div>
            <div className="landingActions landingActionsDesktop">
              <button type="button" className="btn green landingBtn" onClick={onCreate}>
                Create a Community
              </button>
              <button type="button" className="btn secondary landingBtn" onClick={onJoin}>
                Join a Community
              </button>
            </div>
          </>
        )}

        <p className="landingSignInPrompt">
          Already have an account?{" "}
          <button type="button" className="landingLinkBtn" onClick={onSignIn}>
            Sign In
          </button>
        </p>
      </div>
      <LegalFooter />
    </div>
  );
}
