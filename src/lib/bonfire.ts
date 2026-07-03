export type SideFlame = { dx: number; scale: number; rotate: number; opacity: number };

export type BonfireTier = {
  key: string;
  label: string;
  min: number;
  // Scale of the main flame glyph, anchored to its own base so it grows
  // straight up rather than drifting as it scales.
  flameScale: number;
  // Smaller extra flame glyphs flanking the main one, for a fuller/wider
  // fire at higher tiers.
  sideFlames: SideFlame[];
  // Crossed logs drawn at the base.
  logCount: number;
  // Floating embers drifting up from the fire.
  emberCount: number;
  // Adds a second, tighter glow ring for the top tier.
  doubleGlow: boolean;
  glowClass: string;
  description: string;
};

export const BONFIRE_TIERS: BonfireTier[] = [
  {
    key: "spark",
    label: "Spark",
    min: 0,
    flameScale: 0.38,
    sideFlames: [],
    logCount: 0,
    emberCount: 0,
    doubleGlow: false,
    glowClass: "shadow-glow",
    description: "Just getting started",
  },
  {
    key: "kindling",
    label: "Kindling",
    min: 5,
    flameScale: 0.55,
    sideFlames: [],
    logCount: 2,
    emberCount: 2,
    doubleGlow: false,
    glowClass: "shadow-glow",
    description: "Catching on",
  },
  {
    key: "flame",
    label: "Flame",
    min: 15,
    flameScale: 0.72,
    sideFlames: [],
    logCount: 3,
    emberCount: 3,
    doubleGlow: false,
    glowClass: "shadow-glow",
    description: "Building momentum",
  },
  {
    key: "bonfire",
    label: "Bonfire",
    min: 30,
    flameScale: 0.9,
    sideFlames: [{ dx: -24, scale: 0.42, rotate: -10, opacity: 0.85 }],
    logCount: 4,
    emberCount: 4,
    doubleGlow: false,
    glowClass: "shadow-glow-lg",
    description: "Burning bright",
  },
  {
    key: "blaze",
    label: "Blaze",
    min: 60,
    flameScale: 1.08,
    sideFlames: [
      { dx: -30, scale: 0.48, rotate: -11, opacity: 0.85 },
      { dx: 30, scale: 0.4, rotate: 10, opacity: 0.8 },
    ],
    logCount: 5,
    emberCount: 6,
    doubleGlow: false,
    glowClass: "shadow-glow-lg",
    description: "Hard to miss",
  },
  {
    key: "wildfire",
    label: "Wildfire",
    min: 100,
    flameScale: 1.3,
    sideFlames: [
      { dx: -34, scale: 0.58, rotate: -12, opacity: 0.9 },
      { dx: 36, scale: 0.48, rotate: 11, opacity: 0.85 },
    ],
    logCount: 6,
    emberCount: 8,
    doubleGlow: true,
    glowClass: "shadow-glow-lg",
    description: "Unstoppable",
  },
];

export function getTierForLogs(logs: number): BonfireTier {
  let tier = BONFIRE_TIERS[0];
  for (const t of BONFIRE_TIERS) {
    if (logs >= t.min) tier = t;
  }
  return tier;
}

export function nextTierProgress(logs: number): { next: BonfireTier | null; progress: number } {
  const idx = BONFIRE_TIERS.findIndex((t) => logs < t.min);
  if (idx === -1) return { next: null, progress: 1 };
  const next = BONFIRE_TIERS[idx];
  const prev = BONFIRE_TIERS[idx - 1] ?? { min: 0 };
  const span = next.min - prev.min;
  const progress = span === 0 ? 1 : (logs - prev.min) / span;
  return { next, progress: Math.max(0, Math.min(1, progress)) };
}

// All "what day is it" logic runs in Central time (America/Chicago, covers
// both CST and CDT automatically) instead of UTC, since that's the timezone
// that actually matters to the people playing — daily questions change over
// at Central midnight, not UTC midnight. Every "activeDate"/day boundary
// stored in the database is the UTC instant that corresponds to Central
// midnight for that calendar day.
const TIME_ZONE = "America/Chicago";

function getZonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
  };
}

// The UTC instant corresponding to Y/M/D 00:00:00 wall-clock time in the
// given timezone (handles the CST/CDT offset, including on either side of a
// DST transition).
function zonedMidnightUTC(year: number, month: number, day: number, timeZone: string): Date {
  const guess = Date.UTC(year, month - 1, day, 0, 0, 0);
  const parts = getZonedParts(new Date(guess), timeZone);
  const asUTC = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  const offsetMs = asUTC - guess;
  return new Date(guess - offsetMs);
}

// Converts a "YYYY-MM-DD" string (e.g. from an <input type="date">) into
// the UTC instant representing Central midnight on that calendar day. Use
// this instead of `new Date(dateString)` when saving an admin-picked date —
// the bare constructor parses date-only strings as UTC midnight, which is
// off by 5-6 hours from what was actually intended here.
export function centralDateStringToUTC(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return zonedMidnightUTC(year, month, day, TIME_ZONE);
}

export function startOfMonthCT(date = new Date()): Date {
  const { year, month } = getZonedParts(date, TIME_ZONE);
  return zonedMidnightUTC(year, month, 1, TIME_ZONE);
}

export function startOfTodayCT(date = new Date()): Date {
  const { year, month, day } = getZonedParts(date, TIME_ZONE);
  return zonedMidnightUTC(year, month, day, TIME_ZONE);
}

export function endOfTodayCT(date = new Date()): Date {
  const { year, month, day } = getZonedParts(date, TIME_ZONE);
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  return zonedMidnightUTC(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate(), TIME_ZONE);
}

export function startOfWeekCT(date = new Date()): Date {
  const { year, month, day } = getZonedParts(date, TIME_ZONE);
  const dow = new Date(Date.UTC(year, month - 1, day)).getUTCDay(); // 0 = Sunday
  const diff = (dow + 6) % 7; // days since Monday
  const monday = new Date(Date.UTC(year, month - 1, day - diff));
  return zonedMidnightUTC(monday.getUTCFullYear(), monday.getUTCMonth() + 1, monday.getUTCDate(), TIME_ZONE);
}

export function endOfWeekCT(date = new Date()): Date {
  const start = startOfWeekCT(date);
  const { year, month, day } = getZonedParts(start, TIME_ZONE);
  const nextWeek = new Date(Date.UTC(year, month - 1, day + 7));
  return zonedMidnightUTC(nextWeek.getUTCFullYear(), nextWeek.getUTCMonth() + 1, nextWeek.getUTCDate(), TIME_ZONE);
}

export function monthLabel(date = new Date()): string {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: TIME_ZONE });
}
