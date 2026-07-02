import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";

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

  return NextResponse.json({
    isCorrect,
    logsAwarded,
    correctIndex: question.correctIndex,
    answerId: answer.id,
  });
}
