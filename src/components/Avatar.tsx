// Small colored circle with a person's initials (or a chosen icon) so lists
// of names (the leaderboard, Your Circle, Your Rank, admin tables) read as
// people rather than rows in a spreadsheet. Color and glyph are
// self-service-customizable from the Profile page (see AvatarPicker.tsx);
// anyone who hasn't picked yet falls back to the original deterministic
// hash-based color + initials so nothing looks broken for existing accounts.
import {
  Compass,
  Crown,
  Flame,
  Gem,
  Heart,
  Plane,
  Rocket,
  Star,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";

export const AVATAR_COLOR_PALETTE: Record<string, { bg: string; text: string; label: string }> = {
  ember: { bg: "#3a2410", text: "#ffb673", label: "Ember" },
  navy: { bg: "#1a2340", text: "#8db4ff", label: "Navy" },
  gold: { bg: "#3a2f10", text: "#ffd27a", label: "Gold" },
  green: { bg: "#122a1c", text: "#6ee7a0", label: "Green" },
  purple: { bg: "#2a1030", text: "#e0a0ff", label: "Purple" },
  teal: { bg: "#0d2a30", text: "#7fd8e8", label: "Teal" },
  rose: { bg: "#3a1020", text: "#ff9ec2", label: "Rose" },
  sky: { bg: "#0d2438", text: "#7ec8ff", label: "Sky" },
};

const AVATAR_COLOR_KEYS = Object.keys(AVATAR_COLOR_PALETTE);

// The 10 icon choices, plus "letter" and "initials" are handled separately
// as text-based glyphs (see renderGlyph below). Picked to feel game-y and
// on-brand for an airline: a mix of flight, achievement, and fun symbols.
export const AVATAR_ICON_OPTIONS: { key: string; label: string; Icon: LucideIcon }[] = [
  { key: "flame", label: "Flame", Icon: Flame },
  { key: "plane", label: "Plane", Icon: Plane },
  { key: "rocket", label: "Rocket", Icon: Rocket },
  { key: "star", label: "Star", Icon: Star },
  { key: "trophy", label: "Trophy", Icon: Trophy },
  { key: "crown", label: "Crown", Icon: Crown },
  { key: "zap", label: "Lightning", Icon: Zap },
  { key: "heart", label: "Heart", Icon: Heart },
  { key: "compass", label: "Compass", Icon: Compass },
  { key: "gem", label: "Gem", Icon: Gem },
];

const AVATAR_ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  AVATAR_ICON_OPTIONS.map((o) => [o.key, o.Icon])
);

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

function getFirstLetter(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed[0].toUpperCase() : "?";
}

export default function Avatar({
  name,
  id,
  size = "sm",
  avatarColor,
  avatarIcon,
}: {
  name: string;
  id: string;
  size?: "sm" | "md";
  avatarColor?: string | null;
  avatarIcon?: string | null;
}) {
  const colorKey =
    avatarColor && AVATAR_COLOR_PALETTE[avatarColor] ? avatarColor : AVATAR_COLOR_KEYS[hashString(id || name) % AVATAR_COLOR_KEYS.length];
  const color = AVATAR_COLOR_PALETTE[colorKey];
  const dims = size === "sm" ? "h-7 w-7 text-[11px]" : "h-9 w-9 text-xs";
  const iconDims = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  const IconComponent = avatarIcon ? AVATAR_ICON_MAP[avatarIcon] : undefined;

  return (
    <span
      className={`inline-flex ${dims} shrink-0 items-center justify-center rounded-full font-semibold`}
      style={{ backgroundColor: color.bg, color: color.text }}
      aria-hidden="true"
    >
      {IconComponent ? (
        <IconComponent className={iconDims} strokeWidth={2.25} />
      ) : avatarIcon === "letter" ? (
        getFirstLetter(name)
      ) : (
        getInitials(name)
      )}
    </span>
  );
}
