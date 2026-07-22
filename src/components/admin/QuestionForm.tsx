"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";

export type QuestionFormValue = {
  id?: string;
  type: "DAILY" | "WEEKLY";
  format?: "MULTIPLE_CHOICE" | "TRUE_FALSE";
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation?: string | null;
  logsReward: number;
  activeDate: string; // yyyy-mm-dd
};

const TRUE_FALSE_OPTIONS = ["True", "False"];

// Central time, not UTC or the admin's own browser timezone — matches how
// the server interprets/stores this same date (see centralDateStringToUTC
// in src/lib/bonfire.ts).
function toDateInputValue(iso?: string) {
  const date = iso ? new Date(iso) : new Date();
  return date.toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
}

export default function QuestionForm({
  initial,
  onDone,
  initialActiveDate,
}: {
  initial?: Partial<QuestionFormValue> & { id?: string };
  onDone?: () => void;
  // Prefills the active-date field, e.g. when the admin clicked an empty day
  // on the question calendar. Ignored when editing an existing question.
  initialActiveDate?: string;
}) {
  const router = useRouter();
  const [type, setType] = useState<"DAILY" | "WEEKLY">(initial?.type ?? "DAILY");
  const [format, setFormat] = useState<"MULTIPLE_CHOICE" | "TRUE_FALSE">(initial?.format ?? "MULTIPLE_CHOICE");
  const [prompt, setPrompt] = useState(initial?.prompt ?? "");
  const [options, setOptions] = useState<string[]>(initial?.options?.length ? initial.options : ["", ""]);
  const [correctIndex, setCorrectIndex] = useState(initial?.correctIndex ?? 0);
  const [explanation, setExplanation] = useState(initial?.explanation ?? "");
  const [logsReward, setLogsReward] = useState(initial?.logsReward ?? 1);
  const [activeDate, setActiveDate] = useState(
    initial?.activeDate ? toDateInputValue(initial.activeDate) : initialActiveDate ?? toDateInputValue()
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isEdit = !!initial?.id;

  function updateOption(i: number, value: string) {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? value : o)));
  }

  function changeFormat(next: "MULTIPLE_CHOICE" | "TRUE_FALSE") {
    if (next === format) return;
    setFormat(next);
    setCorrectIndex(0);
    if (next === "TRUE_FALSE") {
      setOptions(TRUE_FALSE_OPTIONS);
    } else if (format === "TRUE_FALSE") {
      // Coming back from True/False — start with a couple of blank options
      // rather than leaving "True"/"False" behind as editable text.
      setOptions(["", ""]);
    }
  }

  function addOption() {
    if (options.length >= 6) return;
    setOptions((prev) => [...prev, ""]);
  }

  function removeOption(i: number) {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, idx) => idx !== i));
    if (correctIndex >= options.length - 1) setCorrectIndex(0);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = { type, format, prompt, options, correctIndex, explanation: explanation.trim() || null, logsReward, activeDate };
      const url = isEdit ? `/api/admin/questions/${initial!.id}` : "/api/admin/questions";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      if (!isEdit) {
        setPrompt("");
        setFormat("MULTIPLE_CHOICE");
        setOptions(["", ""]);
        setCorrectIndex(0);
        setExplanation("");
        setLogsReward(1);
      }
      router.refresh();
      onDone?.();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form id="question-form" onSubmit={submit} className="space-y-4 rounded-2xl border border-ash-900 bg-bg-card shadow-card p-6 scroll-mt-6">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-ash-400">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "DAILY" | "WEEKLY")}
            className="w-full rounded-lg border border-ash-800 bg-bg-panel px-3 py-2 text-sm text-ash-100"
          >
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ash-400">Format</label>
          <select
            value={format}
            onChange={(e) => changeFormat(e.target.value as "MULTIPLE_CHOICE" | "TRUE_FALSE")}
            className="w-full rounded-lg border border-ash-800 bg-bg-panel px-3 py-2 text-sm text-ash-100"
          >
            <option value="MULTIPLE_CHOICE">Multiple Choice</option>
            <option value="TRUE_FALSE">True / False</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ash-400">
            {type === "DAILY" ? "Active date" : "Active week (any day in that week)"}
          </label>
          <input
            type="date"
            value={activeDate}
            onChange={(e) => setActiveDate(e.target.value)}
            className="w-full rounded-lg border border-ash-800 bg-bg-panel px-3 py-2 text-sm text-ash-100"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-ash-400">Question prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          required
          rows={2}
          className="w-full rounded-lg border border-ash-800 bg-bg-panel px-3 py-2 text-sm text-ash-100"
        />
      </div>

      {format === "TRUE_FALSE" ? (
        <div>
          <label className="mb-1 block text-xs font-medium text-ash-400">Correct answer</label>
          <div className="flex gap-2">
            {TRUE_FALSE_OPTIONS.map((opt, i) => (
              <button
                key={opt}
                type="button"
                onClick={() => setCorrectIndex(i)}
                className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                  correctIndex === i
                    ? "border-ember-500 bg-ember-500/10 text-ash-100"
                    : "border-ash-800 bg-bg-panel text-ash-400 hover:border-ash-700"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <label className="mb-1 block text-xs font-medium text-ash-400">Answer options (select the correct one)</label>
          <div className="space-y-2">
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correctIndex"
                  checked={correctIndex === i}
                  onChange={() => setCorrectIndex(i)}
                  className="h-4 w-4 accent-ember-500"
                />
                <input
                  value={opt}
                  onChange={(e) => updateOption(i, e.target.value)}
                  required
                  placeholder={`Option ${i + 1}`}
                  className="flex-1 rounded-lg border border-ash-800 bg-bg-panel px-3 py-2 text-sm text-ash-100"
                />
                {options.length > 2 && (
                  <button type="button" onClick={() => removeOption(i)} className="text-ash-500 hover:text-rose-400">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {options.length < 6 && (
            <button
              type="button"
              onClick={addOption}
              className="mt-2 flex items-center gap-1 text-xs font-medium text-ember-300 hover:text-ember-200"
            >
              <Plus className="h-3.5 w-3.5" /> Add option
            </button>
          )}
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium text-ash-400">
          Explanation <span className="font-normal text-ash-500">(optional — shown to players who answer wrong)</span>
        </label>
        <textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          rows={2}
          placeholder="e.g. Sun Country's headquarters is in Minneapolis, not Eagan."
          className="w-full rounded-lg border border-ash-800 bg-bg-panel px-3 py-2 text-sm text-ash-100"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-ash-400">Logs awarded for a correct answer</label>
        <input
          type="number"
          min={0}
          value={logsReward}
          onChange={(e) => setLogsReward(Number(e.target.value))}
          className="w-32 rounded-lg border border-ash-800 bg-bg-panel px-3 py-2 text-sm text-ash-100"
        />
      </div>

      {error && <p className="text-sm text-rose-400">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-ember-500 hover:bg-ember-600 px-5 py-2 font-semibold text-white shadow-glow transition-colors disabled:opacity-50"
      >
        {loading ? "Saving..." : isEdit ? "Save Changes" : "Create Question"}
      </button>
    </form>
  );
}
