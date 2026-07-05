import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";
import { startOfMonthCT, getTierForLogs } from "@/lib/bonfire";
import { tryTriggerSparkChain } from "@/lib/sparkChain";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const selectedIndex = body?.selectedIndex;
  if (typeof selectedIndex !== "number") {
    return NextResponse.json({ error: "selectedIndex is required." }, { status: 400 });
  }

  const question = await prisma.question.findUnique({ where: { id: params.id } });
  if (!question) return NextResponse.json({ error: "Question not found." }, { status: 404 });

  const existing = await prisma.answer.findUnique({
    where: { userId_questionId: { userId: session.sub, questionId: question.id } },
  });
  if (existing) {
    return NextResponse.json({ error: "You already answered this question." }, { status: 409 });
  }

  const isCorrect = selectedIndex === question.correctIndex;
  const logsAwarded = isCorrect ? question.logsReward : 0;

  // Snapshot the tier before this answer lands, so we can tell the client
  // whether this specific answer pushed the player into a new tier (for the
  // tier-up celebration banner).
  const monthlySumBefore = await prisma.logTransaction.aggregate({
    where: { userId: session.sub, createdAt: { gte: startOfMonthCT() } },
    _sum: { amount: true },
  });
  const logsBefore = monthlySumBefore._sum.amount ?? 0;
  const logsAfter = logsBefore + logsAwarded;
  const tierBefore = getTierForLogs(logsBefore);
  const tierAfter = getTierForLogs(logsAfter);
  const tierUp = isCorrect && tierAfter.key !== tierBefore.key ? { key: tierAfter.key, label: tierAfter.label } : null;

  const answer = await prisma.$transaction(async (tx) => {
    const created = await tx.answer.create({
      data: {
        userId: session.sub,
        questionId: question.id,
        selectedIndex,
        isCorrect,
        logsAwarded,
      },
    });
    if (isCorrect) {
      await tx.logTransaction.create({
        data: {
          userId: session.sub,
          amount: logsAwarded,
          reason: `Correct answer: "${question.prompt}"`,
          type: "QUESTION_CORRECT",
        },
      });
    }
    return created;
  });

  // Best-effort: a spark chain is a small bonus, not core game logic, so a
  // failure here shouldn't fail the answer submission itself.
  const sparkChain = isCorrect ? await tryTriggerSparkChain(session.sub).catch(() => null) : null;

  return NextResponse.json({
    isCorrect,
    logsAwarded,
    correctIndex: question.correctIndex,
    answerId: answer.id,
    tierUp,
    sparkChain,
  });
}
