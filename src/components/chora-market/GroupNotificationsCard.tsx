"use client";

import { Empty } from "@/components/chora-market/Empty";

const SCROLL_LIMIT = 30;

type NotificationItem = {
  title: string;
  text: string;
};

type Props = {
  notifs: NotificationItem[];
};

export function GroupNotificationsCard({ notifs }: Props) {
  const items = notifs.slice(0, SCROLL_LIMIT);

  return (
    <div className="card">
      <h2>Group Notifications</h2>
      <p className="small leaderboardHint">Bet launches, IOUs, and group updates.</p>
      <div className="activityScroll list">
        {items.length ? (
          items.map((n, i) => (
            <div key={i} className="item activityItem">
              <div className="activityItemMain">
                <strong>{n.title}</strong>
                <div className="small">{n.text}</div>
              </div>
            </div>
          ))
        ) : (
          <Empty>No notifications yet.</Empty>
        )}
      </div>
    </div>
  );
}
