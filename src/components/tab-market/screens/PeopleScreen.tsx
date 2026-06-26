"use client";

import type { TabMarketHook } from "@/hooks/useTabMarket";
import { Avatar } from "@/components/Avatar";
import { findMemberForPlayer } from "@/lib/market/members";
import { Empty } from "@/components/tab-market/Empty";

export function PeopleScreen({ tm }: { tm: TabMarketHook }) {
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
                const label =
                  m.display_name || m.ledger_name || m.email || `User ${m.user_id.slice(0, 6)}`;
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
                        <span
                          className={`roleBadge ${m.role === "owner" ? "roleOwner" : "roleMember"}`}
                        >
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
                const linkedAvatar = linked?.avatar_url;
                return (
                  <div key={p} className="item clickable" onClick={() => tm.showPersonDetail(p)}>
                    <div className="personLine">
                      <Avatar url={linkedAvatar} name={p} />
                      <div>
                        <strong>{p}</strong>
                        {linked ? (
                          <span
                            className={`roleBadge ${linked.role === "owner" ? "roleOwner" : "roleMember"}`}
                          >
                            {linked.role === "owner" ? "Owner / Admin" : "Member"}
                          </span>
                        ) : null}
                        <div className="rankBadge">{tm.rankForScore(rep)}</div>
                        <div className="small">
                          Rep {rep} · {tm.verdictLabel(p)} · Alpha{" "}
                          <span className={alpha >= 0 ? "alphaGood" : "alphaBad"}>
                            {(alpha * 100).toFixed(1)}%
                          </span>{" "}
                          · Accuracy {acc}% · click for details
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

        <div className="grid" style={{ marginTop: 20 }}>
          <div className="card">
            <h2>Friend Allegations</h2>
            <p className="muted">
              Joke-only community tags. Call out fake gurus, sharks, mooches, and market manipulators.
            </p>
            <div className="list">
              {tm.state.people.map((p) => {
                const tags = tm.counts[p] || {};
                const tagHtml = Object.entries(tags)
                  .sort((a, b) => b[1] - a[1])
                  .map(([k, v]) => (
                    <span key={k} className="pill">
                      {k} ({v})
                    </span>
                  ));
                return (
                  <div key={p} className="item block">
                    <div className="personLine">
                      <div className="avatar">{tm.initials(p)}</div>
                      <div>
                        <strong>{p}</strong>
                        <div className="small">{tagHtml.length ? tagHtml : "No allegations yet."}</div>
                      </div>
                    </div>
                    <div className="tagGrid">
                      {(tm.state.scale || []).map((t) => (
                        <button
                          key={t.label}
                          type="button"
                          className="tagBtn"
                          onClick={() => tm.quickTag(p, t.label)}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="card">
            <h2>Vote Reputation</h2>
            <p className="muted">
              Each person can rate each friend. Your GOAT vote and worst-title vote are exclusive, so you can only
              crown one GOAT and one Giga Scammer at a time.
            </p>
            <label>Who are we rating?</label>
            <select value={tm.tagPerson} onChange={(e) => tm.setTagPerson(e.target.value)}>
              {tm.state.people.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
            <label>Rating</label>
            <select value={tm.tagName} onChange={(e) => tm.setTagName(e.target.value)}>
              {(tm.state.scale || []).map((s) => (
                <option key={s.label}>{s.label}</option>
              ))}
            </select>
            <label>Your name</label>
            <select value={tm.tagVoter} onChange={(e) => tm.setTagVoter(e.target.value)}>
              {tm.state.people.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
            <div className="actions">
              <button type="button" className="btn purple" onClick={tm.castTag}>
                Cast / Change Vote
              </button>
            </div>
          </div>
          <div className="card">
            <h2>Community Verdict Vote</h2>
            <p className="muted">
              For someone with good accuracy/alpha: are they legit, or just running hot?
            </p>
            <label>Who are we judging?</label>
            <select value={tm.verdictPerson} onChange={(e) => tm.setVerdictPerson(e.target.value)}>
              {tm.state.people.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
            <label>Verdict</label>
            <select value={tm.verdictChoice} onChange={(e) => tm.setVerdictChoice(e.target.value)}>
              <option value="good">{tm.state.verdictLabels.good}</option>
              <option value="bad">{tm.state.verdictLabels.bad}</option>
            </select>
            <label>Your name</label>
            <select value={tm.verdictVoter} onChange={(e) => tm.setVerdictVoter(e.target.value)}>
              {tm.state.people.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
            <div className="actions">
              <button type="button" className="btn blue" onClick={tm.castVerdictVote}>
                Cast / Change Verdict
              </button>
            </div>
          </div>
        </div>
      </section>
  );
}
