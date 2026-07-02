import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const questions = await prisma.question.findMany({ orderBy: { activeDate: "desc" } });
  return NextResponse.json({ questions });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const { type, prompt, options, correctIndex, logsReward, activeDate } = body || {};

  if (!type || !["DAILY", "WEEKLY"].includes(type)) {
    return NextResponse.json({ error: "type must be DAILY or WEEKLY." }, { status: 400 });
  }
  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json({ error: "prompt is required." }, { status: 400 });
  }
  if (!Array.isArray(options) || options.length < 2 || options.some((o) => typeof o !== "string" || !o.trim())) {
    return NextResponse.json({ error: "options must be at least 2 non-empty strings." }, { status: 400 });
  }
  if (typeof correctIndex !== "number" || correctIndex < 0 || correctIndex >= options.length) {
    return NextResponse.json({ error: "correctIndex must point to a valid option." }, { status: 400 });
  }
  if (typeof logsReward !== "number" || logsReward < 0) {
    return NextResponse.json({ error: "logsReward must be a non-negative number." }, { status: 400 });
  }
  if (!activeDate) {
    return NextResponse.json({ error: "activeDate is required." }, { status: 400 });
  }

  const question = await prisma.question.create({
    data: {
      type,
      prompt,
      options,
      correctIndex,
      logsReward,
      activeDate: new Date(activeDate),
    },
  });

  return NextResponse.json({ question });
}
