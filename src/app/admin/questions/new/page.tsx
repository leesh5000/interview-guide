import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import QuestionForm from "@/components/admin/QuestionForm";

export default async function NewQuestionPage() {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    redirect("/admin/login");
  }

  let categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
  });

  // 카테고리가 없으면 기본 카테고리 생성
  if (categories.length === 0) {
    const defaultCategories = [
      { name: "데이터베이스", slug: "database", description: "DB 설계, 쿼리 최적화, 인덱싱", order: 1 },
      { name: "네트워크", slug: "network", description: "HTTP, TCP/IP, REST API", order: 2 },
      { name: "알고리즘", slug: "algorithm", description: "자료구조, 정렬, 탐색", order: 3 },
      { name: "운영체제", slug: "os", description: "프로세스, 메모리, 동기화", order: 4 },
      { name: "백엔드", slug: "backend", description: "Spring, Node.js, 아키텍처", order: 5 },
      { name: "프론트엔드", slug: "frontend", description: "React, JavaScript, CSS", order: 6 },
    ];

    for (const cat of defaultCategories) {
      await prisma.category.create({ data: cat });
    }

    categories = await prisma.category.findMany({
      orderBy: { order: "asc" },
    });
  }

  const targetRoles = await prisma.targetRole.findMany({
    orderBy: { order: "asc" },
  });

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">새 게시물 작성</h1>
      <QuestionForm categories={categories} targetRoles={targetRoles} />
    </main>
  );
}
