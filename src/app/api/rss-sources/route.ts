import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";
import { RSS_SOURCES } from "@/lib/rss-parser";

// GET: RSS 소스 목록 조회
export async function GET() {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // DB에서 소스 목록 조회
  let sources = await prisma.rssSource.findMany({
    orderBy: { createdAt: "asc" },
  });

  // DB에 소스가 없으면 기본값으로 초기화
  if (sources.length === 0) {
    const defaultSources = Object.entries(RSS_SOURCES).map(([key, value]) => ({
      key,
      name: value.name,
      url: value.url,
      sourceUrl: value.sourceUrl,
      isEnabled: true,
    }));

    await prisma.rssSource.createMany({
      data: defaultSources,
    });

    sources = await prisma.rssSource.findMany({
      orderBy: { createdAt: "asc" },
    });
  }

  return NextResponse.json(sources);
}

// POST: 새 RSS 소스 추가
export async function POST(request: NextRequest) {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { key, name, url, sourceUrl } = body;

    if (!key || !name || !url || !sourceUrl) {
      return NextResponse.json(
        { error: "모든 필드를 입력해주세요." },
        { status: 400 }
      );
    }

    // 이미 존재하는 키인지 확인
    const existing = await prisma.rssSource.findUnique({
      where: { key },
    });

    if (existing) {
      return NextResponse.json(
        { error: "이미 존재하는 소스 키입니다." },
        { status: 400 }
      );
    }

    const source = await prisma.rssSource.create({
      data: {
        key,
        name,
        url,
        sourceUrl,
        isEnabled: true,
      },
    });

    return NextResponse.json(source, { status: 201 });
  } catch (error) {
    console.error("Error creating RSS source:", error);
    return NextResponse.json(
      { error: "RSS 소스 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}
