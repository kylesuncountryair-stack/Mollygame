import { prisma } from "@/lib/prisma";
import { getTierForLogs } from "@/lib/bonfire";

export type LeaderboardRow = {
  id: string;
  name: string;
  role: "PLAYER" | "ADMIN";
  logs: number;
  tier: string;
  rank: number;
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
  // Admins run the game rather than play it, so they're excluded from the
  // leaderboard, rank, and everywhere else this shared list feeds into.
  const users = await prisma.user.findMany({
    where: { role: "PLAYER" },
    select: { id: true, name: true, role: true, avatarColor: true, avatarIcon: true, createdAt: true },
  });

  const sums = await prisma.logTransaction.groupBy({
    by: ["userId"],
    _sum: { amount: true },
    // The most recent transaction's timestamp doubles as "when they reached
    // their current total" — used below to break ties on equal logs.
    _max: { createdAt: true },
  });
  const logsMap = new Map(sums.map((m) => [m.userId, m._sum.amount ?? 0]));
  const reachedAtMap = new Map(sums.map((m) => [m.userId, m._max.createdAt]));

  const rows = users
    .map((u) => {
      const logs = logsMap.get(u.id) ?? 0;
      return {
        id: u.id,
        name: u.name,
        role: u.role,
        logs,
        tier: getTierForLogs(logs).label,
        rank: 0,
        avatarColor: u.avatarColor,
        avatarIcon: u.avatarIcon,
        // Falls back to join date for players with zero logs (no
        // transactions yet) — only ever used as a tie-break, never shown.
        reachedAt: reachedAtMap.get(u.id) ?? u.createdAt,
      };
    })
    .sort((a, b) => {
      if (b.logs !== a.logs) return b.logs - a.logs;
      // Tied on logs — whoever got there first (earlier timestamp) ranks
      // higher, same "earliest wins" principle used for spark chain pairing.
      return a.reachedAt.getTime() - b.reachedAt.getTime();
    });

  return rows.map(({ reachedAt, ...r }, i) => ({ ...r, rank: i + 1 }));
}
