import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";
import { startOfTodayUTC, endOfTodayUTC, startOfWeekUTC, endOfWeekUTC } from "@/lib/bonfire";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [daily, weekly] = await Promise.all([
    prisma.question.findFirst({
      where: { type: "DAILY", activeDate: { gte: startOfTodayUTC(), lt: endOfTodayUTC() } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.question.findFirst({
      where: { type: "WEEKLY", activeDate: { gte: startOfWeekUTC(), lt: endOfWeekUTC() } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const ids = [daily?.id, weekly?.id].filter(Boolean) as string[];
  const answers = ids.length
    ? await prisma.answer.findMany({ where: { userId: session.sub, questionId: { in: ids } } })
    : [];

  const withAnswer = (q: typeof daily) =>
    q
      ? {
          id: q.id,
          type: q.type,
          prompt: q.prompt,
          options: q.options,
          logsReward: q.logsReward,
          answered: answers.find((a) => a.questionId === q.id) ?? null,
        }
      : null;

  return NextResponse.json({ daily: withAnswer(daily), weekly: withAnswer(weekly) });
}
