"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Category, TargetRole } from "@/types";
import { parseQuestions, ParsedQuestion, RelatedCourse } from "@/lib/bulk-parser";
import CategoryCombobox from "./CategoryCombobox";
import TargetRoleSelector from "./TargetRoleSelector";
import { ChevronDown, ChevronRight, Plus, X, Search, ChevronsUpDown } from "lucide-react";

interface Course {
  id: string;
  title: string;
  affiliateUrl: string;
  thumbnailUrl: string | null;
}

interface BulkQuestionFormProps {
  categories: Category[];
  targetRoles: TargetRole[];
}

interface QuestionWithMapping extends ParsedQuestion {
  index: number;
  isExpanded: boolean;
}

export default function BulkQuestionForm({
  categories: initialCategories,
  targetRoles: initialTargetRoles,
}: BulkQuestionFormProps) {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [targetRoles, setTargetRoles] = useState<TargetRole[]>(initialTargetRoles);
  const [rawText, setRawText] = useState("");
  const [parsedQuestions, setParsedQuestions] = useState<QuestionWithMapping[]>(
    []
  );
  const [globalTargetRoles, setGlobalTargetRoles] = useState<string[]>([]);
  const [globalCategoryId, setGlobalCategoryId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parseError, setParseError] = useState("");

  // 텍스트 파싱
  const handleParse = useCallback(() => {
    setParseError("");

    if (!rawText.trim()) {
      setParseError("텍스트를 입력해주세요.");
      return;
    }

    const parsed = parseQuestions(rawText);

    if (parsed.length === 0) {
      setParseError("파싱된 질문이 없습니다. 형식을 확인해주세요.");
      return;
    }

    // 인덱스와 카테고리 매핑 초기화
    const questionsWithMapping = parsed.map((q, index) => {
      // 카테고리명으로 기존 카테고리 찾기
      const matchedCategory = categories.find(
        (c) =>
          c.name.toLowerCase().includes(q.categoryName.toLowerCase()) ||
          q.categoryName.toLowerCase().includes(c.name.toLowerCase())
      );

      return {
        ...q,
        index,
        categoryId: matchedCategory?.id || "",
        targetRoles: [...globalTargetRoles],
        isExpanded: false,
      };
    });

    setParsedQuestions(questionsWithMapping);
  }, [rawText, categories, globalTargetRoles]);

  // 전체 대상 일괄 선택 토글
  const toggleGlobalTargetRole = (role: string) => {
    setGlobalTargetRoles((prev) => {
      const newRoles = prev.includes(role)
        ? prev.filter((r) => r !== role)
        : [...prev, role];

      // 파싱된 질문들의 대상도 업데이트
      setParsedQuestions((questions) =>
        questions.map((q) => ({
          ...q,
          targetRoles: newRoles,
        }))
      );

      return newRoles;
    });
  };

  // 전체 카테고리 일괄 선택
  const handleGlobalCategoryChange = (categoryId: string) => {
    setGlobalCategoryId(categoryId);

    // 파싱된 질문들의 카테고리도 업데이트
    setParsedQuestions((questions) =>
      questions.map((q) => ({
        ...q,
        categoryId,
      }))
    );
  };

  // 개별 질문 카테고리 변경
  const updateQuestionCategory = (index: number, categoryId: string) => {
    setParsedQuestions((prev) =>
      prev.map((q) => (q.index === index ? { ...q, categoryId } : q))
    );
  };

  // 개별 질문 대상 토글
  const toggleQuestionTargetRole = (index: number, role: string) => {
    setParsedQuestions((prev) =>
      prev.map((q) =>
        q.index === index
          ? {
              ...q,
              targetRoles: q.targetRoles.includes(role)
                ? q.targetRoles.filter((r) => r !== role)
                : [...q.targetRoles, role],
            }
          : q
      )
    );
  };

  // 질문 펼치기/접기 토글
  const toggleQuestionExpand = (index: number) => {
    setParsedQuestions((prev) =>
      prev.map((q) =>
        q.index === index ? { ...q, isExpanded: !q.isExpanded } : q
      )
    );
  };

  // 태그 추가
  const addTag = (index: number, tag: string) => {
    const trimmedTag = tag.trim();
    if (!trimmedTag) return;

    setParsedQuestions((prev) =>
      prev.map((q) =>
        q.index === index && !q.tags.includes(trimmedTag)
          ? { ...q, tags: [...q.tags, trimmedTag] }
          : q
      )
    );
  };

  // 태그 삭제
  const removeTag = (index: number, tag: string) => {
    setParsedQuestions((prev) =>
      prev.map((q) =>
        q.index === index
          ? { ...q, tags: q.tags.filter((t) => t !== tag) }
          : q
      )
    );
  };

  // 태그 수정
  const updateTag = (index: number, oldTag: string, newTag: string) => {
    const trimmedTag = newTag.trim();
    if (!trimmedTag || trimmedTag === oldTag) return;

    setParsedQuestions((prev) =>
      prev.map((q) =>
        q.index === index
          ? {
              ...q,
              tags: q.tags.map((t) => (t === oldTag ? trimmedTag : t)),
            }
          : q
      )
    );
  };

  // 연관 강의 추가
  const addRelatedCourse = (index: number, course: RelatedCourse) => {
    setParsedQuestions((prev) =>
      prev.map((q) =>
        q.index === index
          ? { ...q, relatedCourses: [...q.relatedCourses, course] }
          : q
      )
    );
  };

  // 연관 강의 삭제
  const removeRelatedCourse = (questionIndex: number, courseIndex: number) => {
    setParsedQuestions((prev) =>
      prev.map((q) =>
        q.index === questionIndex
          ? {
              ...q,
              relatedCourses: q.relatedCourses.filter(
                (_, i) => i !== courseIndex
              ),
            }
          : q
      )
    );
  };

  // 일괄 등록
  const handleSubmit = async () => {
    // 유효성 검사
    const invalidQuestions = parsedQuestions.filter((q) => !q.categoryId);
    if (invalidQuestions.length > 0) {
      alert(
        `카테고리가 선택되지 않은 질문이 ${invalidQuestions.length}개 있습니다.`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/questions/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questions: parsedQuestions.map((q) => ({
            categoryId: q.categoryId,
            questionTitle: q.questionTitle,
            questionBody: q.questionBody,
            answerContent: q.answerContent,
            followUpQuestions: q.followUpQuestions,
            tags: q.tags,
            targetRoles: q.targetRoles,
            relatedCourses: q.relatedCourses,
          })),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`${result.created}개의 질문이 등록되었습니다.`);
        router.push("/admin/questions");
        router.refresh();
      } else {
        const error = await response.json();
        alert(`등록 실패: ${error.error}`);
      }
    } catch {
      alert("등록 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 텍스트 입력 영역 */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">텍스트 입력</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={`면접 질문 텍스트를 붙여넣기 하세요.

형식 예시:
**카테고리: HTTP/REST API 설계**
**태그: rest-api, api-design**

**Q. RESTful API 설계 시 가장 중요하게 보는 기준은 무엇인가요?**

* **질문 의도:** ...
* **평가 포인트:** ...

**A. 리소스 중심과 일관성이 핵심입니다**

**핵심 키워드:** 리소스 중심, 일관성

* "답변 내용..."

**꼬리 질문:**
* 꼬리 질문 1

---

(다음 질문...)`}
            rows={15}
            className="font-mono text-sm"
          />
          {parseError && <p className="text-sm text-red-500">{parseError}</p>}
          <div className="flex justify-end">
            <Button onClick={handleParse}>파싱하기</Button>
          </div>
        </CardContent>
      </Card>

      {/* 파싱 결과가 있을 때만 표시 */}
      {parsedQuestions.length > 0 && (
        <>
          {/* 전체 일괄 설정 */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">전체 일괄 설정</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 전체 카테고리 일괄 선택 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">전체 카테고리 일괄 선택</Label>
                <div className="max-w-[300px]">
                  <CategoryCombobox
                    categories={categories}
                    value={globalCategoryId}
                    onChange={handleGlobalCategoryChange}
                    onCategoriesChange={setCategories}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  선택하면 모든 질문의 카테고리가 일괄 변경됩니다.
                </p>
              </div>

              {/* 전체 대상 일괄 선택 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">전체 대상 일괄 선택</Label>
                <TargetRoleSelector
                  targetRoles={targetRoles}
                  selectedRoles={globalTargetRoles}
                  onToggle={toggleGlobalTargetRole}
                  onTargetRolesChange={setTargetRoles}
                />
                <p className="text-xs text-muted-foreground">
                  여기서 선택한 대상은 모든 질문에 일괄 적용됩니다. 개별 질문에서 수정할 수 있습니다.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 파싱 결과 미리보기 */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">
                파싱 결과 미리보기 ({parsedQuestions.length}개 질문)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {parsedQuestions.map((question) => (
                <QuestionPreviewCard
                  key={question.index}
                  question={question}
                  categories={categories}
                  targetRoles={targetRoles}
                  onCategoryChange={updateQuestionCategory}
                  onTargetRoleToggle={toggleQuestionTargetRole}
                  onToggleExpand={toggleQuestionExpand}
                  onAddTag={addTag}
                  onRemoveTag={removeTag}
                  onUpdateTag={updateTag}
                  onAddCourse={addRelatedCourse}
                  onRemoveCourse={removeRelatedCourse}
                  onCategoriesChange={setCategories}
                  onTargetRolesChange={setTargetRoles}
                />
              ))}
            </CardContent>
          </Card>

          {/* 등록 버튼 */}
          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={isSubmitting} size="lg">
              {isSubmitting
                ? "등록 중..."
                : `${parsedQuestions.length}개 질문 일괄 등록`}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

// 질문 미리보기 카드 컴포넌트
function QuestionPreviewCard({
  question,
  categories,
  targetRoles,
  onCategoryChange,
  onTargetRoleToggle,
  onToggleExpand,
  onAddTag,
  onRemoveTag,
  onUpdateTag,
  onAddCourse,
  onRemoveCourse,
  onCategoriesChange,
  onTargetRolesChange,
}: {
  question: QuestionWithMapping;
  categories: Category[];
  targetRoles: TargetRole[];
  onCategoryChange: (index: number, categoryId: string) => void;
  onTargetRoleToggle: (index: number, role: string) => void;
  onToggleExpand: (index: number) => void;
  onAddTag: (index: number, tag: string) => void;
  onRemoveTag: (index: number, tag: string) => void;
  onUpdateTag: (index: number, oldTag: string, newTag: string) => void;
  onAddCourse: (index: number, course: RelatedCourse) => void;
  onRemoveCourse: (questionIndex: number, courseIndex: number) => void;
  onCategoriesChange: (categories: Category[]) => void;
  onTargetRolesChange: (targetRoles: TargetRole[]) => void;
}) {
  const [newTag, setNewTag] = useState("");
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editingTagValue, setEditingTagValue] = useState("");
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newCourseUrl, setNewCourseUrl] = useState("");
  const [newCourseThumbnail, setNewCourseThumbnail] = useState("");
  const [coursePasteText, setCoursePasteText] = useState("");
  const [courseFetching, setCourseFetching] = useState(false);

  // 강의 검색 관련 상태
  const [courseSearchOpen, setCourseSearchOpen] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseSearch, setCourseSearch] = useState("");
  const [loadingCourses, setLoadingCourses] = useState(false);

  // 강의 목록 조회
  const fetchCourses = useCallback(async (searchTerm: string = "") => {
    setLoadingCourses(true);
    try {
      const params = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : "";
      const response = await fetch(`/api/courses${params}`);
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      }
    } catch {
      // 실패 시 빈 배열 유지
    } finally {
      setLoadingCourses(false);
    }
  }, []);

  useEffect(() => {
    if (courseSearchOpen) {
      fetchCourses();
    }
  }, [courseSearchOpen, fetchCourses]);

  // 검색어 변경 시 조회
  useEffect(() => {
    if (courseSearchOpen) {
      const timer = setTimeout(() => {
        fetchCourses(courseSearch);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [courseSearch, courseSearchOpen, fetchCourses]);

  // 기존 강의 선택
  const handleSelectCourse = (course: Course) => {
    onAddCourse(question.index, {
      title: course.title,
      affiliateUrl: course.affiliateUrl,
      ...(course.thumbnailUrl && { thumbnailUrl: course.thumbnailUrl }),
    });
    setCourseSearchOpen(false);
    setCourseSearch("");
  };

  // 인프런 링크에서 강의 정보 자동 추출
  const extractInfLearnUrl = (text: string): string | null => {
    const urlMatch = text.match(/https?:\/\/inf\.run\/[a-zA-Z0-9]+/);
    return urlMatch ? urlMatch[0] : null;
  };

  const handleCoursePaste = async (text: string) => {
    setCoursePasteText(text);

    const inflearnUrl = extractInfLearnUrl(text);
    if (!inflearnUrl) return;

    setCourseFetching(true);

    try {
      const response = await fetch(`/api/og-image?url=${encodeURIComponent(inflearnUrl)}`);
      if (response.ok) {
        const data = await response.json();
        const courseData = {
          title: data.ogTitle || inflearnUrl,
          affiliateUrl: inflearnUrl,
          ...(data.ogImage && { thumbnailUrl: data.ogImage }),
        };

        // 강의 관리에 자동 등록
        await fetch("/api/courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(courseData),
        });

        // 질문에 강의 추가
        onAddCourse(question.index, courseData);
        setCoursePasteText(""); // 성공 시 입력창 비우기
      }
    } catch {
      // 실패 시 수동 입력할 수 있도록 URL만 설정
      setNewCourseUrl(inflearnUrl);
    } finally {
      setCourseFetching(false);
    }
  };

  const handleAddCourse = async () => {
    if (!newCourseTitle.trim() || !newCourseUrl.trim()) {
      return;
    }
    const courseData = {
      title: newCourseTitle.trim(),
      affiliateUrl: newCourseUrl.trim(),
      ...(newCourseThumbnail && { thumbnailUrl: newCourseThumbnail.trim() }),
    };

    // 강의 관리에 자동 등록
    await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(courseData),
    });

    // 질문에 강의 추가
    onAddCourse(question.index, courseData);
    setNewCourseTitle("");
    setNewCourseUrl("");
    setNewCourseThumbnail("");
  };

  return (
    <Collapsible open={question.isExpanded}>
      <Card className="border-border bg-secondary/30">
        <CardContent className="pt-4 space-y-3">
          {/* 질문 번호 */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-base">#{question.index + 1}</span>
            <span className="text-sm text-muted-foreground">
              (원본 카테고리: {question.categoryName})
            </span>
          </div>

          {/* 카테고리 선택 */}
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground whitespace-nowrap w-[60px]">
              카테고리:
            </Label>
            <div className="w-[200px]">
              <CategoryCombobox
                categories={categories}
                value={question.categoryId || ""}
                onChange={(value) => onCategoryChange(question.index, value)}
                onCategoriesChange={onCategoriesChange}
              />
            </div>
            {!question.categoryId && (
              <span className="text-xs text-red-500 whitespace-nowrap">
                (선택 필요)
              </span>
            )}
          </div>

          {/* 개별 대상 선택 */}
          <div className="flex items-start gap-2">
            <Label className="text-sm text-muted-foreground whitespace-nowrap w-[60px] pt-0.5">
              대상:
            </Label>
            <TargetRoleSelector
              targetRoles={targetRoles}
              selectedRoles={question.targetRoles}
              onToggle={(role) => onTargetRoleToggle(question.index, role)}
              onTargetRolesChange={onTargetRolesChange}
            />
          </div>

          {/* 태그 */}
          <div className="flex items-start gap-2">
            <Label className="text-sm text-muted-foreground whitespace-nowrap w-[60px] pt-0.5">
              태그:
            </Label>
            <div className="flex flex-wrap gap-1 items-center">
              {question.tags.map((tag) => (
                editingTag === tag ? (
                  <Input
                    key={tag}
                    value={editingTagValue}
                    onChange={(e) => setEditingTagValue(e.target.value)}
                    className="h-6 w-24 text-xs px-2"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        onUpdateTag(question.index, tag, editingTagValue);
                        setEditingTag(null);
                      } else if (e.key === "Escape") {
                        setEditingTag(null);
                      }
                    }}
                    onBlur={() => {
                      onUpdateTag(question.index, tag, editingTagValue);
                      setEditingTag(null);
                    }}
                  />
                ) : (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-xs gap-1 cursor-pointer hover:bg-secondary/80"
                    onClick={() => {
                      setEditingTag(tag);
                      setEditingTagValue(tag);
                    }}
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveTag(question.index, tag);
                      }}
                      className="ml-0.5 hover:text-red-500"
                    >
                      ×
                    </button>
                  </Badge>
                )
              ))}
              <div className="flex items-center gap-1">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="태그 추가"
                  className="h-6 w-24 text-xs px-2"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      onAddTag(question.index, newTag);
                      setNewTag("");
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => {
                    onAddTag(question.index, newTag);
                    setNewTag("");
                  }}
                  disabled={!newTag.trim()}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>

          {/* 질문 제목 */}
          <div>
            <p className="font-medium">Q. {question.questionTitle}</p>
          </div>

          {/* 펼치기/접기 버튼 */}
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground"
              onClick={() => onToggleExpand(question.index)}
            >
              {question.isExpanded ? (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  접기
                </>
              ) : (
                <>
                  <ChevronRight className="w-4 h-4 mr-1" />
                  상세 보기 (모범 답안, 꼬리 질문, 연관 강의)
                </>
              )}
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="space-y-4">
            {/* 질문 본문 (질문 의도, 평가 포인트) */}
            {question.questionBody && (
              <div className="bg-card rounded-md p-3 border border-border">
                <Label className="text-sm font-medium mb-2 block">
                  질문 본문 (질문 의도, 평가 포인트)
                </Label>
                <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans">
                  {question.questionBody}
                </pre>
              </div>
            )}

            {/* 모범 답안 */}
            {question.answerContent && (
              <div className="bg-card rounded-md p-3 border border-border">
                <Label className="text-sm font-medium mb-2 block">
                  모범 답안
                </Label>
                <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans max-h-64 overflow-y-auto">
                  {question.answerContent}
                </pre>
              </div>
            )}

            {/* 꼬리 질문 */}
            {question.followUpQuestions && (
              <div className="bg-card rounded-md p-3 border border-border">
                <Label className="text-sm font-medium mb-2 block">
                  꼬리 질문
                </Label>
                <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans max-h-40 overflow-y-auto">
                  {question.followUpQuestions}
                </pre>
              </div>
            )}

            {/* 연관 강의 */}
            <div className="bg-card rounded-md p-3 border border-border space-y-3">
              <Label className="text-sm font-medium block">
                연관 강의
              </Label>

              {/* 등록된 강의 목록 */}
              {question.relatedCourses.length > 0 && (
                <ul className="space-y-2">
                  {question.relatedCourses.map((course, courseIndex) => (
                    <li
                      key={courseIndex}
                      className="flex items-center justify-between bg-secondary/50 p-2 rounded text-sm"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{course.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {course.affiliateUrl}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          onRemoveCourse(question.index, courseIndex)
                        }
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}

              {/* 등록된 강의에서 선택 */}
              <Popover open={courseSearchOpen} onOpenChange={setCourseSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-between text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <Search className="h-3 w-3" />
                      등록된 강의에서 선택
                    </span>
                    <ChevronsUpDown className="h-3 w-3 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[350px] p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="강의명으로 검색..."
                      value={courseSearch}
                      onValueChange={setCourseSearch}
                    />
                    <CommandList>
                      {loadingCourses ? (
                        <div className="p-2 text-center text-xs text-muted-foreground">
                          검색 중...
                        </div>
                      ) : (
                        <>
                          <CommandEmpty>등록된 강의가 없습니다.</CommandEmpty>
                          <CommandGroup>
                            {courses.map((course) => (
                              <CommandItem
                                key={course.id}
                                value={course.title}
                                onSelect={() => handleSelectCourse(course)}
                                className="cursor-pointer"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="truncate text-sm">{course.title}</p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {course.affiliateUrl}
                                  </p>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* 인프런 링크 붙여넣기 자동 추출 */}
              <div className="space-y-1">
                <Textarea
                  placeholder="인프런 제휴 링크를 붙여넣으면 자동으로 강의 정보를 가져옵니다 (예: https://inf.run/xxxxx)"
                  value={coursePasteText}
                  onChange={(e) => handleCoursePaste(e.target.value)}
                  rows={2}
                  className="text-sm"
                />
                {courseFetching && (
                  <p className="text-xs text-muted-foreground">강의 정보를 가져오는 중...</p>
                )}
              </div>

              {/* 강의 추가 입력 */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="강의명"
                    value={newCourseTitle}
                    onChange={(e) => setNewCourseTitle(e.target.value)}
                    className="text-sm"
                  />
                  <Input
                    placeholder="인프런 제휴 링크"
                    value={newCourseUrl}
                    onChange={(e) => setNewCourseUrl(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="썸네일 URL (선택사항)"
                    value={newCourseThumbnail}
                    onChange={(e) => setNewCourseThumbnail(e.target.value)}
                    className="text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddCourse}
                    disabled={!newCourseTitle.trim() || !newCourseUrl.trim()}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  );
}
