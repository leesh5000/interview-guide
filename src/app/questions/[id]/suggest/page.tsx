import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageSquarePlus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import SuggestionForm from "@/components/SuggestionForm";
import { ThemeToggle } from "@/components/ThemeToggle";
import Footer from "@/components/Footer";

export default async function SuggestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const question = await prisma.interviewQuestion.findUnique({
    where: { id, isPublished: true },
    include: { category: true },
  });

  if (!question) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 transition-colors">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-[#1a1a1a] bg-white dark:bg-[#111111]">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
            DevInterview
          </Link>
          <nav className="flex gap-4 items-center">
            <Link href="/questions" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
              질문 목록
            </Link>
            <Link href="/news" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
              개발 소식
            </Link>
            <Link href="/courses" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
              강의
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Link */}
        <Link
          href={`/questions/${id}`}
          className="text-blue-600 dark:text-blue-400 hover:underline mb-6 inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          원본 질문으로 돌아가기
        </Link>

        {/* Title */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquarePlus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              의견 제시
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            콘텐츠 개선에 참여해주세요! 수정 제안은 검토 후 반영됩니다.
          </p>
        </div>

        {/* Info Card */}
        <Card className="mb-6 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
          <CardContent className="py-4">
            <h3 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">
              수정 제안 안내
            </h3>
            <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <li>• 질문 본문과 답변 내용을 수정할 수 있습니다.</li>
              <li>• 수정 사유를 반드시 작성해주세요.</li>
              <li>• 제출된 제안은 관리자 검토 후 반영됩니다.</li>
              <li>• 승인된 수정은 검수 횟수에 반영됩니다.</li>
            </ul>
          </CardContent>
        </Card>

        {/* Suggestion Form */}
        <SuggestionForm
          questionId={id}
          originalData={{
            questionTitle: question.questionTitle,
            questionBody: question.questionBody,
            answerContent: question.answerContent,
          }}
        />
      </main>

      <Footer />
    </div>
  );
}
