import { getCurrentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { startOfMonthUTC, getTierForLogs, monthLabel } from "@/lib/bonfire";
import LeaderboardTable, { type LeaderboardRow } from "@/components/LeaderboardTable";

export default async function LeaderboardPage() {
  const session = await getCurrentSession();

  const players = await prisma.user.findMany({ where: { role: "PLAYER" }, select: { id: true, name: true } });
  const [monthlySums, allTimeSums] = await Promise.all([
    prisma.logTransaction.groupBy({ by: ["userId"], where: { createdAt: { gte: startOfMonthUTC() } }, _sum: { amount: true } }),
    prisma.logTransaction.groupBy({ by: ["userId"], _sum: { amount: true } }),
  ]);
  const monthlyMap = new Map(monthlySums.map((m) => [m.userId, m._sum.amount ?? 0]));
  const allTimeMap = new Map(allTimeSums.map((m) => [m.userId, m._sum.amount ?? 0]));

  const rows: LeaderboardRow[] = players
    .map((p) => {
      const monthlyLogs = monthlyMap.get(p.id) ?? 0;
      const allTimeLogs = allTimeMap.get(p.id) ?? 0;
      return { id: p.id, name: p.name, monthlyLogs, allTimeLogs, tier: getTierForLogs(monthlyLogs).label, rank: 0 };
    })
    .sort((a, b) => b.monthlyLogs - a.monthlyLogs || b.allTimeLogs - a.allTimeLogs)
    .map((r, i) => ({ ...r, rank: i + 1 }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ash-100">Leaderboard</h1>
        <p className="text-ash-500">Biggest bonfires for {monthLabel()}</p>
      </div>
      <LeaderboardTable rows={rows} highlightId={session?.sub} />
    </div>
  );
}
