import { redirect } from "next/navigation";
import Link from "next/link";
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
import NewsDeleteButton from "@/components/admin/NewsDeleteButton";
import ManualNewsCollectButton from "@/components/admin/ManualNewsCollectButton";
import { CheckCircle, XCircle, Clock } from "lucide-react";

export default async function AdminNewsPage() {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    redirect("/admin/login");
  }

  const [news, cronLogs] = await Promise.all([
    prisma.dailyNews.findMany({
      orderBy: { fetchedAt: "desc" },
    }),
    prisma.cronLog.findMany({
      where: { jobName: "daily-news" },
      orderBy: { executedAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold text-foreground">뉴스 관리</h1>
        <ManualNewsCollectButton />
      </div>

      {/* 수집 이력 섹션 */}
      <div className="mb-12">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          수집 이력
        </h2>
        {cronLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground bg-card rounded-lg border border-border">
            <p>아직 수집 이력이 없습니다.</p>
          </div>
        ) : (
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">상태</TableHead>
                  <TableHead>실행 시간</TableHead>
                  <TableHead>결과</TableHead>
                  <TableHead>처리 건수</TableHead>
                  <TableHead>소요 시간</TableHead>
                  <TableHead>에러</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cronLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {log.status === "success" ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        {log.executedAt.toLocaleString("ko-KR", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </div>
                    </TableCell>
                    <TableCell>{log.message || "-"}</TableCell>
                    <TableCell>{log.processedCount}개</TableCell>
                    <TableCell>
                      {log.duration
                        ? `${(log.duration / 1000).toFixed(1)}초`
                        : "-"}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-red-500">
                      {log.errorDetail || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* 뉴스 목록 섹션 */}
      <h2 className="text-lg font-semibold text-foreground mb-4">
        수집된 뉴스
      </h2>
      {news.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>아직 수집된 뉴스가 없습니다.</p>
          <p className="text-sm mt-2">
            Cron 작업이 매일 오전 9시에 자동으로 실행됩니다.
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[400px]">제목</TableHead>
                <TableHead>표시 날짜</TableHead>
                <TableHead>AI 요약</TableHead>
                <TableHead>관련 강의</TableHead>
                <TableHead className="text-right">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {news.map((n) => {
                const relatedCourses = n.relatedCourses as Array<{
                  courseId: string;
                  title: string;
                }>;
                return (
                  <TableRow key={n.id}>
                    <TableCell className="font-medium">
                      <a
                        href={n.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {n.title.length > 50
                          ? n.title.substring(0, 50) + "..."
                          : n.title}
                      </a>
                    </TableCell>
                    <TableCell>
                      {n.displayDate.toLocaleDateString("ko-KR")}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {n.aiSummary.length > 50
                        ? n.aiSummary.substring(0, 50) + "..."
                        : n.aiSummary}
                    </TableCell>
                    <TableCell>{relatedCourses.length}개</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Link href={`/admin/news/${n.id}/edit`}>
                          <Button variant="outline" size="sm">
                            수정
                          </Button>
                        </Link>
                        <NewsDeleteButton newsId={n.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </main>
  );
}
