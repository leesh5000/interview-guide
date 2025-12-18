import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Newspaper } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ThemeToggle } from "@/components/ThemeToggle";
import Footer from "@/components/Footer";
import { SEO_CONFIG } from "@/lib/seo";
import { NewsDatePicker } from "@/components/NewsDatePicker";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "개발 소식",
  description: "개발자를 위한 최신 기술 뉴스와 AI 요약을 확인하세요.",
  alternates: {
    canonical: `${SEO_CONFIG.SITE_URL}/news`,
  },
  openGraph: {
    title: `개발 소식 | ${SEO_CONFIG.SITE_NAME}`,
    description: "개발자를 위한 최신 기술 뉴스와 AI 요약을 확인하세요.",
    url: `${SEO_CONFIG.SITE_URL}/news`,
  },
  twitter: {
    title: `개발 소식 | ${SEO_CONFIG.SITE_NAME}`,
    description: "개발자를 위한 최신 기술 뉴스와 AI 요약을 확인하세요.",
  },
};

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;

  // KST 기준 오늘 날짜
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(now.getTime() + kstOffset);
  const today = kstDate.toISOString().split("T")[0];

  // 날짜 파라미터가 없으면 오늘 날짜를 기본값으로
  const selectedDate = params.date ?? today;

  // 모든 뉴스 조회
  const allNews = await prisma.dailyNews.findMany({
    orderBy: { publishedAt: "desc" },
    take: 200,
  });

  // 날짜별로 그룹화하여 날짜 목록 추출
  const dateSet = new Set<string>();
  allNews.forEach((item) => {
    const dateKey = item.displayDate.toISOString().split("T")[0];
    dateSet.add(dateKey);
  });

  const sortedDates = Array.from(dateSet).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  // 선택된 날짜에 해당하는 뉴스만 필터링
  const filteredNews = selectedDate
    ? allNews.filter(
        (item) => item.displayDate.toISOString().split("T")[0] === selectedDate
      )
    : allNews;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] transition-colors">
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
              className="text-gray-900 dark:text-white font-medium"
            >
              개발 소식
            </Link>
            <Link
              href="/courses"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              강의
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-8">
          <Newspaper className="h-7 w-7 text-purple-500" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            개발 소식
          </h1>
        </div>

        {/* Date Filter */}
        <div className="mb-8">
          <NewsDatePicker
            selectedDate={selectedDate}
            availableDates={sortedDates}
          />
        </div>

        {/* News List */}
        {filteredNews.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 dark:text-gray-400">
              {selectedDate
                ? "해당 날짜에 등록된 개발 소식이 없습니다."
                : "등록된 개발 소식이 없습니다."}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredNews.map((item) => (
              <Link key={item.id} href={`/news/${item.id}`} className="block">
                <Card className="hover:border-foreground/20 transition-colors cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-4">
                      <CardTitle className="text-base md:text-lg font-medium leading-tight">
                        {item.title}
                      </CardTitle>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {new Date(item.publishedAt).toLocaleDateString("ko-KR", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-sm leading-relaxed line-clamp-2 mb-3">
                      {item.aiSummary}
                    </CardDescription>
                    <div className="flex items-center justify-between">
                      {(item.relatedCourses as unknown[])?.length > 0 && (
                        <span className="text-sm text-green-600 dark:text-green-400 font-medium inline-flex items-center gap-1.5">
                          <BookOpen className="h-4 w-4" />
                          강의 {(item.relatedCourses as unknown[]).length}
                        </span>
                      )}
                      <span className="text-sm text-purple-500 inline-flex items-center gap-1 ml-auto">
                        자세히 보기
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
