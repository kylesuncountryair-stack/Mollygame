import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/session";
import { buildParticipationReport } from "@/lib/participationReport";

// exceljs needs Node APIs (Buffer, etc.), so this route can't run on the
// Edge runtime.
export const runtime = "nodejs";

export async function GET() {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { buffer, monthStamp } = await buildParticipationReport();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="bonfire-participation-${monthStamp}.xlsx"`,
    },
  });
}
