import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";
import { hashPassword, verifyPassword } from "@/lib/password";
import { isValidPassword } from "@/lib/validation";

export async function POST(req: Request) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const currentPassword = body?.currentPassword || "";
  const newPassword = body?.newPassword || "";

  const user = await prisma.user.findUnique({ where: { id: session.sub } });
  if (!user || !verifyPassword(currentPassword, user.passwordSalt, user.passwordHash)) {
    return NextResponse.json({ error: "Your current password is incorrect." }, { status: 401 });
  }

  if (!isValidPassword(newPassword)) {
    return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
  }

  const { hash, salt } = hashPassword(newPassword);
  await prisma.user.update({
    where: { id: session.sub },
    data: { passwordHash: hash, passwordSalt: salt },
  });

  return NextResponse.json({ ok: true });
}
