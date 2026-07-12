import { prisma } from "@/lib/prisma";
import QuestionForm from "@/components/admin/QuestionForm";
import QuestionsList, { type AdminQuestion } from "@/components/admin/QuestionsList";
import QuestionCalendar from "@/components/admin/QuestionCalendar";
import BulkImportQuestions from "@/components/admin/BulkImportQuestions";
import SectionHeader from "@/components/SectionHeader";
import { CalendarDays, HelpCircle, Upload } from "lucide-react";

export default async function AdminQuestionsPage({
  searchParams,
}: {
  searchParams: { date?: string };
}) {
  const questions = await prisma.question.findMany({ orderBy: { activeDate: "desc" } });

  const rows: AdminQuestion[] = questions.map((q) => ({
    id: q.id,
    type: q.type,
    format: q.format,
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

      <QuestionForm initialActiveDate={searchParams?.date} />

      <div>
        <SectionHeader icon={Upload} tone="navy" title="Bulk Import" className="mb-4" />
        <BulkImportQuestions />
      </div>

      <div>
        <SectionHeader icon={CalendarDays} tone="gold" title="Question Calendar" className="mb-4" />
        <QuestionCalendar questions={rows} />
      </div>

      <div>
        <SectionHeader icon={HelpCircle} tone="gold" title="All Questions" className="mb-4" />
        <QuestionsList questions={rows} />
      </div>
    </div>
  );
}
