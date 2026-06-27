"use client";

import Link from "next/link";
import { useState } from "react";
import type { ChoraMarketHook } from "@/hooks/useChoraMarket";
import { Avatar } from "@/components/Avatar";
import { LegalFooter } from "@/components/LegalFooter";

export function SettingsScreen({ tm }: { tm: ChoraMarketHook }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  return (
      <section id="settings" className={`screen${tm.screen === "settings" ? " active" : ""}`}>
        <div className="split">
          <div className="card">
            <h2>Account Profile</h2>
            <div className="avatarUploadRow">
              <Avatar
                url={tm.avatarUrl}
                name={tm.displayName || tm.profile?.display_name || "You"}
                size={64}
              />
              <div className="avatarUploadMeta">
                <label>Profile photo</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  disabled={tm.avatarUploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) tm.uploadProfilePhoto(file);
                    e.target.value = "";
                  }}
                />
                <div className="small">
                  {tm.avatarUploading ? "Uploading…" : "JPG, PNG, GIF, or WebP · max 5 MB"}
                </div>
              </div>
            </div>
            <label>Display name</label>
            <input value={tm.displayName} onChange={(e) => tm.setDisplayName(e.target.value)} placeholder="Your name" />
            <div className="toggleRow">
              <label htmlFor="notifyEnabled">Enable notifications</label>
              <input
                id="notifyEnabled"
                type="checkbox"
                checked={tm.notifyEnabled}
                onChange={(e) => tm.setNotifyEnabled(e.target.checked)}
              />
            </div>
            <div className="toggleRow">
              <label htmlFor="notifyBets">Bet notifications</label>
              <input
                id="notifyBets"
                type="checkbox"
                checked={tm.notifyBets}
                onChange={(e) => tm.setNotifyBets(e.target.checked)}
              />
            </div>
            <div className="toggleRow">
              <label htmlFor="notifyIous">IOU notifications</label>
              <input
                id="notifyIous"
                type="checkbox"
                checked={tm.notifyIous}
                onChange={(e) => tm.setNotifyIous(e.target.checked)}
              />
            </div>
            <div className="toggleRow">
              <label htmlFor="notifyInvites">Invite notifications</label>
              <input
                id="notifyInvites"
                type="checkbox"
                checked={tm.notifyInvites}
                onChange={(e) => tm.setNotifyInvites(e.target.checked)}
              />
            </div>
            <div className="actions">
              <button type="button" className="btn green" onClick={tm.saveProfile}>
                Save Profile
              </button>
            </div>
            <hr style={{ margin: "24px 0", border: "none", borderTop: "1px solid var(--line)" }} />
            <h2 style={{ marginBottom: 8 }}>Password</h2>
            <p className="small muted" style={{ marginBottom: 12 }}>
              Change your sign-in password while logged in.
            </p>
            <label>New password</label>
            <input
              type="password"
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete="new-password"
            />
            <label>Confirm new password</label>
            <input
              type="password"
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Same as above"
              autoComplete="new-password"
            />
            <div className="actions">
              <button
                type="button"
                className="btn secondary"
                onClick={async () => {
                  const ok = await tm.changePassword(newPassword, confirmPassword);
                  if (ok) {
                    setNewPassword("");
                    setConfirmPassword("");
                  }
                }}
              >
                Update password
              </button>
            </div>
          </div>

          <div className="card">
            <h2>Group Settings</h2>
            <label>Group name</label>
            <input value={tm.groupRename} onChange={(e) => tm.setGroupRename(e.target.value)} />
            <div className="actions">
              <button type="button" className="btn green" onClick={tm.saveGroupName}>
                Save Group Name
              </button>
            </div>
          </div>

          <div className="card">
            <h2>Customize Names</h2>
            <label>App name</label>
            <input value={tm.setAppName} onChange={(e) => tm.setSetAppName(e.target.value)} />
            <label>Creditor leaderboard title</label>
            <input value={tm.setCredTitle} onChange={(e) => tm.setSetCredTitle(e.target.value)} />
            <label>Mooch leaderboard title</label>
            <input value={tm.setMoochTitle} onChange={(e) => tm.setSetMoochTitle(e.target.value)} />
            <label>Profit/Loss leaderboard title</label>
            <input value={tm.setProfitTitle} onChange={(e) => tm.setSetProfitTitle(e.target.value)} />
            <label>Hall of Shame title</label>
            <input value={tm.setShameTitle} onChange={(e) => tm.setSetShameTitle(e.target.value)} />
            <div className="actions">
              <button type="button" className="btn green" onClick={tm.saveSettings}>
                Save Names
              </button>
            </div>
          </div>

          <div className="card">
            <h2>Customize Rank Titles</h2>
            <p className="muted">These cosmetic rank titles are based on Elo-style reputation score.</p>
            {tm.rankInputs.map((r, i) => (
              <div key={i} className="row">
                <div>
                  <label>{`Rank ${i + 1} title`}</label>
                  <input
                    value={r.title}
                    onChange={(e) => {
                      const next = [...tm.rankInputs];
                      next[i] = { ...next[i], title: e.target.value };
                      tm.setRankInputs(next);
                    }}
                  />
                </div>
                <div>
                  <label>Minimum score</label>
                  <input
                    type="number"
                    value={r.min}
                    onChange={(e) => {
                      const next = [...tm.rankInputs];
                      next[i] = { ...next[i], min: Number(e.target.value) };
                      tm.setRankInputs(next);
                    }}
                  />
                </div>
              </div>
            ))}
            <div className="actions">
              <button type="button" className="btn green" onClick={tm.saveRankTitles}>
                Save Rank Titles
              </button>
              <button type="button" className="btn secondary" onClick={tm.resetRankTitles}>
                Reset Rank Titles
              </button>
            </div>
          </div>

          <div className="card dangerZone">
            <h2>Demo / Reset</h2>
            <p className="muted">Load demo data to test the app, or reset everything stored for this group.</p>
            <div className="actions">
              <button type="button" className="btn secondary" onClick={tm.loadDemoData}>
                Load Demo Data
              </button>
              <button type="button" className="btn red" onClick={tm.resetData}>
                Reset App
              </button>
            </div>
          </div>

          <div className="card">
            <h2>Feedback</h2>
            <p className="muted small">Bug reports, ideas, or anything that felt off.</p>
            <div className="actions">
              <Link href="/feedback" className="btn secondary">
                Send feedback
              </Link>
            </div>
          </div>
        </div>
        <LegalFooter />
      </section>
  );
}
