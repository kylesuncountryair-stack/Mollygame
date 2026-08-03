import { prisma } from "@/lib/prisma";
import { endOfTodayCT } from "@/lib/bonfire";

// All DAILY questions scheduled for the most recent date that isn't in the
// future — not just a single one. Admins can create more than one DAILY
// question for the same date, and they should all show up together. Like
// the single-question version this replaced, the whole set carries forward
// unchanged until a newer date's questions take over (e.g. if the last
// DAILY questions are dated Aug 3 and the next ones are dated Aug 5, Aug
// 3's questions keep showing through Aug 4).
//
// All questions entered for the same calendar day get the exact same UTC
// activeDate timestamp (see centralDateStringToUTC in this same file's
// neighbor, src/lib/bonfire.ts), so an equality match is a safe way to
// group them.
export async function getActiveDailyQuestions() {
  const latest = await prisma.question.findFirst({
    where: { type: "DAILY", activeDate: { lt: endOfTodayCT() } },
    orderBy: { activeDate: "desc" },
    select: { activeDate: true },
  });
  if (!latest) return [];

  return prisma.question.findMany({
    where: { type: "DAILY", activeDate: latest.activeDate },
    orderBy: { createdAt: "asc" },
  });
}
