import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";
import { AVATAR_COLOR_PALETTE, AVATAR_ICON_OPTIONS } from "@/components/Avatar";

const VALID_COLORS = new Set(Object.keys(AVATAR_COLOR_PALETTE));
const VALID_ICONS = new Set(["letter", "initials", ...AVATAR_ICON_OPTIONS.map((o) => o.key)]);

export async function PATCH(req: Request) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const avatarColor = body?.avatarColor;
  const avatarIcon = body?.avatarIcon;

  if (!VALID_COLORS.has(avatarColor)) {
    return NextResponse.json({ error: "Invalid avatar color." }, { status: 400 });
  }
  if (!VALID_ICONS.has(avatarIcon)) {
    return NextResponse.json({ error: "Invalid avatar style." }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: session.sub },
    data: { avatarColor, avatarIcon },
  });

  return NextResponse.json({ avatarColor: user.avatarColor, avatarIcon: user.avatarIcon });
}
