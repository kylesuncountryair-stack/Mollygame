import { NextResponse, type NextRequest } from "next/server";
import { verifyToken } from "@/lib/token";

// Duplicated here (rather than imported from "@/lib/session") because that
// module pulls in next/headers + next/navigation, which are meant for the
// Node.js server-component/route-handler context, not Edge middleware.
const SESSION_COOKIE = "bonfire_session";

const PUBLIC_PATHS = ["/", "/api/auth/signup", "/api/auth/login"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const secret = process.env.AUTH_SECRET || "";
  const session = token && secret ? await verifyToken(token, secret) : null;

  const isProtectedPage =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/leaderboard") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/history") ||
    pathname.startsWith("/admin");
  const isProtectedApi = pathname.startsWith("/api/") && !PUBLIC_PATHS.includes(pathname);

  // Middleware only confirms "is this a logged-in user at all" using the
  // JWT — it does NOT gate on the JWT's role claim. The role claim is a
  // stale snapshot from login time, so if middleware also rejected based
  // on it, someone freshly promoted to admin would still get bounced here
  // before ever reaching the Node.js layer that checks their real,
  // current role from the database (see requireAdmin/requireAdminApi in
  // src/lib/session.ts, used by the admin layout and every /api/admin/*
  // route). Those do the actual admin authorization; this just requires
  // *a* valid login.
  if (isProtectedPage || isProtectedApi) {
    if (!session) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
