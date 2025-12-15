"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Course {
  id: string;
  title: string;
  affiliateUrl: string;
  thumbnailUrl: string | null;
}

interface CourseCarouselProps {
  courses: Course[];
  intervalMs?: number;
  initialDelayMs?: number;
}

export function CourseCarousel({ courses, intervalMs = 3000, initialDelayMs = 0 }: CourseCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = () => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 1);
  };

  const scrollLeft = () => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    // 화면에 보이는 너비만큼 스크롤
    const scrollAmount = container.clientWidth;
    const nextScroll = Math.max(0, container.scrollLeft - scrollAmount);
    container.scrollTo({ left: nextScroll, behavior: "smooth" });
  };

  const scrollRight = () => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    // 화면에 보이는 너비만큼 스크롤
    const scrollAmount = container.clientWidth;
    const maxScroll = container.scrollWidth - container.clientWidth;
    const nextScroll = Math.min(maxScroll, container.scrollLeft + scrollAmount);
    container.scrollTo({ left: nextScroll, behavior: "smooth" });
  };

  useEffect(() => {
    updateScrollButtons();
    const container = scrollRef.current;
    if (container) {
      container.addEventListener("scroll", updateScrollButtons);
      window.addEventListener("resize", updateScrollButtons);
      return () => {
        container.removeEventListener("scroll", updateScrollButtons);
        window.removeEventListener("resize", updateScrollButtons);
      };
    }
  }, [courses.length]);

  useEffect(() => {
    if (!scrollRef.current || courses.length <= 1 || isPaused) return;

    const container = scrollRef.current;
    let interval: NodeJS.Timeout;

    const startRotation = () => {
      interval = setInterval(() => {
        // 화면에 보이는 너비만큼 스크롤
        const scrollAmount = container.clientWidth;
        const maxScroll = container.scrollWidth - container.clientWidth;
        const nextScroll = container.scrollLeft + scrollAmount;

        if (nextScroll >= maxScroll) {
          container.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          container.scrollTo({ left: nextScroll, behavior: "smooth" });
        }
      }, intervalMs);
    };

    // 초기 딜레이 후 로테이션 시작
    const delayTimeout = setTimeout(startRotation, initialDelayMs);

    return () => {
      clearTimeout(delayTimeout);
      clearInterval(interval);
    };
  }, [courses.length, intervalMs, initialDelayMs, isPaused]);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Left Arrow */}
      {canScrollLeft && (
        <Button
          variant="outline"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm shadow-md"
          onClick={scrollLeft}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      {/* Right Arrow */}
      {canScrollRight && (
        <Button
          variant="outline"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm shadow-md"
          onClick={scrollRight}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}

      <div
        ref={scrollRef}
        className="overflow-x-auto scrollbar-hide -mx-4"
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        <div className="flex gap-4 px-4 pb-4 min-w-max justify-center">
          {courses.map((course) => (
            <a
              key={course.id}
              href={course.affiliateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block flex-shrink-0"
            >
              <Card className="w-64 hover:border-foreground/20 transition-colors cursor-pointer overflow-hidden">
                {course.thumbnailUrl ? (
                  <div className="relative w-full h-36 bg-muted">
                    <Image
                      src={course.thumbnailUrl}
                      alt={course.title}
                      fill
                      className="object-cover"
                      sizes="256px"
                    />
                  </div>
                ) : (
                  <div className="w-full h-36 bg-muted flex items-center justify-center">
                    <span className="text-muted-foreground text-sm">No Image</span>
                  </div>
                )}
                <CardContent className="p-4">
                  <p className="font-medium text-foreground line-clamp-2 text-sm">
                    {course.title}
                  </p>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
