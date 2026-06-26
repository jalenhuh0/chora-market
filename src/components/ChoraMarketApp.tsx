"use client";

import { useChoraMarket } from "@/hooks/useChoraMarket";
import type { Screen } from "@/hooks/useChoraMarket";
import { AppHeader } from "@/components/chora-market/AppHeader";
import { Empty } from "@/components/chora-market/Empty";
import { PersonDetailModal } from "@/components/chora-market/PersonDetailModal";
import { BetsScreen } from "@/components/chora-market/screens/BetsScreen";
import { DashboardScreen } from "@/components/chora-market/screens/DashboardScreen";
import { EntryScreen } from "@/components/chora-market/screens/EntryScreen";
import { PeopleScreen } from "@/components/chora-market/screens/PeopleScreen";
import { SettingsScreen } from "@/components/chora-market/screens/SettingsScreen";

type Props = {
  groupId: string;
  groupName: string;
  inviteCode: string;
  userId: string;
  onSignOut: () => void;
  onSwitchGroup: () => void;
};

export default function ChoraMarketApp(props: Props) {
  const tm = useChoraMarket(props);
  const tabs: { id: Screen; label: string; shortLabel: string }[] = [
    { id: "dashboard", label: "Dashboard", shortLabel: "Home" },
    { id: "entry", label: "New IOU", shortLabel: "IOU" },
    { id: "bets", label: "Bet Market", shortLabel: "Bets" },
    { id: "people", label: "People", shortLabel: "People" },
    { id: "settings", label: "Settings", shortLabel: "Settings" },
  ];

  if (tm.loading) {
    return (
      <div className="appShell">
        <div className="app">
          <Empty>Loading group data…</Empty>
        </div>
      </div>
    );
  }

  return (
    <div className="appShell">
      <div className="app">
      <AppHeader tm={tm} tabs={tabs} />
      <DashboardScreen tm={tm} />
      <EntryScreen tm={tm} />
      <BetsScreen tm={tm} />
      <PeopleScreen tm={tm} />
      <SettingsScreen tm={tm} />
      <PersonDetailModal tm={tm} />

      <div id="toast" className={`toast${tm.toast ? " show" : ""}`}>
        {tm.toast && (
          <>
            <strong>Notification</strong>
            <div className="small">{tm.toast}</div>
          </>
        )}
      </div>
      </div>
    </div>
  );
}
