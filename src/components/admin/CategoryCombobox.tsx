"use client";

import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Category } from "@/types";

interface CategoryComboboxProps {
  categories: Category[];
  value: string;
  onChange: (value: string) => void;
  onCategoriesChange?: (categories: Category[]) => void;
}

export default function CategoryCombobox({
  categories,
  value,
  onChange,
  onCategoriesChange,
}: CategoryComboboxProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // 새 카테고리 생성 상태
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategorySlug, setNewCategorySlug] = useState("");
  const [newCategoryDesc, setNewCategoryDesc] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const selectedCategory = categories.find((cat) => cat.id === value);

  // 새 카테고리 생성
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim() || !newCategorySlug.trim()) {
      alert("카테고리 이름과 슬러그는 필수입니다.");
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          slug: newCategorySlug.trim(),
          description: newCategoryDesc.trim() || null,
          order: categories.length + 1,
        }),
      });

      if (response.ok) {
        const newCategory = await response.json();

        // 부모 컴포넌트에 업데이트된 카테고리 목록 전달
        if (onCategoriesChange) {
          onCategoriesChange([...categories, newCategory]);
        }

        // 새로 생성된 카테고리 선택
        onChange(newCategory.id);

        // 상태 초기화
        setDialogOpen(false);
        setNewCategoryName("");
        setNewCategorySlug("");
        setNewCategoryDesc("");
      } else {
        const error = await response.json();
        alert(`카테고리 생성 실패: ${error.error || "알 수 없는 오류"}`);
      }
    } catch {
      alert("카테고리 생성 중 오류가 발생했습니다.");
    } finally {
      setIsCreating(false);
    }
  };

  // 카테고리 이름에서 슬러그 자동 생성
  const handleNameChange = (name: string) => {
    setNewCategoryName(name);
    // 간단한 슬러그 생성: 공백을 하이픈으로, 특수문자 제거
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    setNewCategorySlug(slug);
  };

  // Hydration 에러 방지: 클라이언트 마운트 전에는 Popover 없이 렌더링
  if (!mounted) {
    return (
      <Button
        variant="outline"
        className="w-full justify-between"
        disabled
      >
        {selectedCategory ? selectedCategory.name : "대주제 검색..."}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    );
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedCategory ? selectedCategory.name : "대주제 검색..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="카테고리 검색..." />
            <CommandList>
              <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
              <CommandGroup>
                {categories.map((category) => (
                  <CommandItem
                    key={category.id}
                    value={category.name}
                    onSelect={() => {
                      onChange(category.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === category.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{category.name}</span>
                      {category.description && (
                        <span className="text-sm text-muted-foreground">
                          {category.description}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setOpen(false);
                    setDialogOpen(true);
                  }}
                  className="cursor-pointer"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  <span>새 카테고리 추가</span>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* 새 카테고리 생성 Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 카테고리 생성</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>카테고리 이름 *</Label>
              <Input
                value={newCategoryName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="예: HTTP/REST API 설계"
              />
            </div>
            <div className="space-y-2">
              <Label>슬러그 *</Label>
              <Input
                value={newCategorySlug}
                onChange={(e) => setNewCategorySlug(e.target.value)}
                placeholder="예: http-rest-api"
              />
              <p className="text-xs text-muted-foreground">
                URL에 사용될 영문 식별자 (소문자, 하이픈만 사용)
              </p>
            </div>
            <div className="space-y-2">
              <Label>설명 (선택)</Label>
              <Input
                value={newCategoryDesc}
                onChange={(e) => setNewCategoryDesc(e.target.value)}
                placeholder="예: RESTful API, HTTP 프로토콜"
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
                onClick={handleCreateCategory}
                disabled={isCreating || !newCategoryName.trim() || !newCategorySlug.trim()}
              >
                {isCreating ? "생성 중..." : "생성"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
