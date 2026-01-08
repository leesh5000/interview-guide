import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, RssSource } from "@prisma/client";
import { RssItem, RSS_SOURCES } from "@/lib/rss-parser";
import { generateNewsSummary, matchRelatedCourses } from "@/lib/gemini";
import { isAuthenticated } from "@/lib/auth";

// Vercel Cron 인증 또는 관리자 인증
async function verifyAccess(request: NextRequest): Promise<boolean> {
  // Cron 시크릿 인증
  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${process.env.CRON_SECRET}`) {
    return true;
  }

  // 관리자 쿠키 인증 (수동 실행용)
  const authenticated = await isAuthenticated();
  return authenticated;
}

// 소스별 최대 뉴스 개수
const MAX_NEWS_PER_SOURCE = 10;

// RSS 피드 가져오기 (DB의 소스 정보 사용)
async function fetchRssFeedFromDb(source: RssSource): Promise<{
  title: string;
  items: RssItem[];
}> {
  const response = await fetch(source.url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; DevInterview/1.0)",
      Accept: "application/atom+xml, application/rss+xml, application/xml, text/xml",
    },
    redirect: "follow",
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`RSS fetch failed: ${response.status}`);
  }

  const xml = await response.text();
  return parseRssXml(xml, source.name);
}

// RSS/Atom XML 파싱
function parseRssXml(xml: string, sourceName: string): { title: string; items: RssItem[] } {
  const decodeHtml = (text?: string): string => {
    if (!text) return "";
    return text
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
      .replace(/<[^>]+>/g, "")
      .trim();
  };

  const getTagContent = (tag: string, text: string): string | undefined => {
    const match = text.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
    return match ? match[1].trim() : undefined;
  };

  const items: RssItem[] = [];

  // Atom 형식 (GeekNews)
  if (xml.includes("<feed") && xml.includes("<entry>")) {
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let entryMatch;
    while ((entryMatch = entryRegex.exec(xml)) !== null) {
      const entryContent = entryMatch[1];
      const linkMatch = entryContent.match(/<link[^>]*href=['"]([^'"]+)['"]/);
      const contentMatch = entryContent.match(/<content[^>]*>([\s\S]*?)<\/content>/);
      items.push({
        title: decodeHtml(getTagContent("title", entryContent) || ""),
        link: linkMatch ? linkMatch[1] : "",
        description: contentMatch ? decodeHtml(contentMatch[1]) : "",
        pubDate: getTagContent("published", entryContent) || getTagContent("updated", entryContent),
      });
    }
  } else {
    // RSS 형식 (Hacker News)
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let itemMatch;
    while ((itemMatch = itemRegex.exec(xml)) !== null) {
      const itemContent = itemMatch[1];
      items.push({
        title: decodeHtml(getTagContent("title", itemContent) || ""),
        link: getTagContent("link", itemContent) || "",
        description: decodeHtml(getTagContent("description", itemContent)),
        pubDate: getTagContent("pubDate", itemContent),
      });
    }
  }

  return { title: sourceName, items };
}

// 단일 소스에서 뉴스 수집
async function fetchNewsFromSource(
  source: RssSource,
  existingUrlSet: Set<string>,
  oneDayAgo: Date
): Promise<{ items: RssItem[]; sourceUrl: string }> {
  const feed = await fetchRssFeedFromDb(source);
  console.log(`Fetched ${feed.items.length} items from ${source.name}`);

  const newItems = feed.items
    .filter((item) => !existingUrlSet.has(item.link))
    .filter((item) => {
      if (!item.pubDate) return false;
      const pubDate = new Date(item.pubDate);
      return pubDate >= oneDayAgo;
    })
    .slice(0, MAX_NEWS_PER_SOURCE);

  return { items: newItems, sourceUrl: source.sourceUrl };
}

// DB에 RSS 소스가 없으면 기본값으로 초기화
async function ensureRssSources(): Promise<RssSource[]> {
  let sources = await prisma.rssSource.findMany({
    where: { isEnabled: true },
  });

  if (sources.length === 0) {
    // 기본 소스 초기화
    const defaultSources = Object.entries(RSS_SOURCES).map(([key, value]) => ({
      key,
      name: value.name,
      url: value.url,
      sourceUrl: value.sourceUrl,
      isEnabled: true,
    }));

    await prisma.rssSource.createMany({
      data: defaultSources,
      skipDuplicates: true,
    });

    sources = await prisma.rssSource.findMany({
      where: { isEnabled: true },
    });
  }

  return sources;
}

// POST: Cron 실행 (뉴스 수집)
export async function POST(request: NextRequest) {
  const hasAccess = await verifyAccess(request);
  if (!hasAccess) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    // 1. KST 기준 오늘 날짜
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstDate = new Date(now.getTime() + kstOffset);
    const today = new Date(kstDate.toISOString().split("T")[0]);

    // 2. 기존에 수집된 URL 확인 (중복 방지)
    const existingUrls = await prisma.dailyNews.findMany({
      where: { displayDate: today },
      select: { originalUrl: true },
    });
    const existingUrlSet = new Set(existingUrls.map((n) => n.originalUrl));

    // 3. 활성화된 RSS 소스 조회
    const enabledSources = await ensureRssSources();
    console.log(`Found ${enabledSources.length} enabled RSS sources`);

    if (enabledSources.length === 0) {
      const duration = Date.now() - startTime;
      await prisma.cronLog.create({
        data: {
          jobName: "daily-news",
          status: "success",
          message: "활성화된 RSS 소스 없음",
          processedCount: 0,
          duration,
        },
      });

      return NextResponse.json({
        message: "No enabled RSS sources",
      });
    }

    // 4. 각 소스에서 뉴스 수집
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const allNewsItems: { item: RssItem; sourceUrl: string }[] = [];

    for (const source of enabledSources) {
      try {
        const { items, sourceUrl } = await fetchNewsFromSource(
          source,
          existingUrlSet,
          oneDayAgo
        );
        for (const item of items) {
          allNewsItems.push({ item, sourceUrl });
        }
      } catch (error) {
        console.error(`Failed to fetch from ${source.name}:`, error);
      }
    }

    if (allNewsItems.length === 0) {
      const duration = Date.now() - startTime;
      await prisma.cronLog.create({
        data: {
          jobName: "daily-news",
          status: "success",
          message: "새로운 뉴스 없음",
          processedCount: 0,
          duration,
        },
      });

      return NextResponse.json({
        message: "No new news to process",
        existingCount: existingUrls.length,
      });
    }

    // 4. Course DB 조회 (강의 매칭용)
    const courses = await prisma.course.findMany({
      select: { id: true, title: true, affiliateUrl: true, description: true },
    });

    // 5. 각 뉴스 처리
    const results = [];
    for (const { item, sourceUrl } of allNewsItems) {
      try {
        // AI 요약 생성
        const aiSummary = await generateNewsSummary(
          item.title,
          item.description || ""
        );

        // 관련 강의 매칭
        const relatedCourses = await matchRelatedCourses(
          item.title,
          aiSummary,
          courses
        );

        // DB 저장
        const news = await prisma.dailyNews.create({
          data: {
            title: item.title,
            originalUrl: item.link,
            sourceUrl,
            description: item.description,
            aiSummary,
            relatedCourses: relatedCourses as unknown as Prisma.InputJsonValue,
            publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
            displayDate: today,
          },
        });

        results.push({ id: news.id, title: news.title, source: sourceUrl });
      } catch (error) {
        console.error(`Failed to process: ${item.title}`, error);
      }
    }

    // 성공 로그 저장
    const duration = Date.now() - startTime;
    const sourceNames = enabledSources.map((s) => s.name).join(", ");
    await prisma.cronLog.create({
      data: {
        jobName: "daily-news",
        status: "success",
        message: `${results.length}개 뉴스 수집 완료 (${sourceNames})`,
        processedCount: results.length,
        duration,
      },
    });

    return NextResponse.json({
      message: "Daily news updated",
      processed: results.length,
      news: results,
    });
  } catch (error) {
    console.error("Cron job failed:", error);

    // 실패 로그 저장
    const duration = Date.now() - startTime;
    await prisma.cronLog.create({
      data: {
        jobName: "daily-news",
        status: "error",
        message: "뉴스 수집 실패",
        processedCount: 0,
        errorDetail: error instanceof Error ? error.message : String(error),
        duration,
      },
    });

    return NextResponse.json(
      { error: "뉴스 수집에 실패했습니다." },
      { status: 500 }
    );
  }
}

// GET: 상태 확인용 (테스트/디버깅)
export async function GET(request: NextRequest) {
  const hasAccess = await verifyAccess(request);
  if (!hasAccess) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(now.getTime() + kstOffset);
  const todayDate = new Date(kstDate.toISOString().split("T")[0]);

  const count = await prisma.dailyNews.count({
    where: { displayDate: todayDate },
  });

  return NextResponse.json({
    status: "ok",
    todayNewsCount: count,
    lastCheck: new Date().toISOString(),
  });
}
