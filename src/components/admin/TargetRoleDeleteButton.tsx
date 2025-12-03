"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface TargetRoleDeleteButtonProps {
  targetRoleId: string;
}

export default function TargetRoleDeleteButton({ targetRoleId }: TargetRoleDeleteButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("정말로 이 대상 역할을 삭제하시겠습니까?")) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/target-roles/${targetRoleId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "삭제에 실패했습니다.");
      }
    } catch {
      alert("삭제 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleDelete}
      disabled={loading}
    >
      {loading ? "삭제 중..." : "삭제"}
    </Button>
  );
}
