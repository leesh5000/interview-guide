import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import TargetRoleDeleteButton from "@/components/admin/TargetRoleDeleteButton";
import TargetRoleForm from "@/components/admin/TargetRoleForm";

export default async function AdminTargetRolesPage() {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    redirect("/admin/login");
  }

  const targetRoles = await prisma.targetRole.findMany({
    orderBy: { order: "asc" },
  });

  // 각 대상 역할별 게시물 수 계산
  const targetRolesWithCount = await Promise.all(
    targetRoles.map(async (role) => {
      const count = await prisma.interviewQuestion.count({
        where: {
          targetRoles: {
            has: role.name,
          },
        },
      });
      return { ...role, questionCount: count };
    })
  );

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">대상 독자 관리</h1>
        <TargetRoleForm
          trigger={<Button>새 대상 추가</Button>}
        />
      </div>

      {targetRolesWithCount.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>아직 생성된 대상 역할이 없습니다.</p>
          <p className="mt-2">새 대상 역할을 추가해보세요.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>순서</TableHead>
                <TableHead>이름</TableHead>
                <TableHead>설명</TableHead>
                <TableHead>게시물 수</TableHead>
                <TableHead className="text-right">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {targetRolesWithCount.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>{role.order}</TableCell>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell className="text-gray-500">
                    {role.description || "-"}
                  </TableCell>
                  <TableCell>{role.questionCount}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <TargetRoleForm
                        targetRole={role}
                        trigger={
                          <Button variant="outline" size="sm">
                            수정
                          </Button>
                        }
                      />
                      <TargetRoleDeleteButton targetRoleId={role.id} />
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
