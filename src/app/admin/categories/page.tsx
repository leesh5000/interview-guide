import { redirect } from "next/navigation";
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
import CategoryDeleteButton from "@/components/admin/CategoryDeleteButton";
import CategoryForm from "@/components/admin/CategoryForm";

export default async function AdminCategoriesPage() {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    redirect("/admin/login");
  }

  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: {
      _count: {
        select: { questions: true },
      },
    },
  });

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">카테고리 관리</h1>
        <CategoryForm
          trigger={<Button>새 카테고리 추가</Button>}
        />
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>아직 생성된 카테고리가 없습니다.</p>
          <p className="mt-2">새 카테고리를 추가해보세요.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>순서</TableHead>
                <TableHead>이름</TableHead>
                <TableHead>슬러그</TableHead>
                <TableHead>설명</TableHead>
                <TableHead>질문 수</TableHead>
                <TableHead className="text-right">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>{category.order}</TableCell>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{category.slug}</Badge>
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {category.description || "-"}
                  </TableCell>
                  <TableCell>{category._count.questions}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <CategoryForm
                        category={category}
                        trigger={
                          <Button variant="outline" size="sm">
                            수정
                          </Button>
                        }
                      />
                      <CategoryDeleteButton categoryId={category.id} />
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
