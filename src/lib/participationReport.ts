import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { monthBoundsCT, startOfWeekCT, endOfWeekCT } from "@/lib/bonfire";

function weekLabel(start: Date, end: Date): string {
  const startStr = start.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/Chicago" });
  // end is exclusive (the following Monday), so step back a day to show the
  // week's actual last day.
  const lastDay = new Date(end.getTime() - 24 * 60 * 60 * 1000);
  const endStr = lastDay.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/Chicago" });
  return `${startStr}–${endStr}`;
}

function dayLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "America/Chicago" });
}

type ParticipantRow = { name: string; logs: number };
type Column = { label: string; rows: ParticipantRow[]; totalPlayers: number; totalLogs: number };

// Writes a 4-column block per week/day: Player, Logs Earned (stacked one
// row per participant), then Total Players / Total Logs — two single
// summary values placed alongside the first data row rather than repeated
// down the whole column, since they're one number per week/day, not a
// per-player list. Row 1 is the week/day label merged across the block;
// row 2 has the sub-column headers; data starts at row 3.
function writeParticipationSheet(sheet: ExcelJS.Worksheet, columns: Column[]) {
  if (columns.length === 0) {
    sheet.getRow(1).getCell(1).value = "No data for this month.";
    return;
  }

  const subHeaders = ["Player", "Logs Earned", "Total Players", "Total Logs"];
  const colWidths = [24, 13, 14, 12];

  columns.forEach((col, i) => {
    const base = i * 4 + 1;

    sheet.mergeCells(1, base, 1, base + 3);
    const labelCell = sheet.getRow(1).getCell(base);
    labelCell.value = col.label;
    labelCell.font = { bold: true };
    labelCell.alignment = { horizontal: "center" };

    subHeaders.forEach((h, j) => {
      const cell = sheet.getRow(2).getCell(base + j);
      cell.value = h;
      cell.font = { bold: true };
      sheet.getColumn(base + j).width = colWidths[j];
    });

    col.rows.forEach((row, r) => {
      sheet.getRow(r + 3).getCell(base).value = row.name;
      sheet.getRow(r + 3).getCell(base + 1).value = row.logs;
    });

    // Single summary values, placed once alongside the first data row.
    sheet.getRow(3).getCell(base + 2).value = col.totalPlayers;
    sheet.getRow(3).getCell(base + 3).value = col.totalLogs;
  });
}

// Builds the admin "Participation Report" workbook for the current
// (Central-time) calendar month — a Weekly tab and a Daily tab, each with
// one 4-column block per week/day: participant names, logs each of them
// earned, and a Total Players / Total Logs summary for that week/day.
// Only PLAYER-role accounts are counted, same scoping as the leaderboard
// and the existing players CSV export.
//
// Weekly tab: a player counts as having participated in a Mon-Sun week if
// they answered ANYTHING at all (any question type) at any point during
// that week, based on when they actually answered. Their "logs earned" for
// that week is the sum of logsAwarded across all of those answers.
//
// Daily tab: a player counts as having participated in a given day's DAILY
// question round if they answered one of that round's questions, credited
// back to the round's *scheduled* activeDate rather than the day they
// actually answered — so someone answering Monday's carried-forward
// question on Tuesday still shows up under Monday, matching how the
// dashboard's own carry-forward logic already treats that answer. Their
// "logs earned" is the sum of logsAwarded across that round's question(s).
export async function buildParticipationReport(
  monthsAgo = 0
): Promise<{ buffer: ArrayBuffer; monthStamp: string; monthLabel: string }> {
  const { start: monthStart, end: monthEnd, label } = monthBoundsCT(monthsAgo);

  // --- Weekly tab ---
  const weeks: { start: Date; end: Date }[] = [];
  let weekStart = startOfWeekCT(monthStart);
  while (weekStart < monthEnd) {
    weeks.push({ start: weekStart, end: endOfWeekCT(weekStart) });
    weekStart = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
  }

  const weeklyAnswers = await prisma.answer.findMany({
    where: {
      answeredAt: { gte: weeks[0]?.start ?? monthStart, lt: weeks[weeks.length - 1]?.end ?? monthEnd },
      user: { role: "PLAYER" },
    },
    select: { answeredAt: true, logsAwarded: true, user: { select: { id: true, name: true } } },
  });

  const weeklyColumns: Column[] = weeks.map((w) => {
    const participants = new Map<string, ParticipantRow>();
    for (const a of weeklyAnswers) {
      if (a.answeredAt >= w.start && a.answeredAt < w.end) {
        const existing = participants.get(a.user.id);
        if (existing) existing.logs += a.logsAwarded;
        else participants.set(a.user.id, { name: a.user.name, logs: a.logsAwarded });
      }
    }
    const rows = Array.from(participants.values()).sort((a, b) => a.name.localeCompare(b.name));
    return {
      label: weekLabel(w.start, w.end),
      rows,
      totalPlayers: rows.length,
      totalLogs: rows.reduce((sum, r) => sum + r.logs, 0),
    };
  });

  // --- Daily tab ---
  const dailyQuestions = await prisma.question.findMany({
    where: { type: "DAILY", activeDate: { gte: monthStart, lt: monthEnd } },
    select: { id: true, activeDate: true },
    orderBy: { activeDate: "asc" },
  });

  const roundDates = Array.from(new Set(dailyQuestions.map((q) => q.activeDate.getTime())))
    .sort((a, b) => a - b)
    .map((t) => new Date(t));

  const dailyAnswers = dailyQuestions.length
    ? await prisma.answer.findMany({
        where: { questionId: { in: dailyQuestions.map((q) => q.id) }, user: { role: "PLAYER" } },
        select: { questionId: true, logsAwarded: true, user: { select: { id: true, name: true } } },
      })
    : [];

  const questionRoundKey = new Map(dailyQuestions.map((q) => [q.id, q.activeDate.getTime()]));

  const dailyColumns: Column[] = roundDates.map((d) => {
    const participants = new Map<string, ParticipantRow>();
    for (const a of dailyAnswers) {
      if (questionRoundKey.get(a.questionId) === d.getTime()) {
        const existing = participants.get(a.user.id);
        if (existing) existing.logs += a.logsAwarded;
        else participants.set(a.user.id, { name: a.user.name, logs: a.logsAwarded });
      }
    }
    const rows = Array.from(participants.values()).sort((a, b) => a.name.localeCompare(b.name));
    return {
      label: dayLabel(d),
      rows,
      totalPlayers: rows.length,
      totalLogs: rows.reduce((sum, r) => sum + r.logs, 0),
    };
  });

  const workbook = new ExcelJS.Workbook();
  writeParticipationSheet(workbook.addWorksheet("Weekly"), weeklyColumns);
  writeParticipationSheet(workbook.addWorksheet("Daily"), dailyColumns);

  // Copied into a brand-new, plain ArrayBuffer (rather than returned as a
  // Node Buffer or a Uint8Array wrapping one) so its type is unambiguous.
  // Node's Buffer/Uint8Array are typed as Uint8Array<ArrayBufferLike>,
  // which this project's TypeScript/DOM-lib version refuses to accept as
  // BodyInit/BlobPart (it wants the plain, non-generic ArrayBuffer) — a
  // fresh ArrayBuffer sidesteps that generic entirely.
  const raw = await workbook.xlsx.writeBuffer();
  const buffer = new ArrayBuffer(raw.byteLength);
  new Uint8Array(buffer).set(raw as unknown as ArrayLike<number>);
  const monthStamp = monthStart.toLocaleDateString("en-CA", { timeZone: "America/Chicago" }).slice(0, 7); // YYYY-MM

  return { buffer, monthStamp, monthLabel: label };
}
