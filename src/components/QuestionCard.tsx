"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, CalendarRange, Check, Flame, X } from "lucide-react";
import Badge from "./Badge";

type Answered = { selectedIndex: number; isCorrect: boolean; logsAwarded: number } | null;

export type QuestionData = {
  id: string;
  type: "DAILY" | "WEEKLY";
  prompt: string;
  options: string[];
  logsReward: number;
  answered: Answered;
} | null;

export default function QuestionCard({ question }: { question: QuestionData }) {
  const router = useRouter();
  const [selected, setSelected] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Answered>(question?.answered ?? null);
  const [error, setError] = useState("");

  if (!question) {
    return (
      <div className="rounded-2xl border border-dashed border-ash-700 bg-bg-card/50 p-6 text-center text-ash-500">
        No question is live right now &mdash; check back soon.
      </div>
    );
  }

  const isWeekly = question.type === "WEEKLY";

  async function submit() {
    if (selected === null) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/questions/${question!.id}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedIndex: selected }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      setResult({ selectedIndex: selected, isCorrect: data.isCorrect, logsAwarded: data.logsAwarded });
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="animate-rise rounded-2xl border border-ash-900 bg-bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <Badge tone={isWeekly ? "ember" : "neutral"}>
          {isWeekly ? <CalendarRange className="h-3 w-3" /> : <CalendarDays className="h-3 w-3" />}
          {isWeekly ? "Weekly Question" : "Daily Question"}
        </Badge>
        <span className="flex items-center gap-1 text-sm text-ember-300">
          <Flame className="h-4 w-4" /> +{question.logsReward} logs
        </span>
      </div>

      <p className="mb-5 font-display text-lg font-semibold text-ash-100">{question.prompt}</p>

      <div className="space-y-2">
        {question.options.map((opt, i) => {
          const isSelected = (result ? result.selectedIndex : selected) === i;
          const showCorrectness = !!result;
          const isCorrectOption = i === result?.selectedIndex && result?.isCorrect;
          const isWrongOption = i === result?.selectedIndex && result && !result.isCorrect;

          return (
            <button
              key={i}
              disabled={!!result || submitting}
              onClick={() => setSelected(i)}
              className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                isSelected
                  ? "border-ember-500 bg-ember-500/10 text-ash-100"
                  : "border-ash-800 bg-bg-panel text-ash-300 hover:border-ash-700"
              } ${result ? "cursor-default" : "cursor-pointer"}`}
            >
              <span>{opt}</span>
              {showCorrectness && isCorrectOption && <Check className="h-4 w-4 text-emerald-400" />}
              {showCorrectness && isWrongOption && <X className="h-4 w-4 text-rose-400" />}
            </button>
          );
        })}
      </div>

      {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}

      {!result ? (
        <button
          onClick={submit}
          disabled={selected === null || submitting}
          className="mt-5 w-full rounded-xl bg-gradient-to-r from-ember-500 to-ember-600 py-2.5 font-semibold text-white shadow-glow transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? "Submitting..." : "Submit Answer"}
        </button>
      ) : (
        <div
          className={`mt-5 rounded-xl px-4 py-3 text-center font-medium ${
            result.isCorrect ? "bg-emerald-500/10 text-emerald-300" : "bg-rose-500/10 text-rose-300"
          }`}
        >
          {result.isCorrect ? `Correct! +${result.logsAwarded} logs added to your bonfire.` : "Not quite — better luck on the next one."}
        </div>
      )}
    </div>
  );
}
