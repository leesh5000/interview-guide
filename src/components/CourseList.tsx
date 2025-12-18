"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Loader2, MessageCircleQuestion, Newspaper, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface CourseWithStats {
  id: string;
  title: string;
  affiliateUrl: string;
  thumbnailUrl: string | null;
  description: string | null;
  clickCount: number;
  relatedQuestionCount: number;
  relatedNewsCount: number;
}

interface CourseListProps {
  initialCourses: CourseWithStats[];
  initialTotalCount: number;
}

const PAGE_SIZE = 20;

export default function CourseList({
  initialCourses,
  initialTotalCount,
}: CourseListProps) {
  const [courses, setCourses] = useState(initialCourses);
  const [isLoading, setIsLoading] = useState(false);

  const hasMore = courses.length < initialTotalCount;

  const handleLoadMore = async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/courses?withStats=true&take=${PAGE_SIZE}&skip=${courses.length}`
      );
      const data = await response.json();
      setCourses((prev) => [...prev, ...data.courses]);
    } catch (error) {
      console.error("Failed to load more courses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4">
        총 <span className="font-medium text-foreground">{initialTotalCount}</span>개 강의
      </p>

      {courses.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>아직 등록된 강의가 없습니다.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Link key={course.id} href={`/courses/${course.id}`}>
              <Card className="h-full hover:border-foreground/20 transition-colors cursor-pointer overflow-hidden">
                {course.thumbnailUrl ? (
                  <div className="relative w-full h-40 bg-muted">
                    <Image
                      src={course.thumbnailUrl}
                      alt={course.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                ) : (
                  <div className="w-full h-40 bg-muted flex items-center justify-center">
                    <span className="text-muted-foreground">No Image</span>
                  </div>
                )}
                <CardHeader className="pb-2">
                  <CardTitle className="text-base line-clamp-2">
                    {course.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {course.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {course.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 text-sm mb-3">
                    {course.clickCount > 0 && (
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        {course.clickCount}명 클릭
                      </span>
                    )}
                    {course.relatedQuestionCount > 0 && (
                      <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium">
                        <MessageCircleQuestion className="h-4 w-4" />
                        질문 {course.relatedQuestionCount}
                      </span>
                    )}
                    {course.relatedNewsCount > 0 && (
                      <span className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-medium">
                        <Newspaper className="h-4 w-4" />
                        소식 {course.relatedNewsCount}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-end">
                    <span className="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
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
              <>더보기 ({initialTotalCount - courses.length}개 남음)</>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
