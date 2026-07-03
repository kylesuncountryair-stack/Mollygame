import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession, createSessionCookie } from "@/lib/session";

export async function PATCH(req: Request) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const name = (body?.name || "").trim();

  if (name.length < 2) {
    return NextResponse.json({ error: "Name must be at least 2 characters." }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: session.sub },
    data: { name },
  });

  // The session token caches name/role from login time, so refresh it now —
  // otherwise the new name wouldn't show up in the nav bar or "Welcome
  // back" greeting until the next time they log in.
  await createSessionCookie(user);

  return NextResponse.json({ id: user.id, name: user.name });
}
