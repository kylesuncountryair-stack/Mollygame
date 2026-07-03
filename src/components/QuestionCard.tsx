"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, CalendarRange, Check, Flame, HelpCircle, X } from "lucide-react";
import Badge from "./Badge";
import Confetti from "./Confetti";
import TierUpBanner from "./TierUpBanner";

type Answered = { selectedIndex: number; isCorrect: boolean; logsAwarded: number } | null;
type TierUp = { label: string } | null;

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
  // Only true right after a fresh submission in this session — keeps the
  // confetti/tier-up celebration from replaying every time the page loads
  // and finds a question that was already answered earlier.
  const [justAnswered, setJustAnswered] = useState(false);
  const [tierUp, setTierUp] = useState<TierUp>(null);
  // The correct/incorrect banner only shows right after a fresh submission
  // in this session, and fades out on its own after 30 seconds. It starts
  // hidden (not visible) on mount — including when the server tells us this
  // question was already answered earlier — so it doesn't pop back up every
  // time the page is refreshed, you log back in, or you revisit the
  // dashboard tab. Once it's gone, it stays gone; the checkmark/x on the
  // selected option is enough of a reminder after that.
  const [bannerVisible, setBannerVisible] = useState(false);

  useEffect(() => {
    if (!justAnswered || !result) return;
    setBannerVisible(true);
    const timer = setTimeout(() => setBannerVisible(false), 30000);
    return () => clearTimeout(timer);
  }, [justAnswered, result]);

  if (!question) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-ash-700 bg-bg-card/50 p-6 text-center text-ash-500">
        <HelpCircle className="h-6 w-6 text-ash-600" />
        <p>No question is live right now &mdash; check back soon.</p>
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
      setJustAnswered(true);
      if (data.tierUp) setTierUp({ label: data.tierUp.label });
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="animate-rise rounded-2xl border border-ash-900 bg-bg-card shadow-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <Badge tone={isWeekly ? "gold" : "ember"}>
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
          className="mt-5 w-full rounded-lg bg-ember-500 py-2.5 font-semibold text-white transition-colors hover:bg-ember-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? "Submitting..." : "Submit Answer"}
        </button>
      ) : result.isCorrect ? (
        <div
          className={`relative overflow-hidden rounded-xl bg-emerald-500/10 transition-all duration-500 ease-out ${
            bannerVisible ? "mt-5 max-h-40 px-4 py-5 opacity-100" : "mt-0 max-h-0 px-4 py-0 opacity-0"
          }`}
        >
          {justAnswered && bannerVisible && <Confetti />}
          <div className="relative flex flex-col items-center gap-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-bg-panel shadow-glow">
              <Check className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="text-center font-medium text-emerald-300">
              Correct! +{result.logsAwarded} logs added to your bonfire.
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`overflow-hidden rounded-xl bg-rose-500/10 text-center font-medium text-rose-300 transition-all duration-500 ease-out ${
            bannerVisible ? "mt-5 max-h-40 px-4 py-3 opacity-100" : "mt-0 max-h-0 px-4 py-0 opacity-0"
          }`}
        >
          Not quite — better luck on the next one.
        </div>
      )}

      {justAnswered && tierUp && <TierUpBanner tier={tierUp} onClose={() => setTierUp(null)} />}
    </div>
  );
}
