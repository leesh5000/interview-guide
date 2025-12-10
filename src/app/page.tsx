import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";

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

  // 오늘의 인기 강의 조회 (오늘 클릭 수 기준)
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000; // UTC+9
  const kstDate = new Date(now.getTime() + kstOffset);
  const today = new Date(kstDate.toISOString().split("T")[0]);

  const clickStats = await prisma.dailyClickLog.groupBy({
    by: ["affiliateUrl"],
    where: { date: today },
    _sum: { clickCount: true },
    orderBy: { _sum: { clickCount: "desc" } },
    take: 5,
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

  return (
    <div className="min-h-screen bg-background transition-colors">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-lg font-semibold text-foreground">
            DevInterview
          </Link>
          <nav className="flex gap-4 items-center">
            <Link
              href="/questions"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              질문 목록
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 tracking-tight">
          개발자 면접, 확실하게 준비하세요
        </h1>
        <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
          면접 질문과 모범 답안, 그리고 실력을 키워줄 추천 강의까지
          한 곳에서 확인하세요.
        </p>
        <Link href="/questions">
          <Button size="lg" className="gap-2">
            면접 질문 보기
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </section>

      {/* Popular Courses Section */}
      {popularCourses.length > 0 && (
        <section className="py-12 bg-secondary/30">
          <div className="container mx-auto px-4">
            <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              오늘의 인기 강의
            </h2>
          </div>
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-4 px-4 pb-4 min-w-max mx-auto w-fit">
              {popularCourses.map((course) => (
                <a
                  key={course.id}
                  href={course.affiliateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block flex-shrink-0"
                >
                  <Card className="w-64 hover:border-foreground/20 transition-colors cursor-pointer overflow-hidden">
                    {course.thumbnailUrl ? (
                      <div className="relative w-full h-36 bg-muted">
                        <Image
                          src={course.thumbnailUrl}
                          alt={course.title}
                          fill
                          className="object-cover"
                          sizes="256px"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-36 bg-muted flex items-center justify-center">
                        <span className="text-muted-foreground text-sm">No Image</span>
                      </div>
                    )}
                    <CardContent className="p-4">
                      <p className="font-medium text-foreground line-clamp-2 text-sm">
                        {course.title}
                      </p>
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categories Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-semibold text-foreground mb-8 text-center">
            카테고리별 면접 질문
          </h2>
        </div>
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-4 px-4 pb-4 min-w-max mx-auto w-fit">
            {categoriesWithCount.map((category) => (
              <Link key={category.slug} href={`/questions?category=${category.slug}`}>
                <Card className="w-72 h-full hover:border-foreground/20 transition-colors cursor-pointer flex-shrink-0">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {category.name}
                      <span className="text-sm font-normal text-muted-foreground">
                        {category.questionCount}개
                      </span>
                    </CardTitle>
                    <CardDescription className="line-clamp-2">{category.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <span className="text-sm text-foreground hover:underline inline-flex items-center gap-1">
                      질문 보기
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Target Roles Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-semibold text-foreground mb-8 text-center">
            대상 독자별 면접 질문
          </h2>
        </div>
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-4 px-4 pb-4 min-w-max mx-auto w-fit">
            {targetRolesWithCount.map((role) => (
              <Link key={role.name} href={`/questions?role=${encodeURIComponent(role.name)}`}>
                <Card className="w-64 h-full hover:border-foreground/20 transition-colors cursor-pointer flex-shrink-0">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {role.name}
                      <span className="text-sm font-normal text-muted-foreground">
                        {role.questionCount}개
                      </span>
                    </CardTitle>
                    <CardDescription className="line-clamp-2">{role.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <span className="text-sm text-foreground hover:underline inline-flex items-center gap-1">
                      질문 보기
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
