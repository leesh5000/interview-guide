import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { fetchGeekNewsRss } from "@/lib/rss-parser";
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

// POST: Cron 실행 (뉴스 수집)
export async function POST(request: NextRequest) {
  const hasAccess = await verifyAccess(request);
  if (!hasAccess) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    // 1. RSS 피드 가져오기
    const feed = await fetchGeekNewsRss();
    console.log(`Fetched ${feed.items.length} items from RSS`);

    // 2. KST 기준 오늘 날짜
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstDate = new Date(now.getTime() + kstOffset);
    const today = new Date(kstDate.toISOString().split("T")[0]);

    // 3. 기존에 수집된 URL 확인 (중복 방지)
    const existingUrls = await prisma.dailyNews.findMany({
      where: { displayDate: today },
      select: { originalUrl: true },
    });
    const existingUrlSet = new Set(existingUrls.map((n) => n.originalUrl));

    // 4. 새 뉴스만 필터링 (최대 10개)
    const maxNews = 10;
    const newItems = feed.items
      .filter((item) => !existingUrlSet.has(item.link))
      .slice(0, maxNews - existingUrls.length);

    if (newItems.length === 0) {
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

    // 5. Course DB 조회 (강의 매칭용)
    const courses = await prisma.course.findMany({
      select: { id: true, title: true, affiliateUrl: true, description: true },
    });

    // 6. 각 뉴스 처리
    const results = [];
    for (const item of newItems) {
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
            sourceUrl: "https://news.hada.io",
            description: item.description,
            aiSummary,
            relatedCourses: relatedCourses as unknown as Prisma.InputJsonValue,
            publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
            displayDate: today,
          },
        });

        results.push({ id: news.id, title: news.title });
      } catch (error) {
        console.error(`Failed to process: ${item.title}`, error);
      }
    }

    // 성공 로그 저장
    const duration = Date.now() - startTime;
    await prisma.cronLog.create({
      data: {
        jobName: "daily-news",
        status: "success",
        message: `${results.length}개 뉴스 수집 완료`,
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
