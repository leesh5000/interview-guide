"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import MarkdownPreview from "@/components/MarkdownPreview";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: number;
  placeholder?: string;
}

export default function MarkdownEditor({
  value,
  onChange,
  height = 300,
  placeholder,
}: MarkdownEditorProps) {
  const { resolvedTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");

  return (
    <div>
      {/* Tab Buttons */}
      <div className="flex border-b border-gray-200 dark:border-[#1a1a1a] mb-0">
        <button
          type="button"
          onClick={() => setActiveTab("write")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "write"
              ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          작성
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("preview")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "preview"
              ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          미리보기
        </button>
      </div>

      {/* Editor / Preview Content */}
      {activeTab === "write" ? (
        <div data-color-mode={resolvedTheme === "dark" ? "dark" : "light"}>
          <MDEditor
            value={value}
            onChange={(val) => onChange(val || "")}
            height={height}
            preview="edit"
            textareaProps={{
              placeholder,
            }}
          />
        </div>
      ) : (
        <div
          className="border border-gray-200 dark:border-[#1a1a1a] rounded-b-md bg-gray-50 dark:bg-[#141414] p-6 overflow-auto"
          style={{ minHeight: height }}
        >
          {value ? (
            <MarkdownPreview content={value} />
          ) : (
            <p className="text-gray-400 dark:text-gray-500 italic">
              미리보기할 내용이 없습니다.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
