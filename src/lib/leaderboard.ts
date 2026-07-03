import { prisma } from "@/lib/prisma";
import { startOfMonthCT, getTierForLogs } from "@/lib/bonfire";

export type LeaderboardRow = {
  id: string;
  name: string;
  role: "PLAYER" | "ADMIN";
  monthlyLogs: number;
  allTimeLogs: number;
  tier: string;
  rank: number;
  avatarColor: string | null;
  avatarIcon: string | null;
};

// Shared by the Leaderboard page, the /api/leaderboard route, and the
// dashboard's "Your Rank" + friends widgets, so the ranking logic (and any
// future tie-break rules) only lives in one place.
export async function getLeaderboardRows(): Promise<LeaderboardRow[]> {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, role: true, avatarColor: true, avatarIcon: true },
  });

  const [monthlySums, allTimeSums] = await Promise.all([
    prisma.logTransaction.groupBy({ by: ["userId"], where: { createdAt: { gte: startOfMonthCT() } }, _sum: { amount: true } }),
    prisma.logTransaction.groupBy({ by: ["userId"], _sum: { amount: true } }),
  ]);

  const monthlyMap = new Map(monthlySums.map((m) => [m.userId, m._sum.amount ?? 0]));
  const allTimeMap = new Map(allTimeSums.map((m) => [m.userId, m._sum.amount ?? 0]));

  const rows = users
    .map((u) => {
      const monthlyLogs = monthlyMap.get(u.id) ?? 0;
      const allTimeLogs = allTimeMap.get(u.id) ?? 0;
      return {
        id: u.id,
        name: u.name,
        role: u.role,
        monthlyLogs,
        allTimeLogs,
        tier: getTierForLogs(monthlyLogs).label,
        rank: 0,
        avatarColor: u.avatarColor,
        avatarIcon: u.avatarIcon,
      };
    })
    .sort((a, b) => b.monthlyLogs - a.monthlyLogs || b.allTimeLogs - a.allTimeLogs);

  return rows.map((r, i) => ({ ...r, rank: i + 1 }));
}
