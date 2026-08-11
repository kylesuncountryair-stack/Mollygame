import { prisma } from "@/lib/prisma";
import { getTierForLogs } from "@/lib/bonfire";

export type LeaderboardRow = {
  id: string;
  name: string;
  role: "PLAYER" | "MANAGER" | "ADMIN";
  logs: number;
  tier: string;
  rank: number;
  // How many players (including this one) share this exact rank. 1 means
  // no tie. Lets the UI say "3-way tie for #1" instead of just showing the
  // number, which on its own doesn't make it obvious the rank is shared.
  tieCount: number;
  avatarColor: string | null;
  avatarIcon: string | null;
};

// Shared by the Leaderboard page, the /api/leaderboard route, and the
// dashboard's "Your Rank" + friends widgets, so the ranking logic (and any
// future tie-break rules) only lives in one place.
//
// This is a single-month campaign, so there's no separate "this month" vs
// "all-time" total to track — every LogTransaction ever recorded for a
// player counts toward their one running total.
export async function getLeaderboardRows(): Promise<LeaderboardRow[]> {
  // Admins run the game rather than play it, and managers (promoted from
  // the admin console) are excluded from competing too — both are left out
  // of the leaderboard, rank, and everywhere else this shared list feeds
  // into, by only ever selecting role: PLAYER here.
  const users = await prisma.user.findMany({
    where: { role: "PLAYER" },
    select: { id: true, name: true, role: true, avatarColor: true, avatarIcon: true, createdAt: true },
  });

  const sums = await prisma.logTransaction.groupBy({
    by: ["userId"],
    _sum: { amount: true },
    // The most recent transaction's timestamp doesn't affect rank anymore
    // (see below) — kept only to order tied players consistently within
    // their shared rank, so the list doesn't jump around between loads.
    _max: { createdAt: true },
  });
  const logsMap = new Map(sums.map((m) => [m.userId, m._sum.amount ?? 0]));
  const reachedAtMap = new Map(sums.map((m) => [m.userId, m._max.createdAt]));

  const sorted = users
    .map((u) => {
      const logs = logsMap.get(u.id) ?? 0;
      return {
        id: u.id,
        name: u.name,
        role: u.role,
        logs,
        tier: getTierForLogs(logs).label,
        avatarColor: u.avatarColor,
        avatarIcon: u.avatarIcon,
        // Falls back to join date for players with zero logs (no
        // transactions yet) — only used to order same-rank players in the
        // list, never shown and never affects the rank number itself.
        reachedAt: reachedAtMap.get(u.id) ?? u.createdAt,
      };
    })
    .sort((a, b) => {
      if (b.logs !== a.logs) return b.logs - a.logs;
      return a.reachedAt.getTime() - b.reachedAt.getTime();
    });

  // Dense ("1223") ranking: everyone with the same logs shares the same
  // rank — e.g. three people tied at the top are all #1 — but the next
  // distinct total is just the next number (#2), not skipping ahead by
  // how many people were tied before it.
  let rank = 0;
  const ranked = sorted.map((r, i) => {
    if (i === 0 || r.logs !== sorted[i - 1].logs) rank++;
    return { ...r, rank };
  });

  const tieCounts = new Map<number, number>();
  for (const r of ranked) tieCounts.set(r.rank, (tieCounts.get(r.rank) ?? 0) + 1);

  return ranked.map(({ reachedAt, ...r }) => ({ ...r, tieCount: tieCounts.get(r.rank) ?? 1 }));
}
