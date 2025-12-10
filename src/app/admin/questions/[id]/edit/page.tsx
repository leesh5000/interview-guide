import { redirect, notFound } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import QuestionForm from "@/components/admin/QuestionForm";
import { RelatedCourse } from "@/types";

export default async function EditQuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    redirect("/admin/login");
  }

  const { id } = await params;

  const question = await prisma.interviewQuestion.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!question) {
    notFound();
  }

  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
  });

  const targetRoles = await prisma.targetRole.findMany({
    orderBy: { order: "asc" },
  });

  const initialData = {
    id: question.id,
    categoryId: question.categoryId,
    questionTitle: question.questionTitle,
    questionBody: question.questionBody,
    answerContent: question.answerContent,
    followUpQuestions: question.followUpQuestions,
    targetRoles: question.targetRoles,
    tags: question.tags,
    aiSummary: question.aiSummary,
    relatedCourses: question.relatedCourses as unknown as RelatedCourse[],
    isPublished: question.isPublished,
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-semibold text-foreground mb-8">게시물 수정</h1>
      <QuestionForm categories={categories} targetRoles={targetRoles} initialData={initialData} />
    </main>
  );
}
