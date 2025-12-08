import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";

// GET: 카테고리 목록 조회
export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
  });

  return NextResponse.json(categories);
}

// POST: 새 카테고리 생성
export async function POST(request: NextRequest) {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, slug, description, order } = body;

    const newCategory = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        order: order || 0,
      },
    });

    // 캐시 재검증: 홈페이지와 질문 목록 페이지
    revalidatePath("/");
    revalidatePath("/questions");

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
