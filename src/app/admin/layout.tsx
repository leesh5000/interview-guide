import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LogoutButton from "@/components/admin/LogoutButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import AdminMobileNav from "@/components/admin/AdminMobileNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authenticated = await isAuthenticated();

  // 대기 중인 수정 제안 수 조회
  let pendingCount = 0;
  if (authenticated) {
    pendingCount = await prisma.suggestionRequest.count({
      where: { status: "PENDING" },
    });
  }

  return (
    <div className="min-h-screen bg-background transition-colors">
      {authenticated && (
        <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-4 lg:gap-8">
              <Link href="/admin" className="text-lg font-semibold text-foreground">
                DevInterview Admin
              </Link>
              {/* Desktop Nav */}
              <nav className="hidden lg:flex gap-6">
                <Link
                  href="/admin"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  대시보드
                </Link>
                <Link
                  href="/admin/categories"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  카테고리 관리
                </Link>
                <Link
                  href="/admin/target-roles"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  대상 독자 관리
                </Link>
                <Link
                  href="/admin/questions"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  게시물 관리
                </Link>
                <Link
                  href="/admin/courses"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  강의 관리
                </Link>
                <Link
                  href="/admin/suggestions"
                  className="relative text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  수정 제안
                  {pendingCount > 0 && (
                    <span className="absolute -top-2 -right-4 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {pendingCount > 99 ? "99+" : pendingCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/admin/questions/new"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  새 게시물
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                사이트 보기
              </Link>
              <ThemeToggle />
              <div className="hidden sm:block">
                <LogoutButton />
              </div>
              {/* Mobile Nav */}
              <AdminMobileNav pendingCount={pendingCount} />
            </div>
          </div>
        </header>
      )}
      {children}
    </div>
  );
}
