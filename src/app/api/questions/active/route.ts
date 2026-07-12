import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";
import { startOfTodayCT, endOfTodayCT, startOfWeekCT, endOfWeekCT } from "@/lib/bonfire";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [daily, weekly] = await Promise.all([
    prisma.question.findFirst({
      where: { type: "DAILY", activeDate: { gte: startOfTodayCT(), lt: endOfTodayCT() } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.question.findFirst({
      where: { type: "WEEKLY", activeDate: { gte: startOfWeekCT(), lt: endOfWeekCT() } },
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
          format: q.format,
          prompt: q.prompt,
          options: q.options,
          logsReward: q.logsReward,
          answered: answers.find((a) => a.questionId === q.id) ?? null,
        }
      : null;

  return NextResponse.json({ daily: withAnswer(daily), weekly: withAnswer(weekly) });
}
