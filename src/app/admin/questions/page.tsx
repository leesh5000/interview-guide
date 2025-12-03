import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { isAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DeleteButton from "@/components/admin/DeleteButton";

export default async function AdminQuestionsPage() {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    redirect("/admin/login");
  }

  const questions = await prisma.interviewQuestion.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">게시물 관리</h1>
        <Link href="/admin/questions/new">
          <Button>새 게시물 작성</Button>
        </Link>
      </div>

      {questions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>아직 작성된 게시물이 없습니다.</p>
          <Link href="/admin/questions/new" className="text-blue-600 hover:underline">
            첫 게시물을 작성해보세요
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[400px]">질문</TableHead>
                <TableHead>카테고리</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>조회수</TableHead>
                <TableHead>작성일</TableHead>
                <TableHead className="text-right">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/admin/questions/${q.id}/edit`}
                      className="hover:text-blue-600"
                    >
                      {q.questionTitle.length > 50
                        ? q.questionTitle.substring(0, 50) + "..."
                        : q.questionTitle}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{q.category.name}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={q.isPublished ? "default" : "outline"}>
                      {q.isPublished ? "발행됨" : "임시저장"}
                    </Badge>
                  </TableCell>
                  <TableCell>{q.viewCount}</TableCell>
                  <TableCell>
                    {new Date(q.createdAt).toLocaleDateString("ko-KR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/questions/${q.id}/edit`}>
                        <Button variant="outline" size="sm">
                          수정
                        </Button>
                      </Link>
                      <DeleteButton questionId={q.id} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </main>
  );
}
