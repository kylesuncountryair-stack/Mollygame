"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Flame, HelpCircle, Pencil, Trash2 } from "lucide-react";
import Badge from "@/components/Badge";

export type AdminQuestion = {
  id: string;
  type: "DAILY" | "WEEKLY";
  format: "MULTIPLE_CHOICE" | "TRUE_FALSE";
  prompt: string;
  options: string[];
  correctIndex: number;
  logsReward: number;
  activeDate: string;
};

export default function QuestionsList({ questions }: { questions: AdminQuestion[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function remove(id: string) {
    if (!confirm("Delete this question and all associated answers?")) return;
    setDeletingId(id);
    try {
      await fetch(`/api/admin/questions/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-ash-700 p-8 text-center text-ash-500">
        <HelpCircle className="h-6 w-6 text-ash-600" />
        <p>No questions yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {questions.map((q) => (
        <div
          key={q.id}
          className="flex items-start justify-between gap-4 rounded-2xl border border-ash-900 bg-bg-card p-5 shadow-card transition-shadow hover:shadow-card-hover"
        >
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <Badge tone={q.type === "WEEKLY" ? "ember" : "neutral"}>{q.type}</Badge>
              {q.format === "TRUE_FALSE" && <Badge tone="gold">True/False</Badge>}
              <span className="text-xs text-ash-500">
                {new Date(q.activeDate).toLocaleDateString(undefined, { timeZone: "America/Chicago" })}
              </span>
              <span className="flex items-center gap-1 text-xs text-ember-300">
                <Flame className="h-3 w-3" /> +{q.logsReward}
              </span>
            </div>
            <p className="font-medium text-ash-100">{q.prompt}</p>
            <ul className="mt-2 space-y-1 text-sm text-ash-500">
              {q.options.map((o, i) => (
                <li key={i} className={i === q.correctIndex ? "font-medium text-emerald-400" : ""}>
                  {i === q.correctIndex ? "✓ " : "— "}
                  {o}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-2">
            <Link
              href={`/admin/questions/${q.id}`}
              className="flex items-center gap-1 rounded-lg border border-ash-700 px-3 py-1.5 text-xs text-ash-200 hover:border-ember-500 hover:text-ember-200"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Link>
            <button
              onClick={() => remove(q.id)}
              disabled={deletingId === q.id}
              className="flex items-center gap-1 rounded-lg border border-ash-700 px-3 py-1.5 text-xs text-ash-200 hover:border-rose-500 hover:text-rose-300"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
