import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";
import { startOfWeekCT, endOfWeekCT } from "@/lib/bonfire";
import { getActiveDailyQuestions } from "@/lib/dailyQuestions";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [dailyQuestions, weekly] = await Promise.all([
    getActiveDailyQuestions(),
    prisma.question.findFirst({
      where: { type: "WEEKLY", activeDate: { gte: startOfWeekCT(), lt: endOfWeekCT() } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const ids = [...dailyQuestions.map((q) => q.id), weekly?.id].filter(Boolean) as string[];
  const answers = ids.length
    ? await prisma.answer.findMany({ where: { userId: session.sub, questionId: { in: ids } } })
    : [];

  const withAnswer = (q: typeof weekly) =>
    q
      ? {
          id: q.id,
          type: q.type,
          format: q.format,
          prompt: q.prompt,
          options: q.options,
          logsReward: q.logsReward,
          answered: answers.find((a) => a.questionId === q.id) ?? null,
        }
      : null;

  return NextResponse.json({ daily: dailyQuestions.map(withAnswer), weekly: withAnswer(weekly) });
}
