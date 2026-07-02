import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/session";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ user: null });
  return NextResponse.json({
    user: { id: session.sub, email: session.email, name: session.name, role: session.role },
  });
}
