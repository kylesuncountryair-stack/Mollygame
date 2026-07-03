import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import QuestionForm from "@/components/admin/QuestionForm";

export default async function EditQuestionPage({ params }: { params: { id: string } }) {
  const question = await prisma.question.findUnique({ where: { id: params.id } });
  if (!question) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/questions"
          className="mb-2 inline-flex items-center gap-1 text-sm text-ash-500 hover:text-ember-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Questions
        </Link>
        <h1 className="font-display text-2xl font-bold text-ash-100">Edit Question</h1>
        <p className="text-ash-500">Update the prompt, options, reward, or active date.</p>
      </div>
      <QuestionForm
        initial={{
          id: question.id,
          type: question.type,
          prompt: question.prompt,
          options: question.options as string[],
          correctIndex: question.correctIndex,
          logsReward: question.logsReward,
          activeDate: question.activeDate.toISOString(),
        }}
      />
    </div>
  );
}
