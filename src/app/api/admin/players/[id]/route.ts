import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTierForLogs } from "@/lib/bonfire";
import { getCurrentSession, requireAdminApi } from "@/lib/session";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const player = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  if (!player) return NextResponse.json({ error: "Player not found." }, { status: 404 });

  const [answers, transactions, logSum] = await Promise.all([
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
  ]);

  const logs = logSum._sum.amount ?? 0;

  return NextResponse.json({
    player,
    logs,
    tier: getTierForLogs(logs).label,
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

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : undefined;
  const role = body?.role;

  const data: Record<string, unknown> = {};

  if (name !== undefined) {
    if (name.length < 2) {
      return NextResponse.json({ error: "Name must be at least 2 characters." }, { status: 400 });
    }
    data.name = name;
  }

  if (role !== undefined) {
    if (role !== "PLAYER" && role !== "ADMIN") {
      return NextResponse.json({ error: "role must be PLAYER or ADMIN." }, { status: 400 });
    }
    const session = await getCurrentSession();
    if (session?.sub === params.id && role !== "ADMIN") {
      return NextResponse.json({ error: "You can't remove your own admin access." }, { status: 400 });
    }
    data.role = role;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const player = await prisma.user.update({ where: { id: params.id }, data });
  return NextResponse.json({ player: { id: player.id, name: player.name, email: player.email, role: player.role } });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const session = await getCurrentSession();
  if (session?.sub === params.id) {
    return NextResponse.json({ error: "You can't delete your own account while logged in as it." }, { status: 400 });
  }
  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
