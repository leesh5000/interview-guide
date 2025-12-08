"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Category, RelatedCourse, TargetRole } from "@/types";
import { useFormPersistence } from "@/hooks/useFormPersistence";
import MarkdownEditor from "./MarkdownEditor";
import CategoryCombobox from "./CategoryCombobox";

interface QuestionFormProps {
  categories: Category[];
  targetRoles: TargetRole[];
  initialData?: {
    id: string;
    categoryId: string;
    questionTitle: string;
    questionBody: string;
    answerContent: string;
    targetRoles: string[];
    tags: string[];
    aiSummary: string | null;
    relatedCourses: RelatedCourse[];
    isPublished: boolean;
  };
}

export default function QuestionForm({
  categories,
  targetRoles,
  initialData,
}: QuestionFormProps) {
  const router = useRouter();
  const isEditing = !!initialData;

  // 폼 데이터 유지: 새 게시물은 "question_new", 수정은 "question_edit_{id}"
  const storageKey = isEditing ? `question_edit_${initialData.id}` : "question_new";

  const { formData, setFormData, clearPersistedData } = useFormPersistence({
    key: storageKey,
    initialData: {
      categoryId: initialData?.categoryId || "",
      questionTitle: initialData?.questionTitle || "",
      questionBody: initialData?.questionBody || "",
      answerContent: initialData?.answerContent || "",
      targetRoles: initialData?.targetRoles || [],
      tags: initialData?.tags || [],
      aiSummary: initialData?.aiSummary || "",
      relatedCourses: initialData?.relatedCourses || [],
    },
  });

  const [newTag, setNewTag] = useState("");
  const [newCourse, setNewCourse] = useState({ title: "", affiliateUrl: "", thumbnailUrl: "" });
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const handleSubmit = async (isPublished: boolean) => {
    if (!formData.categoryId || !formData.questionTitle) {
      alert("대주제와 질문 제목은 필수입니다.");
      return;
    }

    setLoading(true);

    try {
      const data = {
        categoryId: formData.categoryId,
        questionTitle: formData.questionTitle,
        questionBody: formData.questionBody,
        answerContent: formData.answerContent,
        targetRoles: formData.targetRoles,
        tags: formData.tags,
        aiSummary: formData.aiSummary || null,
        relatedCourses: formData.relatedCourses,
        isPublished,
      };

      const url = isEditing
        ? `/api/questions/${initialData.id}`
        : "/api/questions";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        clearPersistedData(); // 저장 성공 시 스토리지 데이터 삭제
        router.push("/admin/questions");
        router.refresh();
      } else {
        alert("저장에 실패했습니다.");
      }
    } catch {
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAiSummary = async () => {
    if (!formData.questionTitle || !formData.answerContent) {
      alert("질문 제목과 답변 내용을 먼저 입력해주세요.");
      return;
    }

    setAiLoading(true);

    try {
      const response = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: formData.questionTitle,
          answer: formData.answerContent,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setFormData((prev) => ({ ...prev, aiSummary: data.summary }));
      } else {
        alert("AI 요약 생성에 실패했습니다.");
      }
    } catch {
      alert("AI 요약 생성 중 오류가 발생했습니다.");
    } finally {
      setAiLoading(false);
    }
  };

  // 대상 역할 토글
  const toggleTargetRole = (role: string) => {
    setFormData((prev) => ({
      ...prev,
      targetRoles: prev.targetRoles.includes(role)
        ? prev.targetRoles.filter((r) => r !== role)
        : [...prev.targetRoles, role],
    }));
  };

  // 태그 추가
  const addTag = () => {
    const tag = newTag.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  // 강의 추가
  const addCourse = () => {
    if (newCourse.title && newCourse.affiliateUrl) {
      const courseToAdd = {
        title: newCourse.title,
        affiliateUrl: newCourse.affiliateUrl,
        ...(newCourse.thumbnailUrl && { thumbnailUrl: newCourse.thumbnailUrl }),
      };
      setFormData((prev) => ({
        ...prev,
        relatedCourses: [...prev.relatedCourses, courseToAdd],
      }));
      setNewCourse({ title: "", affiliateUrl: "", thumbnailUrl: "" });
    }
  };

  const removeCourse = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      relatedCourses: prev.relatedCourses.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="space-y-6">
      {/* 대주제 (카테고리) */}
      <div className="space-y-2">
        <Label>대주제 *</Label>
        <CategoryCombobox
          categories={categories}
          value={formData.categoryId}
          onChange={(value) =>
            setFormData((prev) => ({ ...prev, categoryId: value }))
          }
        />
      </div>

      {/* 질문 제목 */}
      <div className="space-y-2">
        <Label>질문 제목 *</Label>
        <Input
          value={formData.questionTitle}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, questionTitle: e.target.value }))
          }
          placeholder="예: 수천만 건 이상의 데이터가 쌓여 있는 테이블에서 쿼리 속도가 느려졌을 때, 어떤 순서로 원인을 분석하고 해결하시겠습니까?"
        />
      </div>

      {/* 질문 본문 (마크다운) */}
      <div className="space-y-2">
        <Label>질문 본문 (질문 의도, 평가 포인트 등)</Label>
        <MarkdownEditor
          value={formData.questionBody}
          onChange={(value) =>
            setFormData((prev) => ({ ...prev, questionBody: value }))
          }
          height={200}
          placeholder="질문의 의도, 평가 포인트 등을 마크다운으로 작성하세요..."
        />
      </div>

      {/* 답변 내용 (마크다운) */}
      <div className="space-y-2">
        <Label>답변 내용</Label>
        <MarkdownEditor
          value={formData.answerContent}
          onChange={(value) =>
            setFormData((prev) => ({ ...prev, answerContent: value }))
          }
          height={400}
          placeholder="모범 답안을 마크다운으로 작성하세요..."
        />
      </div>

      {/* 대상 */}
      <div className="space-y-2">
        <Label>대상</Label>
        <div className="flex flex-wrap gap-2">
          {targetRoles.map((role) => (
            <Badge
              key={role.id}
              variant={formData.targetRoles.includes(role.name) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleTargetRole(role.name)}
            >
              {role.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* 태그 */}
      <div className="space-y-2">
        <Label>태그</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {formData.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1 hover:text-red-500"
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="태그 입력 후 Enter"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
          />
          <Button type="button" variant="outline" onClick={addTag}>
            추가
          </Button>
        </div>
      </div>

      {/* AI 요약 */}
      <Card className="border-border bg-secondary/50">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-base">AI 요약</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGenerateAiSummary}
              disabled={aiLoading}
            >
              {aiLoading ? "생성 중..." : "AI 요약 생성"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.aiSummary}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, aiSummary: e.target.value }))
            }
            placeholder="AI 요약이 여기에 표시됩니다. 직접 수정할 수도 있습니다."
            rows={3}
          />
        </CardContent>
      </Card>

      {/* 추천 강의 */}
      <Card className="border-border bg-secondary/50">
        <CardHeader>
          <CardTitle className="text-base">추천 강의</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.relatedCourses.length > 0 && (
            <ul className="space-y-2">
              {formData.relatedCourses.map((course, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between bg-card p-3 rounded-md border border-border"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{course.title}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {course.affiliateUrl}
                    </p>
                    {course.thumbnailUrl && (
                      <p className="text-xs text-muted-foreground truncate">
                        썸네일: {course.thumbnailUrl}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCourse(index)}
                  >
                    삭제
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="강의명"
                value={newCourse.title}
                onChange={(e) =>
                  setNewCourse((prev) => ({ ...prev, title: e.target.value }))
                }
              />
              <Input
                placeholder="인프런 제휴 링크"
                value={newCourse.affiliateUrl}
                onChange={(e) =>
                  setNewCourse((prev) => ({
                    ...prev,
                    affiliateUrl: e.target.value,
                  }))
                }
              />
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="썸네일 URL (선택사항, 비워두면 자동 추출)"
                value={newCourse.thumbnailUrl}
                onChange={(e) =>
                  setNewCourse((prev) => ({
                    ...prev,
                    thumbnailUrl: e.target.value,
                  }))
                }
              />
              <Button type="button" variant="outline" onClick={addCourse}>
                추가
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 저장 버튼 */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSubmit(false)}
          disabled={loading}
        >
          임시저장
        </Button>
        <Button
          type="button"
          onClick={() => handleSubmit(true)}
          disabled={loading}
        >
          {loading ? "저장 중..." : "발행"}
        </Button>
      </div>
    </div>
  );
}
