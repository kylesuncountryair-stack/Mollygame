import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { signToken, verifyToken, type SessionPayload } from "./token";
import { prisma } from "./prisma";

export const SESSION_COOKIE = "bonfire_session";
const REMEMBER_ME_SECONDS = 60 * 60 * 24 * 30; // 30 days, "remember me" checked
const DEFAULT_SECONDS = 60 * 60 * 24; // 1 day server-side cap when not remembered

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET environment variable is not set");
  return secret;
}

export async function createSessionCookie(
  user: { id: string; email: string; name: string; role: "PLAYER" | "ADMIN" },
  remember: boolean = true
) {
  const duration = remember ? REMEMBER_ME_SECONDS : DEFAULT_SECONDS;
  const payload: SessionPayload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + duration,
  };
  const token = await signToken(payload, getSecret());
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    // Omitting maxAge when "remember" is off makes this a session cookie,
    // so it's cleared automatically when the browser closes. The 1-day
    // exp embedded in the token above is a server-side backstop in case
    // the browser is left open longer than that.
    ...(remember ? { maxAge: duration } : {}),
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getCurrentSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token, getSecret());
}

export async function requireSession() {
  const session = await getCurrentSession();
  if (!session) redirect("/");
  return session;
}

// The JWT's "role" claim is fixed at login time and can be trusted for up to
// 30 days (see REMEMBER_ME_SECONDS above). If an admin changes someone's
// role afterward — via the admin portal's promote/demote button, or by
// hand in the database — that person's existing session token doesn't
// know about it. Re-checking against the database here means role changes
// take effect on their very next admin-gated request, not just after they
// happen to log out and back in.
export async function isCurrentlyAdmin(userId: string): Promise<boolean> {
  const fresh = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  return fresh?.role === "ADMIN";
}

export async function requireAdmin() {
  const session = await requireSession();
  // Deliberately ignore session.role here — it's only ever a stale snapshot
  // from login time. isCurrentlyAdmin() is the real source of truth.
  if (!(await isCurrentlyAdmin(session.sub))) redirect("/dashboard");
  // Return the confirmed-fresh role so anything reading session.role
  // downstream (e.g. the Navbar's "Admin" link) reflects reality too.
  return { ...session, role: "ADMIN" as const };
}

// Same idea, for use inside API route handlers, which need a 403 JSON
// response instead of a redirect.
export async function requireAdminApi(): Promise<SessionPayload | null> {
  const session = await getCurrentSession();
  if (!session) return null;
  if (!(await isCurrentlyAdmin(session.sub))) return null;
  return { ...session, role: "ADMIN" };
}
