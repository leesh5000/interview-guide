"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { ko } from "date-fns/locale";
import { format } from "date-fns";

interface NewsDatePickerProps {
  selectedDate?: string;
  availableDates: string[];
}

export function NewsDatePicker({
  selectedDate,
  availableDates,
}: NewsDatePickerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentDate = selectedDate ? new Date(selectedDate + "T00:00:00") : undefined;

  // 뉴스가 있는 날짜들
  const availableDateSet = new Set(availableDates);

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      const dateStr = format(date, "yyyy-MM-dd");
      router.push(`/news?date=${dateStr}`);
    }
    setOpen(false);
  };

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    });
  };

  // 뉴스가 있는 날짜에 점 표시를 위한 modifiers
  const hasNewsModifier = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return availableDateSet.has(dateStr);
  };

  if (!mounted) {
    return (
      <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
        <CalendarIcon className="mr-2 h-4 w-4" />
        날짜를 선택하세요
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-[280px] justify-start text-left font-normal"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? formatDisplayDate(selectedDate) : "날짜를 선택하세요"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={currentDate}
          onSelect={handleSelect}
          locale={ko}
          modifiers={{
            hasNews: hasNewsModifier,
          }}
          modifiersClassNames={{
            hasNews: "has-news-dot",
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
