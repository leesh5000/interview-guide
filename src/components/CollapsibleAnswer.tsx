"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import MarkdownPreview from "@/components/MarkdownPreview";

interface CollapsibleAnswerProps {
  content: string;
}

export default function CollapsibleAnswer({ content }: CollapsibleAnswerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-6 bg-gray-50 dark:bg-[#141414] rounded-lg border border-emerald-300 dark:border-emerald-700">
      <div
        className="cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors p-4 rounded-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="text-lg font-semibold flex items-center justify-between text-emerald-600 dark:text-emerald-400">
          <span className="flex items-center gap-2">
            모범 답안
          </span>
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400 flex items-center gap-1">
            {isOpen ? (
              <>
                접기 <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                펼치기 <ChevronDown className="h-4 w-4" />
              </>
            )}
          </span>
        </div>
      </div>
      {isOpen && (
        <div className="border-t border-gray-200 dark:border-[#1a1a1a] p-6">
          <MarkdownPreview content={content} />
        </div>
      )}
    </div>
  );
}
