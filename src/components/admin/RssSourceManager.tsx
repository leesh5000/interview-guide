"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Loader2, RefreshCw, ExternalLink } from "lucide-react";

interface RssSource {
  id: string;
  key: string;
  name: string;
  url: string;
  sourceUrl: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function RssSourceManager() {
  const [sources, setSources] = useState<RssSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchSources = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/rss-sources");
      if (response.ok) {
        const data = await response.json();
        setSources(data);
      }
    } catch (error) {
      console.error("Failed to fetch RSS sources:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const toggleSource = async (id: string, currentEnabled: boolean) => {
    setUpdating(id);
    try {
      const response = await fetch(`/api/rss-sources/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isEnabled: !currentEnabled }),
      });

      if (response.ok) {
        const updated = await response.json();
        setSources((prev) =>
          prev.map((s) => (s.id === id ? updated : s))
        );
      }
    } catch (error) {
      console.error("Failed to toggle RSS source:", error);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          활성화된 소스에서만 뉴스를 수집합니다. (소스별 최대 10개)
        </p>
        <Button variant="outline" size="sm" onClick={fetchSources}>
          <RefreshCw className="w-4 h-4 mr-2" />
          새로고침
        </Button>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">활성화</TableHead>
              <TableHead>소스 이름</TableHead>
              <TableHead>피드 URL</TableHead>
              <TableHead>사이트</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sources.map((source) => (
              <TableRow key={source.id}>
                <TableCell>
                  <div className="flex items-center">
                    {updating === source.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Switch
                        checked={source.isEnabled}
                        onCheckedChange={() =>
                          toggleSource(source.id, source.isEnabled)
                        }
                      />
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{source.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate">
                  {source.url}
                </TableCell>
                <TableCell>
                  <a
                    href={source.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-blue-500 hover:underline"
                  >
                    {new URL(source.sourceUrl).hostname}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {sources.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>등록된 RSS 소스가 없습니다.</p>
        </div>
      )}
    </div>
  );
}
