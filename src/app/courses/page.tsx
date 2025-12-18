import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ThemeToggle } from "@/components/ThemeToggle";
import Footer from "@/components/Footer";
import CourseList from "@/components/CourseList";
import { SEO_CONFIG } from "@/lib/seo";

export const metadata: Metadata = {
  title: "추천 강의",
  description: "면접 준비에 도움이 되는 추천 개발 강의를 확인하세요.",
  alternates: {
    canonical: `${SEO_CONFIG.SITE_URL}/courses`,
  },
  openGraph: {
    title: `추천 강의 | ${SEO_CONFIG.SITE_NAME}`,
    description: "면접 준비에 도움이 되는 추천 개발 강의를 확인하세요.",
    url: `${SEO_CONFIG.SITE_URL}/courses`,
  },
};

const DEFAULT_PAGE_SIZE = 20;

export default async function CoursesPage() {
  // 전체 강의 조회
  const courses = await prisma.course.findMany({
    orderBy: { createdAt: "desc" },
  });

  const totalCount = courses.length;

  // 클릭 통계 집계
  const clickStats = await prisma.courseClick.groupBy({
    by: ["affiliateUrl"],
    _sum: { clickCount: true },
  });

  const clickCountMap: Record<string, number> = {};
  clickStats.forEach((stat) => {
    clickCountMap[stat.affiliateUrl] = stat._sum.clickCount || 0;
  });

  // 연관 질문 수 조회 (affiliateUrl로 매칭)
  const relatedQuestionCounts = await Promise.all(
    courses.map(async (course) => {
      const count = await prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*)::bigint as count
        FROM "InterviewQuestion"
        WHERE "isPublished" = true
        AND EXISTS (
          SELECT 1 FROM jsonb_array_elements("relatedCourses") as elem
          WHERE elem->>'affiliateUrl' = ${course.affiliateUrl}
        )
      `;
      return { id: course.id, count: Number(count[0].count) };
    })
  );
  const questionCountMap: Record<string, number> = {};
  relatedQuestionCounts.forEach((item) => {
    questionCountMap[item.id] = item.count;
  });

  // 연관 뉴스 수 조회 (courseId로 매칭)
  const relatedNewsCounts = await Promise.all(
    courses.map(async (course) => {
      const count = await prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*)::bigint as count
        FROM "DailyNews"
        WHERE EXISTS (
          SELECT 1 FROM jsonb_array_elements("relatedCourses") as elem
          WHERE elem->>'courseId' = ${course.id}
        )
      `;
      return { id: course.id, count: Number(count[0].count) };
    })
  );
  const newsCountMap: Record<string, number> = {};
  relatedNewsCounts.forEach((item) => {
    newsCountMap[item.id] = item.count;
  });

  // 클릭 수, 연관 질문/뉴스 수 추가 및 인기순 정렬
  const coursesWithStats = courses
    .map((course) => ({
      ...course,
      clickCount: clickCountMap[course.affiliateUrl] || 0,
      relatedQuestionCount: questionCountMap[course.id] || 0,
      relatedNewsCount: newsCountMap[course.id] || 0,
    }))
    .sort((a, b) => b.clickCount - a.clickCount)
    .slice(0, DEFAULT_PAGE_SIZE);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] transition-colors">
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
            <Link href="/courses" className="text-gray-900 dark:text-white font-medium">
              강의
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-8">
          <BookOpen className="h-7 w-7 text-green-500" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            추천 강의
          </h1>
        </div>

        <CourseList
          initialCourses={coursesWithStats}
          initialTotalCount={totalCount}
        />
      </main>

      <Footer />
    </div>
  );
}
