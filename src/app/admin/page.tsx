import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    redirect("/admin/login");
  }

  const [totalQuestions, publishedQuestions, draftQuestions, totalViews, popularQuestions] =
    await Promise.all([
      prisma.interviewQuestion.count(),
      prisma.interviewQuestion.count({ where: { isPublished: true } }),
      prisma.interviewQuestion.count({ where: { isPublished: false } }),
      prisma.interviewQuestion.aggregate({ _sum: { viewCount: true } }),
      prisma.interviewQuestion.findMany({
        take: 5,
        orderBy: { viewCount: "desc" },
        include: { category: true },
      }),
    ]);

  const recentQuestions = await prisma.interviewQuestion.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { category: true },
  });

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">대시보드</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              전체 게시물
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalQuestions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              발행됨
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{publishedQuestions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              임시저장
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">{draftQuestions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              총 조회수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">
              {totalViews._sum.viewCount ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Questions */}
        <Card>
          <CardHeader>
            <CardTitle>최근 작성 게시물</CardTitle>
          </CardHeader>
          <CardContent>
            {recentQuestions.length === 0 ? (
              <p className="text-gray-500">아직 작성된 게시물이 없습니다.</p>
            ) : (
              <ul className="space-y-3">
                {recentQuestions.map((q) => (
                  <li key={q.id} className="flex justify-between items-center">
                    <Link
                      href={`/admin/questions/${q.id}/edit`}
                      className="text-blue-600 hover:underline truncate flex-1"
                    >
                      {q.questionTitle}
                    </Link>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        q.isPublished
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {q.isPublished ? "발행됨" : "임시저장"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Popular Questions */}
        <Card>
          <CardHeader>
            <CardTitle>인기 게시물</CardTitle>
          </CardHeader>
          <CardContent>
            {popularQuestions.length === 0 ? (
              <p className="text-gray-500">아직 작성된 게시물이 없습니다.</p>
            ) : (
              <ul className="space-y-3">
                {popularQuestions.map((q) => (
                  <li key={q.id} className="flex justify-between items-center">
                    <Link
                      href={`/admin/questions/${q.id}/edit`}
                      className="text-blue-600 hover:underline truncate flex-1"
                    >
                      {q.questionTitle}
                    </Link>
                    <span className="text-gray-500 text-sm">
                      조회 {q.viewCount}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
