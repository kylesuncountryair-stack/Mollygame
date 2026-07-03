import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/session";
import { centralDateStringToUTC } from "@/lib/bonfire";

type BulkRow = {
  type?: string;
  prompt?: string;
  options?: string[];
  correctIndex?: number;
  logsReward?: number;
  activeDate?: string;
};

type RowResult = { row: number; ok: boolean; error?: string; prompt?: string };

export async function POST(req: Request) {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const rows: BulkRow[] = Array.isArray(body?.rows) ? body.rows : [];

  if (rows.length === 0) {
    return NextResponse.json({ error: "No rows to import." }, { status: 400 });
  }
  if (rows.length > 500) {
    return NextResponse.json({ error: "Import is limited to 500 rows at a time." }, { status: 400 });
  }

  const results: RowResult[] = [];

  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 2; // account for the header row so numbers match the spreadsheet
    const r = rows[i];
    const type = (r.type || "").toUpperCase().trim();
    const prompt = (r.prompt || "").trim();
    const options = Array.isArray(r.options) ? r.options.map((o) => (o ?? "").trim()).filter(Boolean) : [];
    const correctIndex = Number(r.correctIndex);
    const logsReward = Number(r.logsReward);
    const activeDate = (r.activeDate || "").trim();

    if (!["DAILY", "WEEKLY"].includes(type)) {
      results.push({ row: rowNum, ok: false, error: "type must be DAILY or WEEKLY", prompt });
      continue;
    }
    if (!prompt) {
      results.push({ row: rowNum, ok: false, error: "prompt is required", prompt });
      continue;
    }
    if (options.length < 2) {
      results.push({ row: rowNum, ok: false, error: "at least 2 options are required (separate with ;)", prompt });
      continue;
    }
    if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= options.length) {
      results.push({ row: rowNum, ok: false, error: "correctIndex must be a valid 0-based index into options", prompt });
      continue;
    }
    if (!Number.isFinite(logsReward) || logsReward < 0) {
      results.push({ row: rowNum, ok: false, error: "logsReward must be a non-negative number", prompt });
      continue;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(activeDate)) {
      results.push({ row: rowNum, ok: false, error: "activeDate must be formatted YYYY-MM-DD", prompt });
      continue;
    }

    try {
      await prisma.question.create({
        data: {
          type: type as "DAILY" | "WEEKLY",
          prompt,
          options,
          correctIndex,
          logsReward,
          activeDate: centralDateStringToUTC(activeDate),
        },
      });
      results.push({ row: rowNum, ok: true, prompt });
    } catch (e) {
      results.push({ row: rowNum, ok: false, error: "Failed to save this row.", prompt });
    }
  }

  const created = results.filter((r) => r.ok).length;
  return NextResponse.json({ created, failed: results.length - created, results });
}
