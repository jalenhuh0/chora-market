"use client";

import type { ChoraMarketHook } from "@/hooks/useChoraMarket";
import { Empty } from "@/components/chora-market/Empty";
import { ExpandableSection } from "@/components/chora-market/ExpandableSection";
import { PersonLeaderboardItem } from "@/components/chora-market/leaderboard/PersonLeaderboardItem";
import { LeaderboardGrid } from "@/components/chora-market/leaderboard/LeaderboardGrid";
import { RecentActivityCard } from "@/components/chora-market/RecentActivityCard";
import {
  ADVANCED_LEADERBOARDS,
  ADVANCED_STATS_SUMMARY,
  PRIMARY_LEADERBOARDS,
} from "@/components/chora-market/dashboard-leaderboards";

export function DashboardScreen({ tm }: { tm: ChoraMarketHook }) {
  return (
    <section id="dashboard" className={`screen${tm.screen === "dashboard" ? " active" : ""}`}>
      <div className="dashboardLayout">
        <div className="dashboardMain">
      <div className="metricGrid">
        <div className="metric">
          <b>{tm.money(tm.groupVolume)}</b>
          <span>Total volume</span>
        </div>
        <div className="metric">
          <b>{tm.openDebts.length}</b>
          <span>Open IOUs</span>
        </div>
        <div className="metric">
          <b>{tm.activeBets.length}</b>
          <span>Active bets</span>
        </div>
        <div className="metric">
          <b>{tm.resolvedBets.length}</b>
          <span>Resolved</span>
        </div>
      </div>

      <div className="card leaderboardHero">
        <div className="leaderboardHeroHead">
          <h2>🏆 Best Predictor</h2>
          <p className="small">Group rating from resolved picks — edge, accuracy, and track record.</p>
        </div>
        <div className="list">
          {tm.predictors.length ? (
            tm.predictors.map((p, i) => {
              const n = tm.totalPicks(p);
              const score = tm.predictorScore(p);
              return (
                <PersonLeaderboardItem
                  key={p}
                  rank={i + 1}
                  person={p}
                  personInitials={tm.initials(p)}
                  subtitle={`${tm.rankForScore(tm.repScore(p))} · ${n} pick${n === 1 ? "" : "s"}`}
                  amount={score.toFixed(1)}
                  amountClass={tm.predictorColor(score)}
                  onClick={() => tm.showPersonDetail(p)}
                />
              );
            })
          ) : (
            <Empty>Resolve a bet to unlock ratings.</Empty>
          )}
        </div>
      </div>

      <LeaderboardGrid tm={tm} configs={PRIMARY_LEADERBOARDS} />

      <ExpandableSection
        title="Advanced stats"
        summary={ADVANCED_STATS_SUMMARY}
        className="card expandableCard"
      >
        <LeaderboardGrid tm={tm} configs={ADVANCED_LEADERBOARDS} />
      </ExpandableSection>

      <div className="grid dashboardSocialGrid">
        <div className="card">
          <h2>🔥 Hot Streaks</h2>
          <p className="small leaderboardHint">2+ correct picks in a row.</p>
          <div className="hotStreakList">
            {tm.hotStreaks.length ? (
              tm.hotStreaks.map(({ person, streak }) => (
                <button
                  key={person}
                  type="button"
                  className="hotStreakChip"
                  onClick={() => tm.showPersonDetail(person)}
                >
                  🔥 {person} · {streak} in a row
                </button>
              ))
            ) : (
              <Empty>No hot streaks right now.</Empty>
            )}
          </div>
        </div>
        <div className="card shameCard">
          <h2>{tm.state.dashboardTitles?.shame || "Hall of Shame"}</h2>
          <p className="small leaderboardHint">Most {tm.worstLabel} allegations from People.</p>
          <div className="list">
            {tm.shameRows.length ? (
              tm.shameRows.map(([p, c], i) => (
                <PersonLeaderboardItem
                  key={p}
                  rank={i + 1}
                  person={p}
                  personInitials={tm.initials(p)}
                  subtitle={`${tm.worstLabel} votes`}
                  amount={String(c)}
                  amountClass="neg"
                  onClick={() => tm.showPersonDetail(p)}
                />
              ))
            ) : (
              <Empty>No votes yet.</Empty>
            )}
          </div>
        </div>
      </div>

        </div>
        <aside className="dashboardAside">
          <RecentActivityCard activity={tm.state.activity} />
        </aside>
      </div>
    </section>
  );
}
