import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const amount = body?.amount;
  const reason = (body?.reason || "").trim();

  if (typeof amount !== "number" || amount === 0 || !Number.isFinite(amount)) {
    return NextResponse.json({ error: "amount must be a non-zero number." }, { status: 400 });
  }
  if (!reason) {
    return NextResponse.json({ error: "A reason is required." }, { status: 400 });
  }

  const transaction = await prisma.logTransaction.create({
    data: {
      userId: params.id,
      amount,
      reason,
      type: amount > 0 ? "ADMIN_GRANT" : "ADMIN_ADJUST",
      issuedById: session.sub,
    },
  });

  return NextResponse.json({ transaction });
}
