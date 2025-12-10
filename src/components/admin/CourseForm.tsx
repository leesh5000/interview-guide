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

interface Course {
  id: string;
  title: string;
  affiliateUrl: string;
  thumbnailUrl: string | null;
  description: string | null;
}

interface CourseFormProps {
  course?: Course;
  trigger: React.ReactNode;
}

export default function CourseForm({ course, trigger }: CourseFormProps) {
  const router = useRouter();
  const isEditing = !!course;

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const [formData, setFormData] = useState({
    title: course?.title || "",
    affiliateUrl: course?.affiliateUrl || "",
    thumbnailUrl: course?.thumbnailUrl || "",
    description: course?.description || "",
  });

  // 인프런 링크에서 강의 정보 자동 추출
  const extractInfLearnUrl = (text: string): string | null => {
    const urlMatch = text.match(/https?:\/\/inf\.run\/[a-zA-Z0-9]+/);
    return urlMatch ? urlMatch[0] : null;
  };

  const handleUrlChange = async (text: string) => {
    setFormData((prev) => ({ ...prev, affiliateUrl: text }));

    const inflearnUrl = extractInfLearnUrl(text);
    if (!inflearnUrl || isEditing) return;

    setFetching(true);

    try {
      const response = await fetch(`/api/og-image?url=${encodeURIComponent(inflearnUrl)}`);
      if (response.ok) {
        const data = await response.json();
        setFormData((prev) => ({
          ...prev,
          affiliateUrl: inflearnUrl,
          title: data.ogTitle || prev.title,
          thumbnailUrl: data.ogImage || prev.thumbnailUrl,
        }));
      }
    } catch {
      // 실패해도 URL은 유지
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.affiliateUrl) {
      alert("제목과 제휴 링크는 필수입니다.");
      return;
    }

    setLoading(true);

    try {
      const url = isEditing
        ? `/api/courses/${course.id}`
        : "/api/courses";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setOpen(false);
        router.refresh();
        if (!isEditing) {
          setFormData({ title: "", affiliateUrl: "", thumbnailUrl: "", description: "" });
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
            {isEditing ? "강의 수정" : "새 강의 추가"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="affiliateUrl">제휴 링크 *</Label>
            <Textarea
              id="affiliateUrl"
              value={formData.affiliateUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="인프런 제휴 링크를 붙여넣으세요 (예: https://inf.run/xxxxx)"
              rows={2}
            />
            {fetching && (
              <p className="text-sm text-muted-foreground">강의 정보를 가져오는 중...</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">강의명 *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="예: 실전! 스프링 부트와 JPA 활용"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="thumbnailUrl">썸네일 URL</Label>
            <Input
              id="thumbnailUrl"
              value={formData.thumbnailUrl}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, thumbnailUrl: e.target.value }))
              }
              placeholder="자동으로 추출됩니다"
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
              placeholder="강의에 대한 간단한 설명 (선택)"
              rows={2}
            />
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
