"use client";

import type { ChoraMarketHook } from "@/hooks/useChoraMarket";
import { Empty } from "@/components/chora-market/Empty";
import { ExpandableSection } from "@/components/chora-market/ExpandableSection";
import { PersonLeaderboardItem } from "@/components/chora-market/leaderboard/PersonLeaderboardItem";
import { SecondaryLeaderboard } from "@/components/chora-market/leaderboard/SecondaryLeaderboard";
import { ADVANCED_LEADERBOARDS, PRIMARY_LEADERBOARDS } from "@/components/chora-market/dashboard-leaderboards";

function LeaderboardGrid({ tm, configs }: { tm: ChoraMarketHook; configs: typeof PRIMARY_LEADERBOARDS }) {
  return (
    <div className="leaderboardSubGrid">
      {configs.map((config) => (
        <SecondaryLeaderboard
          key={config.title}
          title={config.title}
          hint={config.hint}
          empty={config.empty}
          rows={config.getRows(tm)}
          tm={tm}
          formatAmount={(row) => config.formatAmount(tm, row)}
          amountClass={config.amountClass}
        />
      ))}
    </div>
  );
}

export function DashboardScreen({ tm }: { tm: ChoraMarketHook }) {
  return (
    <section id="dashboard" className={`screen${tm.screen === "dashboard" ? " active" : ""}`}>
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
        summary="Brier score, accuracy, consistency, improvement"
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
        <div className="card">
          <h2>{tm.state.dashboardTitles?.shame || "Hall of Shame"}</h2>
          <p className="small leaderboardHint">Most {tm.worstLabel} votes from People.</p>
          <div className="list">
            {tm.shameRows.length ? (
              tm.shameRows.map(([p, c], i) => (
                <div key={p} className="item">
                  <div className="personLine">
                    <div className="avatar">{tm.initials(p)}</div>
                    <div>
                      <strong>
                        #{i + 1} {p}
                      </strong>
                      <div className="small">{tm.worstLabel} votes</div>
                    </div>
                  </div>
                  <div className="amount neg">{c}</div>
                </div>
              ))
            ) : (
              <Empty>No votes yet.</Empty>
            )}
          </div>
        </div>
      </div>

      <ExpandableSection title="Community verdicts" summary={`${tm.verdictRows.length} people rated`} className="card expandableCard">
        <div className="list">
          {tm.verdictRows.length ? (
            tm.verdictRows.map(([p, c]) => (
              <div key={p} className="item clickable" onClick={() => tm.showPersonDetail(p)}>
                <div className="personLine">
                  <div className="avatar">{tm.initials(p)}</div>
                  <div>
                    <strong>{p}</strong>
                    <div className="small">
                      {tm.verdictLabel(p)} · {tm.verdictSummary(p)}
                    </div>
                  </div>
                </div>
                <div className={`amount ${c.good >= c.bad ? "pos" : "neg"}`}>
                  {c.good}/{c.total}
                </div>
              </div>
            ))
          ) : (
            <Empty>No verdict votes yet.</Empty>
          )}
        </div>
      </ExpandableSection>

      <div className="card">
        <h2>Recent Activity</h2>
        <div className="list">
          {tm.state.activity.slice(0, 10).length ? (
            tm.state.activity.slice(0, 10).map((a, i) => (
              <div key={i} className="item activityItem">
                <div className="activityItemMain">
                  <strong>{a.title}</strong>
                  <div className="small">{a.text}</div>
                </div>
                <span className="pill activityTime">{a.time}</span>
              </div>
            ))
          ) : (
            <Empty>No activity yet.</Empty>
          )}
        </div>
      </div>
    </section>
  );
}
