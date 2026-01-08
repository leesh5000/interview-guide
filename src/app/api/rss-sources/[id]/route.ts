import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";

// PATCH: RSS 소스 활성화/비활성화 토글
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { isEnabled } = body;

    if (typeof isEnabled !== "boolean") {
      return NextResponse.json(
        { error: "isEnabled 필드가 필요합니다." },
        { status: 400 }
      );
    }

    const source = await prisma.rssSource.update({
      where: { id },
      data: { isEnabled },
    });

    return NextResponse.json(source);
  } catch (error) {
    console.error("Error updating RSS source:", error);
    return NextResponse.json(
      { error: "RSS 소스 업데이트에 실패했습니다." },
      { status: 500 }
    );
  }
}

// DELETE: RSS 소스 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    await prisma.rssSource.delete({
      where: { id },
    });

    return NextResponse.json({ message: "삭제되었습니다." });
  } catch (error) {
    console.error("Error deleting RSS source:", error);
    return NextResponse.json(
      { error: "RSS 소스 삭제에 실패했습니다." },
      { status: 500 }
    );
  }
}
