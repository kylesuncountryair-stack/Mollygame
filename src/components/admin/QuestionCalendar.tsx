"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { AdminQuestion } from "./QuestionsList";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

// Central-time YYYY-MM-DD key for a question's activeDate, so the cell a
// question lands in matches the day it actually goes live for players (not
// whatever timezone the admin's browser happens to be in).
function centralDateKey(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
}

export default function QuestionCalendar({ questions }: { questions: AdminQuestion[] }) {
  const today = new Date();
  const defaultMonth = useMemo(() => {
    // Land on whichever month has the most recent question, falling back to
    // the current month if there are no questions yet.
    if (questions.length === 0) return { year: today.getFullYear(), month: today.getMonth() + 1 };
    const latest = [...questions].sort((a, b) => b.activeDate.localeCompare(a.activeDate))[0];
    const d = new Date(latest.activeDate);
    const key = centralDateKey(latest.activeDate);
    const [y, m] = key.split("-").map(Number);
    return { year: y, month: m };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [year, setYear] = useState(defaultMonth.year);
  const [month, setMonth] = useState(defaultMonth.month); // 1-12

  const byDay = useMemo(() => {
    const map = new Map<string, AdminQuestion[]>();
    for (const q of questions) {
      const key = centralDateKey(q.activeDate);
      const list = map.get(key) ?? [];
      list.push(q);
      map.set(key, list);
    }
    return map;
  }, [questions]);

  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const startWeekday = firstOfMonth.getUTCDay(); // 0 = Sun

  const cells: { day: number | null; key: string | null }[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push({ day: null, key: null });
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, key: `${year}-${pad(month)}-${pad(d)}` });
  }
  while (cells.length % 7 !== 0) cells.push({ day: null, key: null });

  const monthLabel = firstOfMonth.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  const todayKey = today.toLocaleDateString("en-CA", { timeZone: "America/Chicago" });

  function shiftMonth(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    setMonth(m);
    setYear(y);
  }

  return (
    <div className="rounded-2xl border border-ash-900 bg-bg-card shadow-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-500/15 text-gold-300">
            <CalendarDays className="h-4 w-4" />
          </span>
          <h3 className="font-display text-lg font-semibold text-white">{monthLabel}</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => shiftMonth(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-ash-800 text-ash-300 hover:border-ember-500 hover:text-ember-200"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => shiftMonth(1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-ash-800 text-ash-300 hover:border-ember-500 hover:text-ember-200"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-medium text-ash-500">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} className="pb-1">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((cell, i) => {
          if (!cell.day || !cell.key) {
            return <div key={i} className="aspect-square rounded-lg" />;
          }
          const dayQuestions = byDay.get(cell.key) ?? [];
          const isToday = cell.key === todayKey;
          const hasQuestions = dayQuestions.length > 0;

          return (
            <div
              key={i}
              className={`flex aspect-square flex-col gap-1 overflow-hidden rounded-lg border p-1.5 ${
                isToday ? "border-ember-500 bg-ember-500/5" : "border-ash-900 bg-bg-panel/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-medium ${isToday ? "text-ember-300" : "text-ash-500"}`}>{cell.day}</span>
                {!hasQuestions && (
                  <Link
                    href={`/admin/questions?date=${cell.key}#question-form`}
                    className="flex h-4 w-4 items-center justify-center rounded text-ash-700 hover:bg-ember-500/15 hover:text-ember-300"
                    aria-label={`Add question on ${cell.key}`}
                  >
                    <Plus className="h-3 w-3" />
                  </Link>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1 overflow-hidden">
                {dayQuestions.map((q) => (
                  <Link
                    key={q.id}
                    href={`/admin/questions/${q.id}`}
                    title={q.prompt}
                    className={`truncate rounded px-1 py-0.5 text-[10px] font-medium leading-tight ${
                      q.type === "WEEKLY" ? "bg-gold-500/20 text-gold-300" : "bg-ember-500/20 text-ember-300"
                    } hover:opacity-80`}
                  >
                    {q.type === "WEEKLY" ? "Weekly" : "Daily"}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-4 text-[11px] text-ash-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-ember-500/40" /> Daily
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-gold-500/40" /> Weekly
        </span>
        <span className="flex items-center gap-1.5">
          <Plus className="h-3 w-3" /> Click an empty day to prefill the form
        </span>
      </div>
    </div>
  );
}
