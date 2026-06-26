"use client";

import type { ChoraMarketHook } from "@/hooks/useChoraMarket";
import { Avatar } from "@/components/Avatar";
import { findMemberForPlayer } from "@/lib/market/members";
import { Empty } from "@/components/chora-market/Empty";
import { ALLEGATION_LABELS } from "@/lib/market/allegations";

export function PeopleScreen({ tm }: { tm: ChoraMarketHook }) {
  return (
    <section id="people" className={`screen${tm.screen === "people" ? " active" : ""}`}>
      <div className="card" style={{ marginBottom: 20 }}>
        <h2>App Accounts &amp; Roles</h2>
        <p className="muted">
          Everyone who joins with an account is added as a player automatically. Set your ledger name when you
          create or join a group.
        </p>
        <div className="list">
          {tm.groupMembers.length ? (
            tm.groupMembers.map((m) => {
              const isYou = m.user_id === tm.userId;
              const label = m.display_name || m.ledger_name || m.email || `User ${m.user_id.slice(0, 6)}`;
              const roleLabel = m.role === "owner" ? "Owner / Admin" : "Member";
              return (
                <div key={m.user_id} className="item">
                  <div className="personLine">
                    <Avatar url={m.avatar_url} name={label} />
                    <div>
                      <strong>
                        {label}
                        {isYou ? " (you)" : ""}
                      </strong>
                      <span className={`roleBadge ${m.role === "owner" ? "roleOwner" : "roleMember"}`}>
                        {roleLabel}
                      </span>
                      <div className="small">
                        {m.email ? `${m.email} · ` : ""}
                        Ledger name: {m.ledger_name || "—"}
                        {m.role === "owner" ? " · Can manage group settings" : " · Can vote & participate"}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <Empty>No app accounts loaded yet.</Empty>
          )}
        </div>
      </div>

      <div className="card">
        <h2>Players</h2>
        <p className="muted">
          Group members appear here automatically. Names are used for IOUs, bets, and leaderboards. You can rename
          only your own player name.
        </p>
        {tm.myPlayerName && (
          <div className="actions" style={{ marginBottom: 16 }}>
            <button type="button" className="btn secondary" onClick={tm.renameMyPlayer}>
              Rename my player ({tm.myPlayerName})
            </button>
          </div>
        )}
        <div className="list">
          {tm.state.people.length ? (
            tm.state.people.map((p) => {
              const st = tm.state.stats[p] || { correct: 0, wrong: 0, profit: 0, elo: 1000 };
              const totalP = st.correct + st.wrong;
              const acc = totalP ? Math.round((st.correct / totalP) * 100) : 0;
              const rep = tm.repScore(p);
              const alpha = tm.alphaPct(p);
              const linked = findMemberForPlayer(tm.groupMembers, p);
              return (
                <div key={p} className="item clickable" onClick={() => tm.showPersonDetail(p)}>
                  <div className="personLine">
                    <Avatar url={linked?.avatar_url} name={p} />
                    <div>
                      <strong>{p}</strong>
                      {linked ? (
                        <span className={`roleBadge ${linked.role === "owner" ? "roleOwner" : "roleMember"}`}>
                          {linked.role === "owner" ? "Owner / Admin" : "Member"}
                        </span>
                      ) : null}
                      <div className="rankBadge">{tm.rankForScore(rep)}</div>
                      <div className="small">
                        Rep {rep} · Edge{" "}
                        <span className={alpha >= 0 ? "alphaGood" : "alphaBad"}>
                          {(alpha * 100).toFixed(1)}%
                        </span>{" "}
                        · Accuracy {acc}% · tap for details
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <Empty>No players yet. Members appear here when they join the group.</Empty>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h2>Friend Allegations</h2>
        <p className="muted">
          Joke-only tags — pick one per friend. You can only crown one GOAT and one Giga Scammer at a time.
        </p>
        <div className="list">
          {tm.state.people.map((p) => {
            const tags = tm.counts[p] || {};
            const tagPills = ALLEGATION_LABELS.map((label) => {
              const count = tags[label] || 0;
              if (!count) return null;
              return (
                <span key={label} className="pill">
                  {label} ({count})
                </span>
              );
            }).filter(Boolean);

            return (
              <div key={p} className="item block">
                <div className="personLine">
                  <div className="avatar">{tm.initials(p)}</div>
                  <div>
                    <strong>{p}</strong>
                    <div className="small">{tagPills.length ? tagPills : "No allegations yet."}</div>
                  </div>
                </div>
                <div className="tagGrid">
                  {ALLEGATION_LABELS.map((label) => (
                    <button key={label} type="button" className="tagBtn" onClick={() => tm.quickTag(p, label)}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
