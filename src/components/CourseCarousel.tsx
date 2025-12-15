"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";

interface Course {
  id: string;
  title: string;
  affiliateUrl: string;
  thumbnailUrl: string | null;
}

interface CourseCarouselProps {
  courses: Course[];
  intervalMs?: number;
}

export function CourseCarousel({ courses, intervalMs = 3000 }: CourseCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!scrollRef.current || courses.length <= 1 || isPaused) return;

    const container = scrollRef.current;
    const cardWidth = 256 + 16; // w-64 (256px) + gap-4 (16px)

    const interval = setInterval(() => {
      const maxScroll = container.scrollWidth - container.clientWidth;
      const nextScroll = container.scrollLeft + cardWidth;

      if (nextScroll >= maxScroll) {
        container.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        container.scrollTo({ left: nextScroll, behavior: "smooth" });
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [courses.length, intervalMs, isPaused]);

  return (
    <div
      ref={scrollRef}
      className="overflow-x-auto scrollbar-hide -mx-4"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
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
  );
}
