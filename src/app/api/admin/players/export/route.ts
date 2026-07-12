import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/session";
import { getTierForLogs } from "@/lib/bonfire";

// Wraps a field in quotes (doubling any internal quotes) only when it
// actually needs it — i.e. contains a comma, quote, or newline — so most
// cells stay clean and readable in the raw CSV.
function csvField(value: string | number): string {
  const s = String(value);
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET() {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const players = await prisma.user.findMany({
    where: { role: "PLAYER" },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  // Same source data/shape as the admin Players table (src/app/admin/players/page.tsx)
  // so the exported numbers always match what's shown on screen.
  const [answerCounts, logSums] = await Promise.all([
    prisma.answer.groupBy({ by: ["userId", "isCorrect"], _count: { _all: true } }),
    prisma.logTransaction.groupBy({ by: ["userId"], _sum: { amount: true } }),
  ]);

  const logsMap = new Map(logSums.map((s) => [s.userId, s._sum.amount ?? 0]));
  const correctMap = new Map<string, number>();
  const wrongMap = new Map<string, number>();
  for (const row of answerCounts) {
    if (row.isCorrect) correctMap.set(row.userId, row._count._all);
    else wrongMap.set(row.userId, row._count._all);
  }

  const header = ["Name", "Email", "Answered", "Correct", "Wrong", "Logs", "Tier"];
  const rows = players.map((p) => {
    const correct = correctMap.get(p.id) ?? 0;
    const wrong = wrongMap.get(p.id) ?? 0;
    const logs = logsMap.get(p.id) ?? 0;
    return [p.name, p.email, correct + wrong, correct, wrong, logs, getTierForLogs(logs).label];
  });

  const csv = [header, ...rows].map((r) => r.map(csvField).join(",")).join("\r\n");
  const dateStamp = new Date().toLocaleDateString("en-CA", { timeZone: "America/Chicago" });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bonfire-players-${dateStamp}.csv"`,
    },
  });
}
