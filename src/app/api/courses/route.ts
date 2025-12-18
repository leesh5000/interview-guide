import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";

// GET: 강의 목록 조회 (검색, 페이지네이션, 인기순 정렬 지원)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search");
  const take = searchParams.get("take");
  const skip = searchParams.get("skip");
  const withStats = searchParams.get("withStats") === "true";

  const where = search
    ? {
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { affiliateUrl: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  // withStats가 true인 경우: 클릭 통계와 함께 반환 (인기순 정렬 후 페이지네이션)
  if (withStats) {
    // 전체 강의 조회 (인기순 정렬을 위해)
    const allCourses = await prisma.course.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const totalCount = allCourses.length;

    // 클릭 통계 집계
    const clickStats = await prisma.courseClick.groupBy({
      by: ["affiliateUrl"],
      _sum: { clickCount: true },
    });

    const clickCountMap: Record<string, number> = {};
    clickStats.forEach((stat) => {
      clickCountMap[stat.affiliateUrl] = stat._sum.clickCount || 0;
    });

    // 연관 질문 수 조회 (affiliateUrl로 매칭)
    const relatedQuestionCounts = await Promise.all(
      allCourses.map(async (course) => {
        const count = await prisma.$queryRaw<[{ count: bigint }]>`
          SELECT COUNT(*)::bigint as count
          FROM "InterviewQuestion"
          WHERE "isPublished" = true
          AND EXISTS (
            SELECT 1 FROM jsonb_array_elements("relatedCourses") as elem
            WHERE elem->>'affiliateUrl' = ${course.affiliateUrl}
          )
        `;
        return { id: course.id, count: Number(count[0].count) };
      })
    );
    const questionCountMap: Record<string, number> = {};
    relatedQuestionCounts.forEach((item) => {
      questionCountMap[item.id] = item.count;
    });

    // 연관 뉴스 수 조회 (courseId로 매칭)
    const relatedNewsCounts = await Promise.all(
      allCourses.map(async (course) => {
        const count = await prisma.$queryRaw<[{ count: bigint }]>`
          SELECT COUNT(*)::bigint as count
          FROM "DailyNews"
          WHERE EXISTS (
            SELECT 1 FROM jsonb_array_elements("relatedCourses") as elem
            WHERE elem->>'courseId' = ${course.id}
          )
        `;
        return { id: course.id, count: Number(count[0].count) };
      })
    );
    const newsCountMap: Record<string, number> = {};
    relatedNewsCounts.forEach((item) => {
      newsCountMap[item.id] = item.count;
    });

    // 클릭 수, 연관 질문/뉴스 수 추가 및 인기순 정렬
    const sortedCourses = allCourses
      .map((course) => ({
        ...course,
        clickCount: clickCountMap[course.affiliateUrl] || 0,
        relatedQuestionCount: questionCountMap[course.id] || 0,
        relatedNewsCount: newsCountMap[course.id] || 0,
      }))
      .sort((a, b) => b.clickCount - a.clickCount);

    // 정렬 후 페이지네이션 적용
    const skipNum = skip ? parseInt(skip, 10) : 0;
    const takeNum = take ? parseInt(take, 10) : sortedCourses.length;
    const paginatedCourses = sortedCourses.slice(skipNum, skipNum + takeNum);

    return NextResponse.json({
      courses: paginatedCourses,
      totalCount,
    });
  }

  // 기본 강의 목록 조회 (withStats가 false인 경우)
  const courses = await prisma.course.findMany({
    where,
    orderBy: { createdAt: "desc" },
    ...(take && { take: parseInt(take, 10) }),
    ...(skip && { skip: parseInt(skip, 10) }),
  });

  return NextResponse.json(courses);
}

// POST: 새 강의 생성 (또는 기존 강의 반환)
export async function POST(request: NextRequest) {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, affiliateUrl, thumbnailUrl, description } = body;

    if (!title || !affiliateUrl) {
      return NextResponse.json(
        { error: "제목과 제휴 링크는 필수입니다." },
        { status: 400 }
      );
    }

    // upsert: 이미 존재하면 업데이트, 없으면 생성
    const course = await prisma.course.upsert({
      where: { affiliateUrl },
      update: {
        title,
        ...(thumbnailUrl && { thumbnailUrl }),
        ...(description && { description }),
      },
      create: {
        title,
        affiliateUrl,
        thumbnailUrl: thumbnailUrl || null,
        description: description || null,
      },
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    console.error("Error creating course:", error);
    return NextResponse.json(
      { error: "강의 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}
