import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  ExternalLink,
  Newspaper,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { ThemeToggle } from "@/components/ThemeToggle";
import Footer from "@/components/Footer";
import { SEO_CONFIG, truncateText } from "@/lib/seo";

interface RelatedCourse {
  courseId: string;
  title: string;
  affiliateUrl: string;
  matchScore: number;
}

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  const news = await prisma.dailyNews.findUnique({
    where: { id },
  });

  if (!news) {
    return {
      title: "소식을 찾을 수 없습니다",
    };
  }

  const description = truncateText(news.aiSummary, 160);

  return {
    title: news.title,
    description,
    alternates: {
      canonical: `${SEO_CONFIG.SITE_URL}/news/${id}`,
    },
    openGraph: {
      type: "article",
      title: news.title,
      description,
      url: `${SEO_CONFIG.SITE_URL}/news/${id}`,
      publishedTime: news.publishedAt.toISOString(),
    },
    twitter: {
      card: "summary_large_image",
      title: news.title,
      description,
    },
  };
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const news = await prisma.dailyNews.findUnique({
    where: { id },
  });

  if (!news) {
    notFound();
  }

  const relatedCourses = news.relatedCourses as unknown as RelatedCourse[];

  // 관련 강의들의 썸네일 정보 조회
  const courseIds = relatedCourses.map((c) => c.courseId);
  const courses = await prisma.course.findMany({
    where: { id: { in: courseIds } },
    select: { id: true, thumbnailUrl: true },
  });
  const thumbnailMap: Record<string, string | null> = {};
  courses.forEach((c) => {
    thumbnailMap[c.id] = c.thumbnailUrl;
  });

  const formattedDate = new Date(news.publishedAt).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 transition-colors">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-[#1a1a1a] bg-white dark:bg-[#111111]">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link
            href="/"
            className="text-xl font-bold text-gray-900 dark:text-white"
          >
            DevInterview
          </Link>
          <nav className="flex gap-4 items-center">
            <Link
              href="/questions"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              질문 목록
            </Link>
            <Link
              href="/news"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              개발 소식
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Link */}
        <Link
          href="/news"
          className="text-blue-600 dark:text-blue-400 hover:underline mb-6 inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          개발 소식 목록으로
        </Link>

        {/* News Category */}
        <div className="mb-4 flex items-center gap-2 text-purple-500">
          <Newspaper className="h-5 w-5" />
          <span className="font-medium">개발 소식</span>
        </div>

        {/* News Title */}
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4 leading-relaxed">
          {news.title}
        </h1>

        {/* Publish Date */}
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
          <Calendar className="h-4 w-4" />
          {formattedDate}
        </div>

        {/* Original Article Link */}
        <Card className="mb-6 border-gray-200 dark:border-gray-700">
          <CardContent className="pt-6">
            <a
              href={news.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              <ExternalLink className="h-4 w-4" />
              원문 보기
            </a>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {news.sourceUrl}
            </p>
          </CardContent>
        </Card>

        {/* AI Summary */}
        <Card className="mb-6 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-blue-700 dark:text-blue-300 mb-3">
              AI 요약
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {news.aiSummary}
            </p>
          </CardContent>
        </Card>

        {/* Original Description */}
        {news.description && (
          <Card className="mb-6 border-gray-200 dark:border-gray-700">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">
                원문 요약
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {news.description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Related Courses */}
        {relatedCourses.length > 0 && (
          <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/50">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-green-700 dark:text-green-300 mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                관련 강의
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                이 주제를 더 깊게 공부할 수 있는 강의를 추천해요.
              </p>
              <div className="space-y-3">
                {relatedCourses.map((course) => {
                  const thumbnailUrl = thumbnailMap[course.courseId];
                  return (
                    <a
                      key={course.courseId}
                      href={course.affiliateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111111] hover:border-green-400 dark:hover:border-green-600 transition-colors"
                    >
                      {thumbnailUrl && (
                        <div className="flex-shrink-0 w-16 h-12 relative rounded overflow-hidden">
                          <Image
                            src={thumbnailUrl}
                            alt={course.title}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {course.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          관련도: {Math.round(course.matchScore * 100)}%
                        </p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    </a>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
}
