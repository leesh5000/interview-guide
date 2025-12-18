import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageSquarePlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { RelatedCourse } from "@/types";
import MarkdownPreview from "@/components/MarkdownPreview";
import CollapsibleAnswer from "@/components/CollapsibleAnswer";
import ReviewCountBadge from "@/components/ReviewCountBadge";
import { ThemeToggle } from "@/components/ThemeToggle";
import CourseCard from "@/components/CourseCard";
import Footer from "@/components/Footer";
import { SEO_CONFIG, stripMarkdown, truncateText } from "@/lib/seo";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  const question = await prisma.interviewQuestion.findUnique({
    where: { id, isPublished: true },
    include: { category: true },
  });

  if (!question) {
    return {
      title: "질문을 찾을 수 없습니다",
    };
  }

  // Use AI summary as description, fallback to truncated answer
  const description = question.aiSummary
    || truncateText(stripMarkdown(question.answerContent || ""), 160)
    || `${question.category.name} 면접 질문: ${question.questionTitle}`;

  // Build keywords from tags and target roles
  const keywords = [
    ...question.tags,
    ...question.targetRoles,
    question.category.name,
    "면접 질문",
    "개발자 면접",
  ];

  return {
    title: question.questionTitle,
    description,
    keywords,
    alternates: {
      canonical: `${SEO_CONFIG.SITE_URL}/questions/${id}`,
    },
    openGraph: {
      type: "article",
      title: question.questionTitle,
      description,
      url: `${SEO_CONFIG.SITE_URL}/questions/${id}`,
      publishedTime: question.createdAt.toISOString(),
      modifiedTime: question.updatedAt.toISOString(),
      authors: [SEO_CONFIG.SITE_NAME],
      section: question.category.name,
      tags: question.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: question.questionTitle,
      description,
    },
  };
}

export default async function QuestionDetailPage({
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

  // 조회수 증가
  await prisma.interviewQuestion.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  });

  const relatedCourses = question.relatedCourses as unknown as RelatedCourse[];

  // 강의 클릭 수 조회
  const courseClicks = await prisma.courseClick.findMany({
    where: { questionId: id },
    select: { affiliateUrl: true, clickCount: true },
  });
  const clickCountMap: Record<string, number> = {};
  courseClicks.forEach((click) => {
    clickCountMap[click.affiliateUrl] = click.clickCount;
  });

  // 본문에서 제목이 중복되는 경우 제거 및 이모지 추가
  let questionBodyContent = question.questionBody;
  if (questionBodyContent) {
    const lines = questionBodyContent.split('\n');
    const firstLine = lines[0].replace(/^#+\s*/, '').trim(); // 마크다운 헤더 제거
    if (firstLine.includes(question.questionTitle) || question.questionTitle.includes(firstLine)) {
      questionBodyContent = lines.slice(1).join('\n').trim();
    }
    // 질문 의도, 평가 포인트에 이모지 추가
    questionBodyContent = questionBodyContent
      .replace(/^(\s*[-*]?\s*)(질문\s*의도\s*:)/gm, '$1🎯 $2')
      .replace(/^(\s*[-*]?\s*)(평가\s*포인트\s*:)/gm, '$1✅ $2');
  }

  // FAQPage JSON-LD for rich search results
  const plainAnswer = truncateText(stripMarkdown(question.answerContent || ""), 500);
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: question.questionTitle,
        acceptedAnswer: {
          "@type": "Answer",
          text: plainAnswer,
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 transition-colors">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
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
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Link */}
        <Link
          href="/questions"
          className="text-blue-600 dark:text-blue-400 hover:underline mb-6 inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          질문 목록으로
        </Link>

        {/* Category Title */}
        <div className="mb-4">
          <Link
            href={`/questions?category=${question.category.slug}`}
            className="text-2xl font-bold text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {question.category.name}
          </Link>
        </div>

        {/* Question Title */}
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4 leading-relaxed">
            {question.questionTitle}
          </h1>

          {/* Tags */}
          {question.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-4">
              {question.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300"
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Target Roles */}
          {question.targetRoles.length > 0 && (
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              <span className="font-medium">대상 독자:</span>{" "}
              {question.targetRoles.map((role, index) => (
                <span key={role}>
                  <Link
                    href={`/questions?category=${question.category.slug}&role=${encodeURIComponent(role)}`}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {role}
                  </Link>
                  {index < question.targetRoles.length - 1 && ", "}
                </span>
              ))}
            </div>
          )}

          {/* Action Bar: Suggestion Button + Review Count + View Count */}
          <div className="flex flex-wrap items-center gap-4">
            <Link href={`/questions/${id}/suggest`}>
              <Button variant="outline" size="sm" className="gap-2">
                <MessageSquarePlus className="h-4 w-4" />
                의견 제시
              </Button>
            </Link>
            <ReviewCountBadge count={question.reviewCount} />
            <span className="text-gray-500 text-sm">
              조회수 {question.viewCount + 1}
            </span>
          </div>
        </div>

        {/* Question Body (의도, 평가포인트) */}
        {questionBodyContent && (
          <div className="mb-8 bg-gray-50 dark:bg-[#141414] rounded-lg p-6 border border-gray-200 dark:border-[#1a1a1a]">
            <MarkdownPreview content={questionBodyContent} />
          </div>
        )}

        {/* Answer Content - Collapsible */}
        {question.answerContent && (
          <CollapsibleAnswer content={question.answerContent} />
        )}

        {/* Follow-up Questions */}
        {question.followUpQuestions && (
          <Card className="mb-6 border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/50">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-purple-700 dark:text-purple-300 mb-3">
                꼬리 질문
              </h3>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <MarkdownPreview content={question.followUpQuestions} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Summary */}
        {question.aiSummary && (
          <Card className="mb-6 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">AI 요약</h3>
              <p className="text-gray-700 dark:text-gray-300">{question.aiSummary}</p>
            </CardContent>
          </Card>
        )}

        {/* Related Courses */}
        {relatedCourses.length > 0 && (
          <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/50">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-green-700 dark:text-green-300 mb-3">
                이 주제를 더 공부하고 싶나요?
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                이 링크를 통해 구매하시면 제가 수익을 받을 수 있어요. 🤗
              </p>
              <div className="space-y-3">
                {relatedCourses.map((course, index) => (
                  <CourseCard
                    key={index}
                    course={course}
                    questionId={id}
                    initialClickCount={clickCountMap[course.affiliateUrl] || 0}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      </main>

      <Footer />
    </div>
  );
}
