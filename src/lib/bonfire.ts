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

export function startOfMonthUTC(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export function startOfTodayUTC(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function endOfTodayUTC(date = new Date()): Date {
  const d = startOfTodayUTC(date);
  d.setUTCDate(d.getUTCDate() + 1);
  return d;
}

export function startOfWeekUTC(date = new Date()): Date {
  const d = startOfTodayUTC(date);
  const day = d.getUTCDay(); // 0 = Sunday
  const diff = (day + 6) % 7; // days since Monday
  d.setUTCDate(d.getUTCDate() - diff);
  return d;
}

export function endOfWeekUTC(date = new Date()): Date {
  const d = startOfWeekUTC(date);
  d.setUTCDate(d.getUTCDate() + 7);
  return d;
}

export function monthLabel(date = new Date()): string {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}
