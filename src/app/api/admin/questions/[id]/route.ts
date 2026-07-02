import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/session";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => null);
  const { type, prompt, options, correctIndex, logsReward, activeDate } = body || {};

  const data: Record<string, unknown> = {};
  if (type) data.type = type;
  if (prompt) data.prompt = prompt;
  if (Array.isArray(options)) data.options = options;
  if (typeof correctIndex === "number") data.correctIndex = correctIndex;
  if (typeof logsReward === "number") data.logsReward = logsReward;
  if (activeDate) data.activeDate = new Date(activeDate);

  const question = await prisma.question.update({ where: { id: params.id }, data });
  return NextResponse.json({ question });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.question.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
