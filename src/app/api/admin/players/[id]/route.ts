import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTierForLogs, startOfMonthUTC } from "@/lib/bonfire";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const player = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  if (!player) return NextResponse.json({ error: "Player not found." }, { status: 404 });

  const [answers, transactions, allTimeSum, monthlySum] = await Promise.all([
    prisma.answer.findMany({
      where: { userId: params.id },
      include: { question: true },
      orderBy: { answeredAt: "desc" },
    }),
    prisma.logTransaction.findMany({
      where: { userId: params.id },
      include: { issuedBy: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.logTransaction.aggregate({ where: { userId: params.id }, _sum: { amount: true } }),
    prisma.logTransaction.aggregate({
      where: { userId: params.id, createdAt: { gte: startOfMonthUTC() } },
      _sum: { amount: true },
    }),
  ]);

  const allTimeLogs = allTimeSum._sum.amount ?? 0;
  const monthlyLogs = monthlySum._sum.amount ?? 0;

  return NextResponse.json({
    player,
    allTimeLogs,
    monthlyLogs,
    tier: getTierForLogs(monthlyLogs).label,
    answers: answers.map((a) => ({
      id: a.id,
      prompt: a.question.prompt,
      type: a.question.type,
      isCorrect: a.isCorrect,
      logsAwarded: a.logsAwarded,
      answeredAt: a.answeredAt,
    })),
    transactions: transactions.map((t) => ({
      id: t.id,
      amount: t.amount,
      reason: t.reason,
      type: t.type,
      createdAt: t.createdAt,
      issuedByName: t.issuedBy?.name ?? null,
    })),
  });
}
