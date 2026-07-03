import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfMonthCT, getTierForLogs } from "@/lib/bonfire";
import { requireAdminApi } from "@/lib/session";

export async function GET() {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const players = await prisma.user.findMany({
    where: { role: "PLAYER" },
    select: { id: true, name: true, email: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const [answerCounts, allTimeSums, monthlySums] = await Promise.all([
    prisma.answer.groupBy({ by: ["userId", "isCorrect"], _count: { _all: true } }),
    prisma.logTransaction.groupBy({ by: ["userId"], _sum: { amount: true } }),
    prisma.logTransaction.groupBy({ by: ["userId"], where: { createdAt: { gte: startOfMonthCT() } }, _sum: { amount: true } }),
  ]);

  const allTimeMap = new Map(allTimeSums.map((s) => [s.userId, s._sum.amount ?? 0]));
  const monthlyMap = new Map(monthlySums.map((s) => [s.userId, s._sum.amount ?? 0]));

  const correctMap = new Map<string, number>();
  const wrongMap = new Map<string, number>();
  for (const row of answerCounts) {
    if (row.isCorrect) correctMap.set(row.userId, row._count._all);
    else wrongMap.set(row.userId, row._count._all);
  }

  const rows = players.map((p) => {
    const correct = correctMap.get(p.id) ?? 0;
    const wrong = wrongMap.get(p.id) ?? 0;
    const allTimeLogs = allTimeMap.get(p.id) ?? 0;
    const monthlyLogs = monthlyMap.get(p.id) ?? 0;
    return {
      id: p.id,
      name: p.name,
      email: p.email,
      joined: p.createdAt,
      answered: correct + wrong,
      correct,
      wrong,
      allTimeLogs,
      monthlyLogs,
      tier: getTierForLogs(monthlyLogs).label,
    };
  });

  return NextResponse.json({ players: rows });
}
