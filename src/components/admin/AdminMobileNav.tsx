"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, LogOut, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminMobileNavProps {
  pendingCount: number;
}

export default function AdminMobileNav({ pendingCount }: AdminMobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
    setIsOpen(false);
  };

  const navItems = [
    { href: "/admin", label: "대시보드" },
    { href: "/admin/categories", label: "카테고리 관리" },
    { href: "/admin/target-roles", label: "대상 독자 관리" },
    { href: "/admin/questions", label: "게시물 관리" },
    { href: "/admin/courses", label: "강의 관리" },
    { href: "/admin/suggestions", label: "수정 제안", badge: pendingCount },
    { href: "/admin/questions/new", label: "새 게시물" },
  ];

  return (
    <div className="lg:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        {pendingCount > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
            {pendingCount > 9 ? "9+" : pendingCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-background border-b border-border shadow-lg">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between py-2 px-3 rounded-md text-sm text-foreground hover:bg-muted transition-colors"
              >
                {item.label}
                {item.badge ? (
                  <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                ) : null}
              </Link>
            ))}
            <hr className="border-border my-2" />
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 py-2 px-3 rounded-md text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              사이트 보기
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 py-2 px-3 rounded-md text-sm text-red-500 hover:bg-muted transition-colors w-full text-left"
            >
              <LogOut className="h-4 w-4" />
              로그아웃
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
