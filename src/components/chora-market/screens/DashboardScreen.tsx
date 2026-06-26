"use client";

import type { ChoraMarketHook } from "@/hooks/useChoraMarket";
import { Empty } from "@/components/chora-market/Empty";
import { PersonLeaderboardItem } from "@/components/chora-market/leaderboard/PersonLeaderboardItem";
import { SecondaryLeaderboard } from "@/components/chora-market/leaderboard/SecondaryLeaderboard";

export function DashboardScreen({ tm }: { tm: ChoraMarketHook }) {
  return (
      <section id="dashboard" className={`screen${tm.screen === "dashboard" ? " active" : ""}`}>
        <div className="metricGrid">
          <div className="metric">
            <b>{tm.money(tm.groupVolume)}</b>
            <span>Total group volume</span>
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
            <span>Resolved bets</span>
          </div>
          <div className="metric">
            <b>{tm.state.people.length}</b>
            <span>People in group</span>
          </div>
        </div>

        <div className="card leaderboardHero" style={{ marginTop: 20 }}>
          <div className="leaderboardHeroHead">
            <h2>🏆 Best Predictor</h2>
            <p className="small">
              The group rating. Built from every resolved pick — calibration, market edge, accuracy, and track record.
              Trust the number.
            </p>
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
                    subtitle={`${tm.rankForScore(tm.repScore(p))} · ${n} resolved pick${n === 1 ? "" : "s"}`}
                    amount={score.toFixed(1)}
                    amountClass={tm.predictorColor(score)}
                    onClick={() => tm.showPersonDetail(p)}
                  />
                );
              })
            ) : (
              <Empty>Resolve a bet market to unlock ratings.</Empty>
            )}
          </div>
        </div>

        <div className="leaderboardSubGrid" style={{ marginTop: 20 }}>
          <SecondaryLeaderboard
            title="📈 Highest Alpha"
            hint="Beat the group on who wins."
            empty="No alpha scored yet."
            rows={tm.alphaRows}
            tm={tm}
            formatAmount={(row) => {
              const a = row[1] as number;
              return `${a >= 0 ? "+" : ""}${(a * 100).toFixed(1)}%`;
            }}
            amountClass={(row) => ((row[1] as number) >= 0 ? "alphaGood" : "alphaBad")}
          />
          <SecondaryLeaderboard
            title="🎯 Lowest Brier Score"
            hint="Best calibrated probabilities. Lower is sharper."
            empty="No calibration data yet."
            rows={tm.brierRows}
            tm={tm}
            formatAmount={(row) => (row[1] as number).toFixed(3)}
          />
          <SecondaryLeaderboard
            title="🔥 Highest Accuracy"
            hint="Right side most often (sample-adjusted rank)."
            empty="No picks scored yet."
            rows={tm.accuracyRows}
            tm={tm}
            formatAmount={(row) => `${Math.round((row[1] as number) * 100)}%`}
            amountClass={(row) => {
              const pct = Math.round((row[1] as number) * 100);
              if (pct < 50) return "neg";
              if (pct === 50) return "accEven";
              return "pos";
            }}
          />
          <SecondaryLeaderboard
            title="🧠 Most Consistent"
            hint="Steady alpha pick after pick. Needs 2+ resolves."
            empty="Need more picks for consistency."
            rows={tm.consistencyRows}
            tm={tm}
            formatAmount={(row) => (row[1] as number).toFixed(1)}
          />
          <SecondaryLeaderboard
            title="💰 Biggest Winner"
            hint="Real W/L from resolved bet stakes only (side A vs side B). Predictors use Alpha & Best Predictor."
            empty="No resolved stake results yet."
            rows={tm.profitRows}
            tm={tm}
            formatAmount={(row) => tm.money(row[1] as number)}
            amountClass={(row) => ((row[1] as number) >= 0 ? "pos" : "neg")}
          />
          <SecondaryLeaderboard
            title="⭐ Most Improved"
            hint="Recent picks vs early picks. Needs 4+ resolves."
            empty="Need more picks to track improvement."
            rows={tm.improvedRows}
            tm={tm}
            formatAmount={(row) => {
              const d = row[1] as number;
              return `${d >= 0 ? "+" : ""}${d.toFixed(1)}%`;
            }}
            amountClass={(row) => ((row[1] as number) >= 0 ? "alphaGood" : "alphaBad")}
          />
        </div>

        <div className="grid" style={{ marginTop: 20 }}>
          <div className="card">
            <h2>{tm.state.dashboardTitles?.shame || "Hall of Shame"}</h2>
            <p className="small leaderboardHint">
              Group shame tags from People → Vote Reputation. Most votes for the worst label (
              {tm.worstLabel}) land here. Each person can only crown one GOAT and one worst tag at a time.
            </p>
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
                <Empty>No market manipulators called out yet.</Empty>
              )}
            </div>
          </div>
          <div className="card">
            <h2>🔥 Hot Streaks</h2>
            <p className="small leaderboardHint">2+ correct picks in a row on resolved bet markets.</p>
            <div className="hotStreakList">
              {tm.hotStreaks.length ? (
                tm.hotStreaks.map(({ person, streak }) => (
                  <button
                    key={person}
                    type="button"
                    className="hotStreakChip"
                    onClick={() => tm.showPersonDetail(person)}
                  >
                    🔥 {person} is on a {streak}-pick hot streak!
                  </button>
                ))
              ) : (
                <Empty>No hot streaks right now.</Empty>
              )}
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop: 20 }}>
          <h2>Community Verdicts</h2>
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
        </div>

        <div className="card" style={{ marginTop: 20 }}>
          <h2>Recent Activity</h2>
          <div className="list">
            {tm.state.activity.slice(0, 10).length ? (
              tm.state.activity.slice(0, 10).map((a, i) => (
                <div key={i} className="item">
                  <div>
                    <strong>{a.title}</strong>
                    <div className="small">{a.text}</div>
                  </div>
                  <span className="pill">{a.time}</span>
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
