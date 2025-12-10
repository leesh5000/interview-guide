"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Check, ChevronsUpDown, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Course {
  id: string;
  title: string;
  affiliateUrl: string;
  thumbnailUrl: string | null;
}

export interface RelatedCourse {
  title: string;
  affiliateUrl: string;
  thumbnailUrl?: string;
}

interface CourseSelectorProps {
  onSelect: (course: RelatedCourse) => void;
}

export default function CourseSelector({ onSelect }: CourseSelectorProps) {
  const [open, setOpen] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // 붙여넣기 입력
  const [pasteText, setPasteText] = useState("");
  const [fetching, setFetching] = useState(false);
  const [manualInput, setManualInput] = useState({
    title: "",
    affiliateUrl: "",
    thumbnailUrl: "",
  });

  // 강의 목록 조회
  const fetchCourses = useCallback(async (searchTerm: string = "") => {
    setLoading(true);
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
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // 검색어 변경 시 조회
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCourses(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, fetchCourses]);

  // 기존 강의 선택
  const handleSelectCourse = (course: Course) => {
    onSelect({
      title: course.title,
      affiliateUrl: course.affiliateUrl,
      ...(course.thumbnailUrl && { thumbnailUrl: course.thumbnailUrl }),
    });
    setOpen(false);
    setSearch("");
  };

  // 인프런 링크에서 강의 정보 자동 추출
  const extractInfLearnUrl = (text: string): string | null => {
    const urlMatch = text.match(/https?:\/\/inf\.run\/[a-zA-Z0-9]+/);
    return urlMatch ? urlMatch[0] : null;
  };

  // 붙여넣기 처리 - 자동으로 강의 추가
  const handlePaste = async (text: string) => {
    setPasteText(text);

    const inflearnUrl = extractInfLearnUrl(text);
    if (!inflearnUrl) return;

    setFetching(true);

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
        onSelect(courseData);
        setPasteText("");

        // 강의 목록 새로고침
        fetchCourses();
      }
    } catch {
      // 실패 시 수동 입력으로
      setManualInput((prev) => ({ ...prev, affiliateUrl: inflearnUrl }));
    } finally {
      setFetching(false);
    }
  };

  // 수동 입력으로 강의 추가
  const handleManualAdd = async () => {
    if (!manualInput.title.trim() || !manualInput.affiliateUrl.trim()) {
      return;
    }

    const courseData = {
      title: manualInput.title.trim(),
      affiliateUrl: manualInput.affiliateUrl.trim(),
      ...(manualInput.thumbnailUrl && { thumbnailUrl: manualInput.thumbnailUrl.trim() }),
    };

    // 강의 관리에 자동 등록
    await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(courseData),
    });

    // 질문에 강의 추가
    onSelect(courseData);
    setManualInput({ title: "", affiliateUrl: "", thumbnailUrl: "" });

    // 강의 목록 새로고침
    fetchCourses();
  };

  return (
    <div className="space-y-4">
      {/* 기존 강의 검색/선택 */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">등록된 강의에서 선택</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              <span className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                강의 검색...
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="start">
            <Command>
              <CommandInput
                placeholder="강의명으로 검색..."
                value={search}
                onValueChange={setSearch}
              />
              <CommandList>
                {loading ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
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
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              "opacity-0"
                            )}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="truncate font-medium">{course.title}</p>
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
      </div>

      {/* 붙여넣기로 새 강의 추가 */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">
          새 강의 추가 (링크 붙여넣기)
        </Label>
        <Textarea
          placeholder="인프런 제휴 링크를 붙여넣으면 자동으로 등록됩니다"
          value={pasteText}
          onChange={(e) => handlePaste(e.target.value)}
          rows={2}
          className="text-sm"
        />
        {fetching && (
          <p className="text-xs text-muted-foreground">강의 정보를 가져오는 중...</p>
        )}
      </div>

      {/* 수동 입력 */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">또는 직접 입력</Label>
        <div className="flex gap-2">
          <Input
            placeholder="강의명"
            value={manualInput.title}
            onChange={(e) =>
              setManualInput((prev) => ({ ...prev, title: e.target.value }))
            }
            className="text-sm"
          />
          <Input
            placeholder="제휴 링크"
            value={manualInput.affiliateUrl}
            onChange={(e) =>
              setManualInput((prev) => ({ ...prev, affiliateUrl: e.target.value }))
            }
            className="text-sm"
          />
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="썸네일 URL (선택)"
            value={manualInput.thumbnailUrl}
            onChange={(e) =>
              setManualInput((prev) => ({ ...prev, thumbnailUrl: e.target.value }))
            }
            className="text-sm"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleManualAdd}
            disabled={!manualInput.title.trim() || !manualInput.affiliateUrl.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
