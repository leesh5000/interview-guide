"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";

export default function ManualNewsCollectButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleCollect = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/cron/daily-news", {
        method: "POST",
      });

      const data = await res.json();

      if (res.ok) {
        setResult(`✓ ${data.processed || 0}개 뉴스 수집 완료`);
        // 페이지 새로고침
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setResult(`✗ ${data.error || "수집 실패"}`);
      }
    } catch (error) {
      setResult("✗ 요청 실패");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        onClick={handleCollect}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            수집 중...
          </>
        ) : (
          <>
            <RefreshCw className="w-4 h-4 mr-2" />
            수동 수집 실행
          </>
        )}
      </Button>
      {result && (
        <span className={`text-sm ${result.startsWith("✓") ? "text-green-600" : "text-red-600"}`}>
          {result}
        </span>
      )}
    </div>
  );
}
