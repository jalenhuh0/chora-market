"use client";

import { useTabMarket } from "@/hooks/useTabMarket";
import type { Screen } from "@/hooks/useTabMarket";
import { AppHeader } from "@/components/tab-market/AppHeader";
import { Empty } from "@/components/tab-market/Empty";
import { PersonDetailModal } from "@/components/tab-market/PersonDetailModal";
import { BetsScreen } from "@/components/tab-market/screens/BetsScreen";
import { DashboardScreen } from "@/components/tab-market/screens/DashboardScreen";
import { EntryScreen } from "@/components/tab-market/screens/EntryScreen";
import { PeopleScreen } from "@/components/tab-market/screens/PeopleScreen";
import { SettingsScreen } from "@/components/tab-market/screens/SettingsScreen";

type Props = {
  groupId: string;
  groupName: string;
  inviteCode: string;
  userId: string;
  onSignOut: () => void;
  onSwitchGroup: () => void;
};

export default function TabMarketApp(props: Props) {
  const tm = useTabMarket(props);
  const tabs: { id: Screen; label: string }[] = [
    { id: "dashboard", label: "Dashboard" },
    { id: "entry", label: "New IOU" },
    { id: "bets", label: "Bet Market" },
    { id: "people", label: "People" },
    { id: "settings", label: "Settings" },
  ];

  if (tm.loading) {
    return (
      <div className="app">
        <Empty>Loading group data…</Empty>
      </div>
    );
  }

  return (
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
  );
}
