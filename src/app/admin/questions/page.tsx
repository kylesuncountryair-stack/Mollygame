import { prisma } from "@/lib/prisma";
import QuestionForm from "@/components/admin/QuestionForm";
import QuestionsList, { type AdminQuestion } from "@/components/admin/QuestionsList";
import SectionHeader from "@/components/SectionHeader";
import { HelpCircle } from "lucide-react";

export default async function AdminQuestionsPage() {
  const questions = await prisma.question.findMany({ orderBy: { activeDate: "desc" } });

  const rows: AdminQuestion[] = questions.map((q) => ({
    id: q.id,
    type: q.type,
    prompt: q.prompt,
    options: q.options as string[],
    correctIndex: q.correctIndex,
    logsReward: q.logsReward,
    activeDate: q.activeDate.toISOString(),
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-ash-100">Questions</h1>
        <p className="text-ash-500">Create daily and weekly questions and set how many logs they're worth.</p>
      </div>

      <QuestionForm />

      <div>
        <SectionHeader icon={HelpCircle} tone="gold" title="All Questions" className="mb-4" />
        <QuestionsList questions={rows} />
      </div>
    </div>
  );
}
