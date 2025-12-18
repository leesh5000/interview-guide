"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ReviewCountBadge from "@/components/ReviewCountBadge";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Question {
  id: string;
  questionTitle: string;
  category: Category;
  targetRoles: string[];
  tags: string[];
  viewCount: number;
  reviewCount: number;
}

interface QuestionListProps {
  initialQuestions: Question[];
  initialTotalCount: number;
  categorySlug?: string;
  roleFilter?: string;
}

const PAGE_SIZE_OPTIONS = [50, 100, 150] as const;
const DEFAULT_PAGE_SIZE = 50;

export default function QuestionList({
  initialQuestions,
  initialTotalCount,
  categorySlug,
  roleFilter,
}: QuestionListProps) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [totalCount] = useState(initialTotalCount);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(false);

  const hasMore = questions.length < totalCount;

  const buildApiUrl = useCallback(
    (take: number, skip: number) => {
      const params = new URLSearchParams();
      params.set("published", "true");
      params.set("take", take.toString());
      params.set("skip", skip.toString());
      if (categorySlug) params.set("category", categorySlug);
      if (roleFilter) params.set("role", roleFilter);
      return `/api/questions?${params.toString()}`;
    },
    [categorySlug, roleFilter]
  );

  const handlePageSizeChange = async (newSize: number) => {
    if (newSize === pageSize) return;

    setIsLoading(true);
    setPageSize(newSize);

    try {
      const response = await fetch(buildApiUrl(newSize, 0));
      const data = await response.json();
      setQuestions(data.questions);
    } catch (error) {
      console.error("Failed to fetch questions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);

    try {
      const response = await fetch(buildApiUrl(pageSize, questions.length));
      const data = await response.json();
      setQuestions((prev) => [...prev, ...data.questions]);
    } catch (error) {
      console.error("Failed to load more questions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Page Size Selector */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          총 <span className="font-medium text-foreground">{totalCount}</span>개 질문 중{" "}
          <span className="font-medium text-foreground">{questions.length}</span>개 표시
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">페이지당:</span>
          {PAGE_SIZE_OPTIONS.map((size) => (
            <Button
              key={size}
              variant={pageSize === size ? "default" : "outline"}
              size="sm"
              onClick={() => handlePageSizeChange(size)}
              disabled={isLoading}
              className="min-w-[48px]"
            >
              {size}
            </Button>
          ))}
        </div>
      </div>

      {/* Questions List */}
      {questions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>아직 등록된 질문이 없습니다.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {questions.map((q) => (
            <Link key={q.id} href={`/questions/${q.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer bg-card border-border">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge
                      variant="secondary"
                      className="bg-secondary text-secondary-foreground"
                    >
                      {q.category.name}
                    </Badge>
                    {q.targetRoles.map((role) => (
                      <Badge
                        key={role}
                        variant="outline"
                        className="border-border text-muted-foreground"
                      >
                        {role}
                      </Badge>
                    ))}
                  </div>
                  <CardTitle className="text-lg text-foreground">
                    {q.questionTitle}
                  </CardTitle>
                  {q.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap mt-2">
                      {q.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span>조회수 {q.viewCount}</span>
                      <ReviewCountBadge count={q.reviewCount} />
                    </div>
                    <span className="inline-flex items-center gap-1">
                      자세히 보기
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center mt-8">
          <Button
            variant="outline"
            size="lg"
            onClick={handleLoadMore}
            disabled={isLoading}
            className="min-w-[200px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                불러오는 중...
              </>
            ) : (
              <>더보기 ({totalCount - questions.length}개 남음)</>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
