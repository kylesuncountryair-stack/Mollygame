import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfMonthUTC, getTierForLogs } from "@/lib/bonfire";

export async function GET() {
  const players = await prisma.user.findMany({ where: { role: "PLAYER" }, select: { id: true, name: true, email: true } });

  const [monthlySums, allTimeSums] = await Promise.all([
    prisma.logTransaction.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: startOfMonthUTC() } },
      _sum: { amount: true },
    }),
    prisma.logTransaction.groupBy({
      by: ["userId"],
      _sum: { amount: true },
    }),
  ]);

  const monthlyMap = new Map(monthlySums.map((m) => [m.userId, m._sum.amount ?? 0]));
  const allTimeMap = new Map(allTimeSums.map((m) => [m.userId, m._sum.amount ?? 0]));

  const rows = players.map((p) => {
    const monthlyLogs = monthlyMap.get(p.id) ?? 0;
    const allTimeLogs = allTimeMap.get(p.id) ?? 0;
    const tier = getTierForLogs(monthlyLogs);
    return {
      id: p.id,
      name: p.name,
      monthlyLogs,
      allTimeLogs,
      tier: tier.label,
      tierKey: tier.key,
    };
  });

  rows.sort((a, b) => b.monthlyLogs - a.monthlyLogs || b.allTimeLogs - a.allTimeLogs);

  return NextResponse.json({
    rows: rows.map((r, i) => ({ ...r, rank: i + 1 })),
  });
}
