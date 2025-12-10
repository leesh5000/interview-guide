"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TargetRole } from "@/types";

interface TargetRoleSelectorProps {
  targetRoles: TargetRole[];
  selectedRoles: string[];
  onToggle: (role: string) => void;
  onTargetRolesChange?: (targetRoles: TargetRole[]) => void;
}

export default function TargetRoleSelector({
  targetRoles,
  selectedRoles,
  onToggle,
  onTargetRolesChange,
}: TargetRoleSelectorProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) {
      alert("대상 이름은 필수입니다.");
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch("/api/target-roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRoleName.trim(),
          description: newRoleDesc.trim() || null,
          order: targetRoles.length + 1,
        }),
      });

      if (response.ok) {
        const newRole = await response.json();

        // 부모 컴포넌트에 업데이트된 목록 전달
        if (onTargetRolesChange) {
          onTargetRolesChange([...targetRoles, newRole]);
        }

        // 새로 생성된 대상 자동 선택
        onToggle(newRole.name);

        // 상태 초기화
        setDialogOpen(false);
        setNewRoleName("");
        setNewRoleDesc("");
      } else {
        const error = await response.json();
        alert(`대상 생성 실패: ${error.error || "알 수 없는 오류"}`);
      }
    } catch {
      alert("대상 생성 중 오류가 발생했습니다.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {targetRoles.map((role) => (
        <Badge
          key={role.id}
          variant={selectedRoles.includes(role.name) ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => onToggle(role.name)}
        >
          {role.name}
        </Badge>
      ))}

      {/* 새 대상 추가 버튼 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
            <Plus className="w-3 h-3 mr-1" />
            추가
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 대상 추가</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>대상 이름 *</Label>
              <Input
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="예: DevOps 엔지니어"
              />
            </div>
            <div className="space-y-2">
              <Label>설명 (선택)</Label>
              <Input
                value={newRoleDesc}
                onChange={(e) => setNewRoleDesc(e.target.value)}
                placeholder="예: CI/CD, 인프라 관리"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                취소
              </Button>
              <Button
                onClick={handleCreateRole}
                disabled={isCreating || !newRoleName.trim()}
              >
                {isCreating ? "생성 중..." : "생성"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
