import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import LogoutButton from "@/components/admin/LogoutButton";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authenticated = await isAuthenticated();

  return (
    <div className="min-h-screen bg-gray-50">
      {authenticated && (
        <header className="border-b bg-white">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-8">
              <Link href="/admin" className="text-xl font-bold text-gray-900">
                DevInterview Admin
              </Link>
              <nav className="flex gap-6">
                <Link
                  href="/admin"
                  className="text-gray-600 hover:text-gray-900"
                >
                  대시보드
                </Link>
                <Link
                  href="/admin/categories"
                  className="text-gray-600 hover:text-gray-900"
                >
                  카테고리 관리
                </Link>
                <Link
                  href="/admin/target-roles"
                  className="text-gray-600 hover:text-gray-900"
                >
                  대상 독자 관리
                </Link>
                <Link
                  href="/admin/questions"
                  className="text-gray-600 hover:text-gray-900"
                >
                  게시물 관리
                </Link>
                <Link
                  href="/admin/questions/new"
                  className="text-gray-600 hover:text-gray-900"
                >
                  새 게시물
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-600 hover:text-gray-900 text-sm">
                사이트 보기
              </Link>
              <LogoutButton />
            </div>
          </div>
        </header>
      )}
      {children}
    </div>
  );
}
