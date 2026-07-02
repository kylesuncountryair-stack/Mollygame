import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

function generateTempPassword(): string {
  // 10 random alphanumeric characters, easy to read aloud/type, no ambiguous look-alikes.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(10);
  let out = "";
  for (let i = 0; i < bytes.length; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const player = await prisma.user.findUnique({ where: { id: params.id } });
  if (!player) return NextResponse.json({ error: "Player not found." }, { status: 404 });

  const tempPassword = generateTempPassword();
  const { hash, salt } = hashPassword(tempPassword);

  await prisma.user.update({
    where: { id: params.id },
    data: { passwordHash: hash, passwordSalt: salt },
  });

  return NextResponse.json({ tempPassword });
}
