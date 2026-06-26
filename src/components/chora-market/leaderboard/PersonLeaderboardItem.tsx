"use client";

type PersonLeaderboardItemProps = {
  rank?: number;
  person: string;
  personInitials: string;
  subtitle: string;
  amount: string;
  amountClass?: string;
  onClick: () => void;
};

export function PersonLeaderboardItem({
  rank,
  person,
  personInitials,
  subtitle,
  amount,
  amountClass,
  onClick,
}: PersonLeaderboardItemProps) {
  return (
    <div className="item clickable" onClick={onClick}>
      <div style={{ width: "100%" }}>
        <div className="personLine">
          <div className="avatar">{personInitials}</div>
          <div>
            <strong>
              {rank !== undefined ? `#${rank} ` : ""}
              {person}
            </strong>
            <div className="small">{subtitle}</div>
          </div>
        </div>
      </div>
      <div className={`amount ${amountClass || ""}`}>{amount}</div>
    </div>
  );
}
