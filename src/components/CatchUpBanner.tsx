"use client";

import { useState } from "react";
import { CalendarClock, Sparkles } from "lucide-react";
import QuestionCard, { type QuestionData } from "@/components/QuestionCard";
import SectionHeader from "@/components/SectionHeader";

// Sunday/Monday-only prompt (see isCatchUpWindowCT in src/lib/bonfire.ts)
// offering DAILY questions from last week that this player never answered.
// Collapsed by default so it doesn't shove the live questions down the
// page for anyone who doesn't need it — expanding it reveals the missed
// questions as normal QuestionCards, reusing the exact same answer flow
// (and the same "answered questions disappear after a moment" behavior)
// as everything else on the dashboard. The server-side answer route skips
// spark chains for these specifically, since sparks are meant to reward
// playing along together during the week, not catching up solo after.
export default function CatchUpBanner({ questions }: { questions: QuestionData[] }) {
  const [expanded, setExpanded] = useState(false);

  if (questions.length === 0) return null;

  return (
    <div className="rounded-2xl border border-navy-400/40 bg-bg-card shadow-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionHeader
          icon={CalendarClock}
          tone="navy"
          title="New questions have dropped today"
          subtitle={`Looks like you missed ${questions.length} question${
            questions.length === 1 ? "" : "s"
          } from last week — want to catch up? They still count toward your logs, just without spark chains (those are for playing along during the week).`}
        />
        {!expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-navy-300 px-4 py-2 text-sm font-semibold text-navy-900 hover:bg-navy-200"
          >
            <Sparkles className="h-4 w-4" /> Catch me up
          </button>
        )}
      </div>

      {expanded && (
        <div className="mt-5 space-y-4 border-t border-ash-900 pt-5">
          {questions.map((q) => (
            <QuestionCard key={q!.id} question={q} />
          ))}
        </div>
      )}
    </div>
  );
}
