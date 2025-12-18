import Link from "next/link";
import { ArrowRight, Flame, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CourseCarousel } from "@/components/CourseCarousel";
import { Carousel } from "@/components/Carousel";
import { DailyNewsSection } from "@/components/DailyNewsSection";
import { ThemeToggle } from "@/components/ThemeToggle";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import { SEO_CONFIG } from "@/lib/seo";

// 빌드 시 정적 생성 시도하지 않음 (Prisma/PgBouncer 연결 제한 문제 방지)
export const dynamic = "force-dynamic";

export default async function Home() {
  // 카테고리 및 게시물 수 조회
  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
  });

  const categoriesWithCount = await Promise.all(
    categories.map(async (cat) => {
      const count = await prisma.interviewQuestion.count({
        where: {
          isPublished: true,
          categoryId: cat.id,
        },
      });
      return { ...cat, questionCount: count };
    })
  );

  // 대상 독자 및 게시물 수 조회
  const targetRoles = await prisma.targetRole.findMany({
    orderBy: { order: "asc" },
  });

  const targetRolesWithCount = await Promise.all(
    targetRoles.map(async (role) => {
      const count = await prisma.interviewQuestion.count({
        where: {
          isPublished: true,
          targetRoles: { has: role.name },
        },
      });
      return { ...role, questionCount: count };
    })
  );

  // 인기 강의 조회 (전체 기간 클릭 수 기준, 최대 20개)
  const clickStats = await prisma.courseClick.groupBy({
    by: ["affiliateUrl"],
    _sum: { clickCount: true },
    orderBy: { _sum: { clickCount: "desc" } },
    take: 20,
  });

  const popularCourses = clickStats.length > 0
    ? await prisma.course.findMany({
        where: { affiliateUrl: { in: clickStats.map((s) => s.affiliateUrl) } },
      }).then((courses) => {
        // 클릭 수 순서대로 정렬
        const courseMap = new Map(courses.map((c) => [c.affiliateUrl, c]));
        return clickStats
          .map((stat) => {
            const course = courseMap.get(stat.affiliateUrl);
            return course ? { ...course, clickCount: stat._sum.clickCount || 0 } : null;
          })
          .filter((c): c is NonNullable<typeof c> => c !== null);
      })
    : [];

  // 신규 강의 조회 (최근 등록순, 최대 20개)
  const newCourses = await prisma.course.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // 오늘의 개발 소식 조회 (KST 기준 오늘)
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(now.getTime() + kstOffset);
  const today = new Date(kstDate.toISOString().split("T")[0]);

  const dailyNews = await prisma.dailyNews.findMany({
    where: { displayDate: today },
    orderBy: { publishedAt: "desc" },
    take: 5,
  });

  // 개발 소식의 관련 강의 썸네일 조회
  const allCourseIds = dailyNews.flatMap((n) => {
    const courses = n.relatedCourses as Array<{ courseId: string }>;
    return courses.map((c) => c.courseId);
  });
  const uniqueCourseIds = [...new Set(allCourseIds)];
  const courseThumbnails = uniqueCourseIds.length > 0
    ? await prisma.course.findMany({
        where: { id: { in: uniqueCourseIds } },
        select: { id: true, thumbnailUrl: true },
      })
    : [];
  const thumbnailMap: Record<string, string | null> = {};
  courseThumbnails.forEach((c) => {
    thumbnailMap[c.id] = c.thumbnailUrl;
  });

  // Organization JSON-LD for homepage
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SEO_CONFIG.SITE_NAME,
    url: SEO_CONFIG.SITE_URL,
    logo: `${SEO_CONFIG.SITE_URL}${SEO_CONFIG.DEFAULT_OG_IMAGE}`,
    description: SEO_CONFIG.DEFAULT_DESCRIPTION,
  };

  return (
    <div className="min-h-screen bg-background transition-colors">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
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

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 md:py-24 text-center">
        <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 md:mb-6 tracking-tight">
          개발자 면접, 확실하게 준비하세요
        </h1>
        <p className="text-sm md:text-lg text-muted-foreground mb-6 md:mb-10 max-w-2xl mx-auto leading-relaxed">
          면접 질문과 모범 답안, 그리고 실력을 키워줄 추천 강의까지
          한 곳에서 확인하세요.
        </p>
        <Link href="/questions">
          <Button size="default" className="gap-2 md:h-11 md:px-8">
            면접 질문 보기
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </section>

      {/* Daily News Section */}
      <DailyNewsSection
        news={dailyNews.map((n) => ({
          ...n,
          publishedAt: n.publishedAt.toISOString(),
          relatedCourses: (
            n.relatedCourses as Array<{
              courseId: string;
              title: string;
              affiliateUrl: string;
              matchScore: number;
            }>
          ).map((course) => ({
            ...course,
            thumbnailUrl: thumbnailMap[course.courseId] || null,
          })),
        }))}
      />

      {/* Popular Courses Section */}
      {popularCourses.length > 0 && (
        <section className="py-6 md:py-12 bg-secondary/30">
          <div className="container mx-auto px-4">
            <h2 className="text-lg md:text-xl font-semibold text-foreground mb-4 md:mb-6 flex items-center justify-center gap-2">
              <Flame className="h-4 w-4 md:h-5 md:w-5 text-orange-500" />
              지금 뜨는 인기 강의
            </h2>
            <CourseCarousel courses={popularCourses} intervalMs={4000} />
          </div>
        </section>
      )}

      {/* New Courses Section */}
      {newCourses.length > 0 && (
        <section className="py-6 md:py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-lg md:text-xl font-semibold text-foreground mb-4 md:mb-6 flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
              신규 강의
            </h2>
            <CourseCarousel courses={newCourses} intervalMs={5000} initialDelayMs={2500} />
          </div>
        </section>
      )}

      {/* Categories Section */}
      <section className="py-8 md:py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 md:mb-8 text-center">
            카테고리별 면접 질문
          </h2>
          <Carousel intervalMs={6000} initialDelayMs={1000}>
            {categoriesWithCount.map((category) => (
              <Link key={category.slug} href={`/questions?category=${category.slug}`} className="flex-shrink-0">
                <Card className="w-56 md:w-72 h-full hover:border-foreground/20 transition-colors cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-sm md:text-base">
                      {category.name}
                      <span className="text-xs md:text-sm font-normal text-muted-foreground">
                        {category.questionCount}개
                      </span>
                    </CardTitle>
                    <CardDescription className="line-clamp-2 text-xs md:text-sm">{category.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <span className="text-xs md:text-sm text-foreground hover:underline inline-flex items-center gap-1">
                      질문 보기
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </Carousel>
        </div>
      </section>

      {/* Target Roles Section */}
      <section className="py-8 md:py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 md:mb-8 text-center">
            대상 독자별 면접 질문
          </h2>
          <Carousel intervalMs={7000} initialDelayMs={3500}>
            {targetRolesWithCount.map((role) => (
              <Link key={role.name} href={`/questions?role=${encodeURIComponent(role.name)}`} className="flex-shrink-0">
                <Card className="w-48 md:w-64 h-full hover:border-foreground/20 transition-colors cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-sm md:text-base">
                      {role.name}
                      <span className="text-xs md:text-sm font-normal text-muted-foreground">
                        {role.questionCount}개
                      </span>
                    </CardTitle>
                    <CardDescription className="line-clamp-2 text-xs md:text-sm">{role.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <span className="text-xs md:text-sm text-foreground hover:underline inline-flex items-center gap-1">
                      질문 보기
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </Carousel>
        </div>
      </section>

      <Footer />
    </div>
  );
}
