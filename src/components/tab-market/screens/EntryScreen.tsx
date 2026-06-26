"use client";

import type { TabMarketHook } from "@/hooks/useTabMarket";
import { Empty } from "@/components/tab-market/Empty";

function listPeople(tm: TabMarketHook, arr: [string, number][], cls: "pos" | "neg") {
  if (!arr.length) return <Empty>Nothing here yet.</Empty>;
  const max = Math.max(...arr.map((x) => x[1]), 1);
  return arr.map(([p, v], i) => (
    <div key={p} className="item clickable" onClick={() => tm.showPersonDetail(p)}>
      <div style={{ width: "100%" }}>
        <div className="personLine">
          <div className="avatar">{tm.initials(p)}</div>
          <div>
            <strong>
              #{i + 1} {p}
            </strong>
            <div className="small">
              {cls === "pos" ? "Is owed" : "Owes"} {tm.money(v)} · click for details
            </div>
          </div>
        </div>
        <div className="bar">
          <i style={{ width: `${Math.min(100, (v / max) * 100)}%` }} />
        </div>
      </div>
      <div className={`amount ${cls}`}>{tm.money(v)}</div>
    </div>
  ));
}

export function EntryScreen({ tm }: { tm: TabMarketHook }) {
  return (
      <section id="entry" className={`screen${tm.screen === "entry" ? " active" : ""}`}>
        <div className="grid">
          <div className="card">
            <h2>Create an IOU</h2>
            <label>Reason</label>
            <textarea
              value={tm.reason}
              onChange={(e) => tm.setReason(e.target.value)}
              placeholder="Example: Jake owes Sarah Cane's because he lost mini golf"
            />
            <div className="row">
              <div>
                <label>Person owed</label>
                <select value={tm.owedSelect} onChange={(e) => tm.setOwedSelect(e.target.value)}>
                  {tm.state.people.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Person who owes</label>
                <select value={tm.owesSelect} onChange={(e) => tm.setOwesSelect(e.target.value)}>
                  {tm.state.people.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="row">
              <div>
                <label>Value amount optional</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={tm.amount}
                  onChange={(e) => tm.setAmount(e.target.value)}
                  placeholder="Leave blank for AI estimate"
                />
              </div>
              <div>
                <label>Category</label>
                <select value={tm.category} onChange={(e) => tm.setCategory(e.target.value)}>
                  {tm.categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="actions">
              <button type="button" className="btn green" onClick={tm.addDebt}>
                Add to Market
              </button>
              <button type="button" className="btn secondary" onClick={tm.parseReason}>
                AI-style Parse
              </button>
            </div>
          </div>
          <div className="card">
            <h2>Open IOUs</h2>
            <div className="list">
              {tm.openDebts.length ? (
                tm.openDebts.map((d) => {
                  const unsettled = tm.iouUnsettledFor(d.created);
                  return (
                  <div key={d.id} className="item">
                    <div>
                      <span className="pill">{d.category}</span>
                      {unsettled ? (
                        <span className="pill iouAgePill">Unsettled {unsettled}</span>
                      ) : null}
                      <strong>
                        {d.owes} owes {d.owed}
                      </strong>
                      <div className="small">{d.reason}</div>
                    </div>
                    <div>
                      <div className="amount">{tm.money(d.amount)}</div>
                      <button type="button" className="btn secondary" onClick={() => tm.settleDebt(d.id)}>
                        Settle
                      </button>
                    </div>
                  </div>
                  );
                })
              ) : (
                <Empty>No open IOUs.</Empty>
              )}
            </div>
          </div>
        </div>

        <div className="grid" style={{ marginTop: 20 }}>
          <div className="card">
            <h2>{tm.state.settings.creditors}</h2>
            <div className="list">{listPeople(tm, tm.sortedBal.filter((x) => x[1] > 0), "pos")}</div>
          </div>
          <div className="card">
            <h2>{tm.state.settings.mooches}</h2>
            <div className="list">
              {listPeople(tm, 
                [...tm.sortedBal].reverse().filter((x) => x[1] < 0).map((x) => [x[0], Math.abs(x[1])] as [string, number]),
                "neg"
              )}
            </div>
          </div>
        </div>
      </section>
  );
}
