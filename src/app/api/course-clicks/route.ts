import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: 특정 질문의 강의 클릭 수 조회
export async function GET(request: NextRequest) {
  const questionId = request.nextUrl.searchParams.get("questionId");

  if (!questionId) {
    return NextResponse.json(
      { error: "questionId is required" },
      { status: 400 }
    );
  }

  try {
    const clicks = await prisma.courseClick.findMany({
      where: { questionId },
      select: {
        affiliateUrl: true,
        clickCount: true,
      },
    });

    // affiliateUrl을 key로 하는 객체로 변환
    const clickMap: Record<string, number> = {};
    clicks.forEach((click) => {
      clickMap[click.affiliateUrl] = click.clickCount;
    });

    return NextResponse.json(clickMap);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch click counts" },
      { status: 500 }
    );
  }
}

// POST: 클릭 수 증가
export async function POST(request: NextRequest) {
  try {
    const { questionId, affiliateUrl } = await request.json();

    if (!questionId || !affiliateUrl) {
      return NextResponse.json(
        { error: "questionId and affiliateUrl are required" },
        { status: 400 }
      );
    }

    // 오늘 날짜 (KST 기준, 시간 제거)
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000; // UTC+9
    const kstDate = new Date(now.getTime() + kstOffset);
    const today = new Date(kstDate.toISOString().split("T")[0]);

    // 1. 기존 CourseClick 업데이트 (누적 - 호환성 유지)
    const result = await prisma.courseClick.upsert({
      where: {
        questionId_affiliateUrl: {
          questionId,
          affiliateUrl,
        },
      },
      update: {
        clickCount: { increment: 1 },
      },
      create: {
        questionId,
        affiliateUrl,
        clickCount: 1,
      },
    });

    // 2. DailyClickLog upsert (오늘 날짜 기준)
    await prisma.dailyClickLog.upsert({
      where: {
        affiliateUrl_date: { affiliateUrl, date: today },
      },
      update: {
        clickCount: { increment: 1 },
      },
      create: {
        affiliateUrl,
        date: today,
        clickCount: 1,
      },
    });

    // 3. 7일 이상 된 로그 삭제 (확률적: 1% 확률로 실행)
    if (Math.random() < 0.01) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      await prisma.dailyClickLog.deleteMany({
        where: { date: { lt: cutoff } },
      });
    }

    return NextResponse.json({ clickCount: result.clickCount });
  } catch {
    return NextResponse.json(
      { error: "Failed to record click" },
      { status: 500 }
    );
  }
}
