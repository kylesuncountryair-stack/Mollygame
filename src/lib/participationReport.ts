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

type Column = { label: string; names: string[] };

// Writes one column per week/day, with the column header in row 1 and
// participant names stacked vertically underneath it — matching what was
// asked for over a matrix/checkbox layout. Columns of different lengths
// just leave the shorter ones blank below their last name.
function writeParticipationSheet(sheet: ExcelJS.Worksheet, columns: Column[]) {
  if (columns.length === 0) {
    sheet.getRow(1).getCell(1).value = "No data for this month.";
    return;
  }
  columns.forEach((col, i) => {
    const cell = sheet.getRow(1).getCell(i + 1);
    cell.value = col.label;
    cell.font = { bold: true };
    sheet.getColumn(i + 1).width = 24;
  });
  const maxRows = Math.max(0, ...columns.map((c) => c.names.length));
  for (let r = 0; r < maxRows; r++) {
    columns.forEach((col, i) => {
      const name = col.names[r];
      if (name) sheet.getRow(r + 2).getCell(i + 1).value = name;
    });
  }
}

// Builds the admin "Participation Report" workbook for the current
// (Central-time) calendar month — a Weekly tab and a Daily tab, each with
// one column per week/day and the participating players' names stacked
// underneath. Only PLAYER-role accounts are counted, same scoping as the
// leaderboard and the existing players CSV export.
//
// Weekly tab: a player counts as having participated in a Mon-Sun week if
// they answered ANYTHING at all (any question type) at any point during
// that week, based on when they actually answered.
//
// Daily tab: a player counts as having participated in a given day's DAILY
// question round if they answered one of that round's questions, credited
// back to the round's *scheduled* activeDate rather than the day they
// actually answered — so someone answering Monday's carried-forward
// question on Tuesday still shows up under Monday, matching how the
// dashboard's own carry-forward logic already treats that answer.
export async function buildParticipationReport(
  monthsAgo = 0
): Promise<{ buffer: Uint8Array; monthStamp: string; monthLabel: string }> {
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
    select: { answeredAt: true, user: { select: { id: true, name: true } } },
  });

  const weeklyColumns: Column[] = weeks.map((w) => {
    const participants = new Map<string, string>();
    for (const a of weeklyAnswers) {
      if (a.answeredAt >= w.start && a.answeredAt < w.end) participants.set(a.user.id, a.user.name);
    }
    return {
      label: weekLabel(w.start, w.end),
      names: Array.from(participants.values()).sort((a, b) => a.localeCompare(b)),
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
        select: { questionId: true, user: { select: { id: true, name: true } } },
      })
    : [];

  const questionRoundKey = new Map(dailyQuestions.map((q) => [q.id, q.activeDate.getTime()]));

  const dailyColumns: Column[] = roundDates.map((d) => {
    const participants = new Map<string, string>();
    for (const a of dailyAnswers) {
      if (questionRoundKey.get(a.questionId) === d.getTime()) participants.set(a.user.id, a.user.name);
    }
    return {
      label: dayLabel(d),
      names: Array.from(participants.values()).sort((a, b) => a.localeCompare(b)),
    };
  });

  const workbook = new ExcelJS.Workbook();
  writeParticipationSheet(workbook.addWorksheet("Weekly"), weeklyColumns);
  writeParticipationSheet(workbook.addWorksheet("Daily"), dailyColumns);

  // Wrapped in a fresh Uint8Array (rather than returned as a Node Buffer)
  // so its type lines up cleanly with NextResponse's BodyInit — passing a
  // Buffer directly trips up TypeScript's DOM-lib BufferSource checking in
  // this project's tsconfig (Buffer<ArrayBufferLike> vs the stricter
  // ArrayBuffer the DOM types expect).
  const buffer = new Uint8Array(await workbook.xlsx.writeBuffer());
  const monthStamp = monthStart.toLocaleDateString("en-CA", { timeZone: "America/Chicago" }).slice(0, 7); // YYYY-MM

  return { buffer, monthStamp, monthLabel: label };
}
