import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { prisma } from "@/lib/prisma";

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-[#0a0a0a] dark:to-[#111111] transition-colors">
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

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          개발자 면접, 확실하게 준비하세요
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
          실제 면접에서 자주 나오는 질문과 모범 답안을 확인하고,
          AI 요약과 추천 강의로 효율적으로 학습하세요.
        </p>
        <Link href="/questions">
          <Button size="lg" className="text-lg px-8">
            면접 질문 보기
          </Button>
        </Link>
      </section>

      {/* Categories Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
          카테고리별 면접 질문
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoriesWithCount.map((category) => (
            <Link key={category.slug} href={`/questions?category=${category.slug}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full bg-white dark:bg-[#141414] border-gray-200 dark:border-[#1a1a1a]">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white flex items-center justify-between">
                    {category.name}
                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                      {category.questionCount}개
                    </span>
                  </CardTitle>
                  <CardDescription className="text-gray-500 dark:text-gray-400">{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="text-sm text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1">
                    질문 보기
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Target Roles Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
          대상 독자별 면접 질문
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {targetRolesWithCount.map((role) => (
            <Link key={role.name} href={`/questions?role=${encodeURIComponent(role.name)}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full bg-white dark:bg-[#141414] border-gray-200 dark:border-[#1a1a1a]">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white flex items-center justify-between">
                    {role.name}
                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                      {role.questionCount}개
                    </span>
                  </CardTitle>
                  <CardDescription className="text-gray-500 dark:text-gray-400">{role.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="text-sm text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1">
                    질문 보기
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-[#1a1a1a] bg-gray-50 dark:bg-[#0d0d0d] mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-gray-600 dark:text-gray-400">
          <p>&copy; 2024 DevInterview. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
