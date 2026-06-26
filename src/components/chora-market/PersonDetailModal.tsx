"use client";

import type { ChoraMarketHook } from "@/hooks/useChoraMarket";
import { Empty } from "@/components/chora-market/Empty";
import { ExpandableSection } from "@/components/chora-market/ExpandableSection";

export function PersonDetailModal({ tm }: { tm: ChoraMarketHook }) {
  const pd = tm.personDetail;

  return (
    <div
      id="personModal"
      className={`modalOverlay${tm.personModal ? " show" : ""}`}
      onClick={(e) => {
        if ((e.target as HTMLElement).id === "personModal") tm.closePersonDetail();
      }}
    >
      <div className="modal">
        {pd && (
          <div id="personDetail">
            <div className="modalTop">
              <div className="personLine">
                <div className="avatar">{tm.initials(pd.person)}</div>
                <div>
                  <h2 style={{ margin: 0 }}>{pd.person}</h2>
                  <div className="small">Net position & picks</div>
                </div>
              </div>
              <button type="button" className="closeBtn" onClick={tm.closePersonDetail}>
                Close
              </button>
            </div>

            <div className="detailGrid">
              <div className="detailStat">
                <span>Net position</span>
                <b className={pd.data.net >= 0 ? "pos" : "neg"}>{tm.money(pd.data.net)}</b>
              </div>
              <div className="detailStat">
                <span>Owed to them</span>
                <b className="pos">{tm.money(pd.data.owedToMeTotal)}</b>
              </div>
              <div className="detailStat">
                <span>They owe</span>
                <b className="neg">{tm.money(pd.data.iOweTotal)}</b>
              </div>
              <div className="detailStat">
                <span>Pick record</span>
                <b>{pd.acc}%</b>
                <div className="small">
                  {pd.st.correct || 0}W · {pd.st.wrong || 0}L · Stake P/L {tm.money(pd.st.profit || 0)}
                </div>
              </div>
              <div className="detailStat">
                <span>Streak</span>
                <b className={pd.streak >= 2 ? "pos" : pd.streak === 0 && pd.games > 0 ? "neg" : "accEven"}>
                  {pd.streak > 0 ? `${pd.streak} correct` : pd.games > 0 ? "None" : "—"}
                </b>
              </div>
              <div className="detailStat">
                <span>Market alpha</span>
                <b className={tm.alphaPct(pd.person) >= 0 ? "pos" : "neg"}>
                  {(tm.alphaPct(pd.person) * 100).toFixed(1)}%
                </b>
                <div className="small">
                  Grade {tm.calibrationGrade(pd.person)} · {tm.rankForScore(tm.repScore(pd.person))}
                </div>
              </div>
            </div>

            <ExpandableSection
              title="Advanced ranking stats"
              summary="Wilson accuracy, Brier score, tie-breakers"
              className="expandableInset"
            >
              <div className="miniTable">
                <div className="miniRow">
                  <div>
                    <strong>Wilson accuracy</strong>
                    <div className="small">Sample-adjusted hit rate.</div>
                  </div>
                  <div className="amount">
                    {(tm.wilsonLowerBound(pd.st.correct || 0, pd.games) * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="miniRow">
                  <div>
                    <strong>Brier score</strong>
                    <div className="small">Lower = better calibration.</div>
                  </div>
                  <div className="amount">{tm.brierScore(pd.person).toFixed(3)}</div>
                </div>
                <div className="miniRow">
                  <div>
                    <strong>Predictor score</strong>
                    <div className="small">Used for Best Predictor rank.</div>
                  </div>
                  <div className="amount">{tm.predictorScore(pd.person).toFixed(1)}</div>
                </div>
                <div className="miniRow">
                  <div>
                    <strong>Verdict</strong>
                    <div className="small">{tm.verdictSummary(pd.person)}</div>
                  </div>
                  <div className="amount">{tm.verdictLabel(pd.person)}</div>
                </div>
              </div>
            </ExpandableSection>

            <div className="card modalSection">
              <h2>By person</h2>
              <div className="miniTable">
                {pd.relationships.length ? (
                  pd.relationships.map(([other, v]) => {
                    const net = v.owesMe - v.iOwe;
                    const label = net >= 0 ? `${other} owes ${pd.person}` : `${pd.person} owes ${other}`;
                    return (
                      <div key={other} className="miniRow">
                        <div>
                          <strong>{label}</strong>
                          <div className="small">
                            {v.items.length} open item{v.items.length === 1 ? "" : "s"}
                          </div>
                        </div>
                        <div className={`amount ${net >= 0 ? "pos" : "neg"}`}>{tm.money(Math.abs(net))}</div>
                      </div>
                    );
                  })
                ) : (
                  <Empty>No open relationships.</Empty>
                )}
              </div>
            </div>

            <div className="card modalSection">
              <h2>Open IOUs</h2>
              <div className="pillRow">
                {Object.entries(pd.data.categoryTotals).sort((a, b) => b[1] - a[1]).length ? (
                  Object.entries(pd.data.categoryTotals)
                    .sort((a, b) => b[1] - a[1])
                    .map(([c, v]) => (
                      <span key={c} className="pill">
                        {c}: {tm.money(v)}
                      </span>
                    ))
                ) : (
                  <span className="pill">No categories yet</span>
                )}
              </div>
              <div className="miniTable">
                {pd.items.length ? (
                  pd.items.map((d) => {
                    const unsettled = tm.iouUnsettledFor(d.created);
                    return (
                      <div key={d.id} className="miniRow">
                        <div>
                          <span className="pill">{d.category}</span>
                          {unsettled ? <span className="pill iouAgePill">Unsettled {unsettled}</span> : null}
                          <strong>{d.dir}</strong>
                          <div className="small">{d.reason}</div>
                        </div>
                        <div className={`amount ${d.cls}`}>{tm.money(d.amount)}</div>
                      </div>
                    );
                  })
                ) : (
                  <Empty>No open IOUs.</Empty>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
