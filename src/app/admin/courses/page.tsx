import { redirect } from "next/navigation";
import Image from "next/image";
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
import CourseDeleteButton from "@/components/admin/CourseDeleteButton";
import CourseForm from "@/components/admin/CourseForm";

export default async function AdminCoursesPage() {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    redirect("/admin/login");
  }

  const courses = await prisma.course.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold text-foreground">강의 관리</h1>
        <CourseForm
          trigger={<Button>새 강의 추가</Button>}
        />
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>아직 등록된 강의가 없습니다.</p>
          <p className="mt-2">새 강의를 추가하거나 게시글 등록 시 자동으로 추가됩니다.</p>
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">썸네일</TableHead>
                <TableHead>강의명</TableHead>
                <TableHead>제휴 링크</TableHead>
                <TableHead>설명</TableHead>
                <TableHead className="text-right">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell>
                    {course.thumbnailUrl ? (
                      <Image
                        src={course.thumbnailUrl}
                        alt={course.title}
                        width={60}
                        height={40}
                        className="rounded object-cover"
                      />
                    ) : (
                      <div className="w-[60px] h-[40px] bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                        없음
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium max-w-[200px] truncate">
                    {course.title}
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <a
                      href={course.affiliateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline truncate block"
                    >
                      {course.affiliateUrl}
                    </a>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">
                    {course.description || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <CourseForm
                        course={course}
                        trigger={
                          <Button variant="outline" size="sm">
                            수정
                          </Button>
                        }
                      />
                      <CourseDeleteButton courseId={course.id} />
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
