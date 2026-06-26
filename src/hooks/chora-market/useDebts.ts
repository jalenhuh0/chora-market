"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { estimate, money, uid } from "@/lib/market/defaults";
import type { ChoraMarketCore } from "@/hooks/chora-market/useChoraMarketCore";

export function useDebts(core: ChoraMarketCore) {
  const { state, saveWithActivity, showToast } = core;
  const [reason, setReason] = useState("");
  const [owedSelect, setOwedSelect] = useState("");
  const [owesSelect, setOwesSelect] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const didInit = useRef(false);

  useEffect(() => {
    didInit.current = false;
  }, [core.groupId]);

  useEffect(() => {
    if (core.loading || didInit.current) return;
    didInit.current = true;
    if (core.state.people.length) {
      setOwedSelect(core.state.people[0]);
      setOwesSelect(core.state.people[1] || core.state.people[0]);
    }
  }, [core.loading, core.state.people, core.groupId]);

  const addDebt = useCallback(async () => {
    const owed = owedSelect;
    const owes = owesSelect;
    const r = reason.trim() || "Untitled IOU";
    if (owed === owes) return showToast("Owed and owes must be different people.");
    const amt = amount || String(estimate(r));
    await saveWithActivity(
      (s) => {
        s.debts.unshift({
          id: uid(),
          reason: r,
          owed,
          owes,
          amount: Number(amt),
          category,
          settled: false,
          created: Date.now(),
        });
      },
      { title: "New IOU", text: `${owes} owes ${owed} ${money(amt)} for ${r}` }
    );
    setReason("");
    setAmount("");
    showToast("IOU added to the market.");
  }, [owedSelect, owesSelect, reason, amount, category, saveWithActivity, showToast]);

  const parseReason = useCallback(() => {
    const r = reason.toLowerCase();
    state.people.forEach((p) => {
      const re = new RegExp(p.toLowerCase());
      if (re.test(r)) {
        if (/owes|lost/.test(r)) setOwesSelect(p);
        else setOwedSelect(p);
      }
    });
    setAmount(String(estimate(r)));
    if (/bet|lost|wins|winner/.test(r)) setCategory("Bet");
    else if (/borrowed|hoodie|monitor|item/.test(r)) setCategory("Item");
    else if (/ride|airport|uber/.test(r)) setCategory("Ride");
    else if (/food|dinner|boba|coffee|sushi|cane|chipotle/.test(r)) setCategory("Food");
    showToast("Parsed reason and suggested fields.");
  }, [reason, state.people, showToast]);

  const settleDebt = useCallback(
    async (id: string) => {
      const d = state.debts.find((x) => x.id === id);
      if (!d) return;
      await saveWithActivity(
        (s) => {
          const debt = s.debts.find((x) => x.id === id);
          if (debt) debt.settled = true;
        },
        { title: "Settled IOU", text: `${d.owes} settled ${money(d.amount)} with ${d.owed}.` }
      );
    },
    [state.debts, saveWithActivity]
  );

  return {
    reason,
    setReason,
    owedSelect,
    setOwedSelect,
    owesSelect,
    setOwesSelect,
    amount,
    setAmount,
    category,
    setCategory,
    addDebt,
    parseReason,
    settleDebt,
  };
}
