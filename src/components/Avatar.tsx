type Props = {
  url?: string | null;
  name: string;
  size?: number;
};

export function Avatar({ url, name, size = 36 }: Props) {
  const label = name || "?";
  if (url) {
    return (
      <img
        src={url}
        alt={label}
        className="avatar avatarImg"
        width={size}
        height={size}
        style={{ width: size, height: size }}
      />
    );
  }
  const initials = String(label)
    .split(" ")
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {initials}
    </div>
  );
}
