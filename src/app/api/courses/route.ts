import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";

// GET: 강의 목록 조회 (검색 지원)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search");

  const courses = await prisma.course.findMany({
    where: search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { affiliateUrl: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
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
