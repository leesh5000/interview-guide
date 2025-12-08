"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TargetRole } from "@/types";
import { useFormPersistence } from "@/hooks/useFormPersistence";

interface TargetRoleFormProps {
  targetRole?: TargetRole;
  trigger: React.ReactNode;
}

export default function TargetRoleForm({ targetRole, trigger }: TargetRoleFormProps) {
  const router = useRouter();
  const isEditing = !!targetRole;

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // 폼 데이터 유지: 새 대상 역할은 "target_role_new", 수정은 "target_role_edit_{id}"
  const storageKey = isEditing ? `target_role_edit_${targetRole.id}` : "target_role_new";

  const { formData, setFormData, clearPersistedData } = useFormPersistence({
    key: storageKey,
    initialData: {
      name: targetRole?.name || "",
      description: targetRole?.description || "",
      order: targetRole?.order ?? 0,
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      alert("이름은 필수입니다.");
      return;
    }

    setLoading(true);

    try {
      const url = isEditing
        ? `/api/target-roles/${targetRole.id}`
        : "/api/target-roles";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        clearPersistedData(); // 저장 성공 시 스토리지 데이터 삭제
        setOpen(false);
        router.refresh();
        if (!isEditing) {
          setFormData({ name: "", description: "", order: 0 });
        }
      } else {
        const data = await response.json();
        alert(data.error || "저장에 실패했습니다.");
      }
    } catch {
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "대상 역할 수정" : "새 대상 역할 추가"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">이름 *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="예: 백엔드 개발자"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="예: Spring, Node.js 등 서버 개발자"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="order">정렬 순서</Label>
            <Input
              id="order"
              type="number"
              value={formData.order}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  order: parseInt(e.target.value) || 0,
                }))
              }
            />
            <p className="text-sm text-gray-500">
              숫자가 작을수록 앞에 표시됩니다.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              취소
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "저장 중..." : isEditing ? "수정" : "추가"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
