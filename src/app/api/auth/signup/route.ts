import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { createSessionCookie } from "@/lib/session";
import { isValidEmail, isValidPassword, emailDomainAllowed, isAdminEmail } from "@/lib/validation";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = (body?.email || "").trim().toLowerCase();
  const name = (body?.name || "").trim();
  const password = body?.password || "";
  const remember = body?.remember !== false;

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid work email address." }, { status: 400 });
  }
  if (!emailDomainAllowed(email)) {
    return NextResponse.json(
      { error: `Signups are restricted to @${process.env.ALLOWED_EMAIL_DOMAIN} email addresses.` },
      { status: 400 }
    );
  }
  if (!name || name.length < 2) {
    return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  }
  if (!isValidPassword(password)) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  const { hash, salt } = hashPassword(password);
  const role = isAdminEmail(email) ? "ADMIN" : "PLAYER";

  const user = await prisma.user.create({
    data: { email, name, passwordHash: hash, passwordSalt: salt, role },
  });

  await createSessionCookie(user, remember);

  return NextResponse.json({ id: user.id, email: user.email, name: user.name, role: user.role });
}
