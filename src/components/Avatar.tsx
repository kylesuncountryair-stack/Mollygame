// Small colored circle with a person's initials, so lists of names (the
// leaderboard, Your Circle, Your Rank) read as people rather than rows in a
// spreadsheet. Color is derived deterministically from their id, so the
// same person always gets the same color across the app.
const AVATAR_COLORS = [
  { bg: "#3a2410", text: "#ffb673" }, // ember
  { bg: "#1a2340", text: "#8db4ff" }, // navy
  { bg: "#3a2f10", text: "#ffd27a" }, // gold
  { bg: "#122a1c", text: "#6ee7a0" }, // green
  { bg: "#2a1030", text: "#e0a0ff" }, // purple
  { bg: "#0d2a30", text: "#7fd8e8" }, // teal
];

function hashString(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({ name, id, size = "sm" }: { name: string; id: string; size?: "sm" | "md" }) {
  const color = AVATAR_COLORS[hashString(id || name) % AVATAR_COLORS.length];
  const dims = size === "sm" ? "h-7 w-7 text-[11px]" : "h-9 w-9 text-xs";
  return (
    <span
      className={`inline-flex ${dims} shrink-0 items-center justify-center rounded-full font-semibold`}
      style={{ backgroundColor: color.bg, color: color.text }}
      aria-hidden="true"
    >
      {getInitials(name)}
    </span>
  );
}
