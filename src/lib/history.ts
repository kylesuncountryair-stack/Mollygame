import { prisma } from "@/lib/prisma";
import { monthBoundsCT, getTierForLogs } from "@/lib/bonfire";

export type MonthlyStanding = {
  id: string;
  name: string;
  logs: number;
  tier: string;
  avatarColor: string | null;
  avatarIcon: string | null;
};

export type MonthlyHistoryEntry = {
  label: string;
  start: Date;
  end: Date;
  totalLogsIssued: number;
  participantCount: number;
  standings: MonthlyStanding[];
};

// Walks backward month-by-month from the current Central-time month (which
// is intentionally excluded — it's still live and belongs on the
// Leaderboard, not the archive), stopping as soon as a month has zero
// LogTransaction activity so this doesn't return an endless list of empty
// months from before the campaign existed.
export async function getMonthlyHistory(maxMonths = 12): Promise<MonthlyHistoryEntry[]> {
  const entries: MonthlyHistoryEntry[] = [];

  for (let i = 1; i <= maxMonths; i++) {
    const { start, end, label } = monthBoundsCT(i);

    const sums = await prisma.logTransaction.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: start, lt: end } },
      _sum: { amount: true },
    });

    if (sums.length === 0) break;

    const userIds = sums.map((s) => s.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, avatarColor: true, avatarIcon: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const standings = sums
      .map((s) => {
        const logs = s._sum.amount ?? 0;
        const u = userMap.get(s.userId);
        return {
          id: s.userId,
          name: u?.name ?? "Unknown",
          logs,
          tier: getTierForLogs(logs).label,
          avatarColor: u?.avatarColor ?? null,
          avatarIcon: u?.avatarIcon ?? null,
        };
      })
      .filter((s) => s.logs > 0)
      .sort((a, b) => b.logs - a.logs);

    entries.push({
      label,
      start,
      end,
      totalLogsIssued: standings.reduce((sum, s) => sum + s.logs, 0),
      participantCount: standings.length,
      standings,
    });
  }

  return entries;
}
