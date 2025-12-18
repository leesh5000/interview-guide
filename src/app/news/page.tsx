import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, ExternalLink, Newspaper } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ThemeToggle } from "@/components/ThemeToggle";
import Footer from "@/components/Footer";
import { SEO_CONFIG } from "@/lib/seo";
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

export default async function NewsPage() {
  // 모든 뉴스를 날짜별로 그룹화하여 조회
  const news = await prisma.dailyNews.findMany({
    orderBy: { publishedAt: "desc" },
    take: 100,
  });

  // 날짜별로 그룹화
  const newsByDate = news.reduce(
    (acc, item) => {
      const dateKey = item.displayDate.toISOString().split("T")[0];
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(item);
      return acc;
    },
    {} as Record<string, typeof news>
  );

  const sortedDates = Object.keys(newsByDate).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

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

        {news.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 dark:text-gray-400">
              등록된 개발 소식이 없습니다.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {sortedDates.map((dateKey) => {
              const dateNews = newsByDate[dateKey];
              const displayDate = new Date(dateKey);
              const formattedDate = displayDate.toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "short",
              });

              return (
                <section key={dateKey}>
                  <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                    <Calendar className="h-4 w-4" />
                    {formattedDate}
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {dateNews.map((item) => (
                      <Link key={item.id} href={`/news/${item.id}`}>
                        <Card className="h-full hover:border-foreground/20 transition-colors cursor-pointer">
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between gap-2">
                              <CardTitle className="text-sm md:text-base font-medium leading-tight line-clamp-2">
                                {item.title}
                              </CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <CardDescription className="text-xs md:text-sm leading-relaxed line-clamp-3">
                              {item.aiSummary}
                            </CardDescription>
                            <div className="mt-3 flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">
                                {new Date(item.publishedAt).toLocaleTimeString(
                                  "ko-KR",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </span>
                              <span className="text-xs text-purple-500 flex items-center gap-1">
                                자세히 보기
                                <ExternalLink className="h-3 w-3" />
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
