import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/session";
import { buildParticipationReport } from "@/lib/participationReport";

// exceljs needs Node APIs (Buffer, etc.), so this route can't run on the
// Edge runtime.
export const runtime = "nodejs";

export async function GET() {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { buffer, monthStamp } = await buildParticipationReport();

  // Wrapped in a Blob rather than passed as a raw Uint8Array/Buffer —
  // TypeScript's DOM-lib BodyInit type is overly strict about the
  // ArrayBuffer generic on typed arrays in this project's TS version, but
  // Blob sidesteps that entirely and is accepted cleanly.
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  return new NextResponse(blob, {
    headers: {
      "Content-Disposition": `attachment; filename="bonfire-participation-${monthStamp}.xlsx"`,
    },
  });
}
