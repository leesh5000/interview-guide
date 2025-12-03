import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { ThemeToggle } from "@/components/ThemeToggle";

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; role?: string }>;
}) {
  const params = await searchParams;
  const categorySlug = params.category;
  const roleFilter = params.role;

  const questions = await prisma.interviewQuestion.findMany({
    where: {
      isPublished: true,
      ...(categorySlug && {
        category: {
          slug: categorySlug,
        },
      }),
      ...(roleFilter && {
        targetRoles: {
          has: roleFilter,
        },
      }),
    },
    include: {
      category: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const categories = await prisma.category.findMany({
    orderBy: {
      order: "asc",
    },
  });

  const targetRoles = await prisma.targetRole.findMany({
    orderBy: {
      order: "asc",
    },
  });

  // 카테고리별 게시물 수 계산
  const categoryCounts = await Promise.all(
    categories.map(async (cat) => {
      const count = await prisma.interviewQuestion.count({
        where: {
          isPublished: true,
          categoryId: cat.id,
          ...(roleFilter && {
            targetRoles: { has: roleFilter },
          }),
        },
      });
      return { slug: cat.slug, count };
    })
  );
  const categoryCountMap = Object.fromEntries(
    categoryCounts.map((c) => [c.slug, c.count])
  );

  // 대상 독자별 게시물 수 계산
  const roleCounts = await Promise.all(
    targetRoles.map(async (role) => {
      const count = await prisma.interviewQuestion.count({
        where: {
          isPublished: true,
          targetRoles: { has: role.name },
          ...(categorySlug && {
            category: { slug: categorySlug },
          }),
        },
      });
      return { name: role.name, count };
    })
  );
  const roleCountMap = Object.fromEntries(
    roleCounts.map((r) => [r.name, r.count])
  );

  // 전체 게시물 수 (현재 필터 기준)
  const totalCount = await prisma.interviewQuestion.count({
    where: {
      isPublished: true,
      ...(categorySlug && {
        category: { slug: categorySlug },
      }),
      ...(roleFilter && {
        targetRoles: { has: roleFilter },
      }),
    },
  });

  // 필터 URL 생성 헬퍼
  const buildFilterUrl = (newCategory?: string, newRole?: string) => {
    const params = new URLSearchParams();
    if (newCategory) params.set("category", newCategory);
    if (newRole) params.set("role", newRole);
    return `/questions${params.toString() ? `?${params.toString()}` : ""}`;
  };

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
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">면접 질문</h1>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          {/* Category Filter */}
          <div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-3">카테고리:</span>
            <div className="inline-flex flex-wrap gap-2">
              <Link href={buildFilterUrl(undefined, roleFilter)}>
                <Badge variant={!categorySlug ? "default" : "outline"} className="cursor-pointer">
                  전체 ({totalCount})
                </Badge>
              </Link>
              {categories.map((cat) => (
                <Link key={cat.id} href={buildFilterUrl(cat.slug, roleFilter)}>
                  <Badge
                    variant={categorySlug === cat.slug ? "default" : "outline"}
                    className="cursor-pointer"
                  >
                    {cat.name} ({categoryCountMap[cat.slug] || 0})
                  </Badge>
                </Link>
              ))}
            </div>
          </div>

          {/* Target Role Filter */}
          <div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-3">대상 독자:</span>
            <div className="inline-flex flex-wrap gap-2">
              <Link href={buildFilterUrl(categorySlug, undefined)}>
                <Badge variant={!roleFilter ? "default" : "outline"} className="cursor-pointer">
                  전체 ({totalCount})
                </Badge>
              </Link>
              {targetRoles.map((role) => (
                <Link key={role.id} href={buildFilterUrl(categorySlug, role.name)}>
                  <Badge
                    variant={roleFilter === role.name ? "default" : "outline"}
                    className="cursor-pointer"
                  >
                    {role.name} ({roleCountMap[role.name] || 0})
                  </Badge>
                </Link>
              ))}
            </div>
          </div>

          {/* Active Filters Summary */}
          {(categorySlug || roleFilter) && (
            <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-[#1a1a1a]">
              <span className="text-sm text-gray-500 dark:text-gray-400">활성 필터:</span>
              {categorySlug && (
                <Badge variant="secondary" className="bg-gray-100 dark:bg-[#1a1a1a]">
                  {categories.find(c => c.slug === categorySlug)?.name}
                </Badge>
              )}
              {roleFilter && (
                <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                  {roleFilter}
                </Badge>
              )}
              <Link
                href="/questions"
                className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 ml-2"
              >
                모두 해제
              </Link>
            </div>
          )}
        </div>

        {/* Questions List */}
        {questions.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p>아직 등록된 질문이 없습니다.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {questions.map((q) => (
              <Link key={q.id} href={`/questions/${q.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer bg-white dark:bg-[#141414] border-gray-200 dark:border-[#1a1a1a]">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge variant="secondary" className="bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300">
                        {q.category.name}
                      </Badge>
                      {q.targetRoles.map((role) => (
                        <Badge key={role} variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300">
                          {role}
                        </Badge>
                      ))}
                    </div>
                    <CardTitle className="text-lg text-gray-900 dark:text-white">{q.questionTitle}</CardTitle>
                    {q.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap mt-2">
                        {q.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span>조회수 {q.viewCount}</span>
                      <span>자세히 보기 &rarr;</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
