import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import QuestionForm from "@/components/admin/QuestionForm";

export default async function EditQuestionPage({ params }: { params: { id: string } }) {
  const question = await prisma.question.findUnique({ where: { id: params.id } });
  if (!question) notFound();

  return (
    <div className="space-y-6">
      <div>
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
