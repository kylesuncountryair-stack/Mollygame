export type BonfireTier = {
  key: string;
  label: string;
  min: number;
  flameScale: number;
  glowClass: string;
  description: string;
};

export const BONFIRE_TIERS: BonfireTier[] = [
  { key: "spark", label: "Spark", min: 0, flameScale: 0.55, glowClass: "shadow-glow", description: "Just getting started" },
  { key: "kindling", label: "Kindling", min: 5, flameScale: 0.7, glowClass: "shadow-glow", description: "Catching on" },
  { key: "flame", label: "Flame", min: 15, flameScale: 0.85, glowClass: "shadow-glow", description: "Building momentum" },
  { key: "bonfire", label: "Bonfire", min: 30, flameScale: 1, glowClass: "shadow-glow-lg", description: "Burning bright" },
  { key: "blaze", label: "Blaze", min: 60, flameScale: 1.2, glowClass: "shadow-glow-lg", description: "Hard to miss" },
  { key: "wildfire", label: "Wildfire", min: 100, flameScale: 1.45, glowClass: "shadow-glow-lg", description: "Unstoppable" },
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
