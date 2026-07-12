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
  const users = await prisma.user.findMany({
    select: { id: true, name: true, role: true, avatarColor: true, avatarIcon: true },
  });

  const sums = await prisma.logTransaction.groupBy({ by: ["userId"], _sum: { amount: true } });
  const logsMap = new Map(sums.map((m) => [m.userId, m._sum.amount ?? 0]));

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
      };
    })
    .sort((a, b) => b.logs - a.logs);

  return rows.map((r, i) => ({ ...r, rank: i + 1 }));
}
