import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { ThemeToggle } from "@/components/ThemeToggle";
import Footer from "@/components/Footer";
import ExpandableFilterList from "@/components/ExpandableFilterList";
import QuestionList from "@/components/QuestionList";
import { SEO_CONFIG } from "@/lib/seo";

const DEFAULT_PAGE_SIZE = 50;

type Props = {
  searchParams: Promise<{ category?: string; role?: string }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const categorySlug = params.category;
  const roleFilter = params.role;

  let title = "면접 질문 목록";
  let description = "개발자 면접에서 자주 나오는 질문들을 카테고리별로 확인하세요.";
  let canonicalPath = "/questions";

  if (categorySlug) {
    const category = await prisma.category.findUnique({
      where: { slug: categorySlug },
    });
    if (category) {
      title = `${category.name} 면접 질문`;
      description = category.description || `${category.name} 관련 개발자 면접 질문과 모범 답안을 확인하세요.`;
      canonicalPath = `/questions?category=${categorySlug}`;
    }
  }

  if (roleFilter) {
    title = `${roleFilter} ${title}`;
    description = `${roleFilter}를 위한 ${description}`;
    canonicalPath = categorySlug
      ? `/questions?category=${categorySlug}&role=${encodeURIComponent(roleFilter)}`
      : `/questions?role=${encodeURIComponent(roleFilter)}`;
  }

  return {
    title,
    description,
    alternates: {
      canonical: `${SEO_CONFIG.SITE_URL}${canonicalPath}`,
    },
    openGraph: {
      title: `${title} | ${SEO_CONFIG.SITE_NAME}`,
      description,
      url: `${SEO_CONFIG.SITE_URL}${canonicalPath}`,
    },
    twitter: {
      title: `${title} | ${SEO_CONFIG.SITE_NAME}`,
      description,
    },
  };
}

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; role?: string }>;
}) {
  const params = await searchParams;
  const categorySlug = params.category;
  const roleFilter = params.role;

  const questionWhere = {
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
  };

  const [questions, questionTotalCount] = await Promise.all([
    prisma.interviewQuestion.findMany({
      where: questionWhere,
      include: {
        category: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: DEFAULT_PAGE_SIZE,
    }),
    prisma.interviewQuestion.count({
      where: questionWhere,
    }),
  ]);

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
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2 md:inline md:mb-0 md:mr-3">카테고리:</span>
            <ExpandableFilterList
              items={categories.map((cat) => ({
                id: cat.id,
                label: cat.name,
                value: cat.slug,
                count: categoryCountMap[cat.slug] || 0,
              }))}
              selectedValue={categorySlug}
              totalCount={questionTotalCount}
              filterType="category"
              currentCategorySlug={categorySlug}
              currentRoleFilter={roleFilter}
            />
          </div>

          {/* Target Role Filter */}
          <div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2 md:inline md:mb-0 md:mr-3">대상 독자:</span>
            <ExpandableFilterList
              items={targetRoles.map((role) => ({
                id: role.id,
                label: role.name,
                value: role.name,
                count: roleCountMap[role.name] || 0,
              }))}
              selectedValue={roleFilter}
              totalCount={questionTotalCount}
              filterType="role"
              currentCategorySlug={categorySlug}
              currentRoleFilter={roleFilter}
            />
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
        <QuestionList
          initialQuestions={questions}
          initialTotalCount={questionTotalCount}
          categorySlug={categorySlug}
          roleFilter={roleFilter}
        />
      </main>

      <Footer />
    </div>
  );
}
