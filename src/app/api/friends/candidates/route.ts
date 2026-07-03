import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [allUsers, follows] = await Promise.all([
    prisma.user.findMany({ select: { id: true, name: true, email: true } }),
    prisma.follow.findMany({ where: { followerId: session.sub }, select: { followingId: true } }),
  ]);

  const alreadyFollowing = new Set(follows.map((f) => f.followingId));
  const candidates = allUsers.filter((u) => u.id !== session.sub && !alreadyFollowing.has(u.id));

  return NextResponse.json({ candidates });
}
