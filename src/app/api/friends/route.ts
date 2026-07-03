import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";
import { getLeaderboardRows } from "@/lib/leaderboard";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [follows, allRows] = await Promise.all([
    prisma.follow.findMany({ where: { followerId: session.sub }, select: { followingId: true } }),
    getLeaderboardRows(),
  ]);

  const followingIds = new Set(follows.map((f) => f.followingId));
  const rowsById = new Map(allRows.map((r) => [r.id, r]));

  const friends = [...followingIds]
    .map((id) => rowsById.get(id))
    .filter((r): r is NonNullable<typeof r> => !!r);

  return NextResponse.json({ friends });
}

export async function POST(req: Request) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const followingId = body?.followingId;
  if (!followingId || typeof followingId !== "string") {
    return NextResponse.json({ error: "followingId is required." }, { status: 400 });
  }
  if (followingId === session.sub) {
    return NextResponse.json({ error: "You can't add yourself." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: followingId } });
  if (!target) return NextResponse.json({ error: "That player doesn't exist." }, { status: 404 });

  try {
    await prisma.follow.create({ data: { followerId: session.sub, followingId } });
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code !== "P2002") throw e; // ignore "already following" duplicate, otherwise rethrow
  }

  return NextResponse.json({ ok: true });
}
