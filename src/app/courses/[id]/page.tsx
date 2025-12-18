import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  ExternalLink,
  MessageCircleQuestion,
  Newspaper,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { ThemeToggle } from "@/components/ThemeToggle";
import Footer from "@/components/Footer";
import { SEO_CONFIG, truncateText } from "@/lib/seo";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  const course = await prisma.course.findUnique({
    where: { id },
  });

  if (!course) {
    return { title: "강의를 찾을 수 없습니다" };
  }

  const description = course.description
    ? truncateText(course.description, 160)
    : `${course.title} 강의 정보와 관련 면접 질문을 확인하세요.`;

  return {
    title: course.title,
    description,
    alternates: {
      canonical: `${SEO_CONFIG.SITE_URL}/courses/${id}`,
    },
    openGraph: {
      type: "article",
      title: `${course.title} | ${SEO_CONFIG.SITE_NAME}`,
      description,
      url: `${SEO_CONFIG.SITE_URL}/courses/${id}`,
      images: course.thumbnailUrl ? [{ url: course.thumbnailUrl }] : undefined,
    },
  };
}

interface RelatedQuestion {
  id: string;
  questionTitle: string;
  categoryName: string;
  categorySlug: string;
}

interface RelatedNews {
  id: string;
  title: string;
  aiSummary: string | null;
  publishedAt: Date;
}

export default async function CourseDetailPage({ params }: Props) {
  const { id } = await params;

  const course = await prisma.course.findUnique({
    where: { id },
  });

  if (!course) {
    notFound();
  }

  // 클릭 통계 조회
  const clickStats = await prisma.courseClick.aggregate({
    where: { affiliateUrl: course.affiliateUrl },
    _sum: { clickCount: true },
  });
  const totalClickCount = clickStats._sum.clickCount || 0;

  // 관련 질문 조회 (affiliateUrl로 매칭)
  const relatedQuestions = await prisma.$queryRaw<RelatedQuestion[]>`
    SELECT
      iq.id,
      iq."questionTitle",
      c.name as "categoryName",
      c.slug as "categorySlug"
    FROM "InterviewQuestion" iq
    JOIN "Category" c ON iq."categoryId" = c.id
    WHERE iq."isPublished" = true
    AND EXISTS (
      SELECT 1 FROM jsonb_array_elements(iq."relatedCourses") as elem
      WHERE elem->>'affiliateUrl' = ${course.affiliateUrl}
    )
    ORDER BY iq."createdAt" DESC
    LIMIT 10
  `;

  // 관련 뉴스 조회 (courseId로 매칭)
  const relatedNews = await prisma.$queryRaw<RelatedNews[]>`
    SELECT
      id,
      title,
      "aiSummary",
      "publishedAt"
    FROM "DailyNews"
    WHERE EXISTS (
      SELECT 1 FROM jsonb_array_elements("relatedCourses") as elem
      WHERE elem->>'courseId' = ${course.id}
    )
    ORDER BY "publishedAt" DESC
    LIMIT 10
  `;

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
        {/* 뒤로가기 */}
        <Link
          href="/courses"
          className="text-blue-600 dark:text-blue-400 hover:underline mb-6 inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          강의 목록으로
        </Link>

        {/* 카테고리 */}
        <div className="mb-4 flex items-center gap-2 text-green-500">
          <BookOpen className="h-5 w-5" />
          <span className="font-medium">추천 강의</span>
        </div>

        {/* 썸네일 */}
        {course.thumbnailUrl && (
          <div className="relative w-full aspect-video max-w-2xl mb-6 rounded-lg overflow-hidden">
            <Image
              src={course.thumbnailUrl}
              alt={course.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* 제목 */}
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4 leading-relaxed">
          {course.title}
        </h1>

        {/* 통계 */}
        {totalClickCount > 0 && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {totalClickCount}명이 클릭했어요
            </span>
          </div>
        )}

        {/* 설명 */}
        {course.description && (
          <Card className="mb-6 border-gray-200 dark:border-gray-800">
            <CardContent className="pt-6">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {course.description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* 강의 링크 버튼 */}
        <div className="mb-8">
          <a
            href={course.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="lg" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              강의 보러 가기
            </Button>
          </a>
          <p className="text-xs text-muted-foreground mt-2">
            이 링크를 통해 구매하시면 저에게 소정의 수수료가 지급됩니다.
          </p>
        </div>

        {/* 관련 면접 질문 */}
        {relatedQuestions.length > 0 && (
          <Card className="mb-6 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-blue-700 dark:text-blue-300 mb-4 flex items-center gap-2">
                <MessageCircleQuestion className="h-4 w-4" />
                이 강의와 관련된 면접 질문
              </h3>
              <div className="space-y-3">
                {relatedQuestions.map((question) => (
                  <Link key={question.id} href={`/questions/${question.id}`}>
                    <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111111] hover:border-blue-400 dark:hover:border-blue-600 transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">
                          {question.categoryName}
                        </Badge>
                      </div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {question.questionTitle}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
              {relatedQuestions.length >= 10 && (
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  관련 질문이 더 있을 수 있어요
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* 관련 개발 소식 */}
        {relatedNews.length > 0 && (
          <Card className="border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/50">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-purple-700 dark:text-purple-300 mb-4 flex items-center gap-2">
                <Newspaper className="h-4 w-4" />
                이 강의와 관련된 개발 소식
              </h3>
              <div className="space-y-3">
                {relatedNews.map((news) => (
                  <Link key={news.id} href={`/news/${news.id}`}>
                    <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111111] hover:border-purple-400 dark:hover:border-purple-600 transition-colors">
                      <p className="font-medium text-gray-900 dark:text-white mb-1">
                        {news.title}
                      </p>
                      {news.aiSummary && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {news.aiSummary}
                        </p>
                      )}
                    </div>
                  </Link>
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
