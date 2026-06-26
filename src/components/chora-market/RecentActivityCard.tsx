"use client";

import { Empty } from "@/components/chora-market/Empty";

const VISIBLE_COUNT = 5;

type ActivityItem = {
  title: string;
  text: string;
  time: string;
};

type Props = {
  activity: ActivityItem[];
};

export function RecentActivityCard({ activity }: Props) {
  const items = activity.slice(0, VISIBLE_COUNT);

  return (
    <div className="card">
      <h2>Recent Activity</h2>
      <p className="small leaderboardHint">Latest updates in your group.</p>
      <div className="list">
        {items.length ? (
          items.map((a, i) => (
            <div key={i} className="item activityItem">
              <div className="activityItemMain">
                <strong>{a.title}</strong>
                <div className="small">{a.text}</div>
              </div>
              <span className="pill activityTime">{a.time}</span>
            </div>
          ))
        ) : (
          <Empty>No activity yet.</Empty>
        )}
      </div>
    </div>
  );
}
