import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import BulkQuestionForm from "@/components/admin/BulkQuestionForm";

export default async function BulkQuestionPage() {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    redirect("/admin/login");
  }

  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
  });

  const targetRoles = await prisma.targetRole.findMany({
    orderBy: { order: "asc" },
  });

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-semibold text-foreground mb-8">
        게시물 일괄 등록
      </h1>
      <BulkQuestionForm categories={categories} targetRoles={targetRoles} />
    </main>
  );
}
