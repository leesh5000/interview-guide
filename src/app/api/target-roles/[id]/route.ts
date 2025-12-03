import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";

// GET: 단일 대상 역할 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const targetRole = await prisma.targetRole.findUnique({
    where: { id },
  });

  if (!targetRole) {
    return NextResponse.json({ error: "Target role not found" }, { status: 404 });
  }

  return NextResponse.json(targetRole);
}

// PUT: 대상 역할 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { name, description, order } = body;

    const updatedTargetRole = await prisma.targetRole.update({
      where: { id },
      data: {
        name,
        description,
        order,
      },
    });

    return NextResponse.json(updatedTargetRole);
  } catch (error) {
    console.error("Error updating target role:", error);
    return NextResponse.json(
      { error: "Failed to update target role" },
      { status: 500 }
    );
  }
}

// DELETE: 대상 역할 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // 해당 대상 역할을 사용하는 질문 수 확인
    const targetRole = await prisma.targetRole.findUnique({
      where: { id },
    });

    if (!targetRole) {
      return NextResponse.json({ error: "Target role not found" }, { status: 404 });
    }

    const questionsCount = await prisma.interviewQuestion.count({
      where: {
        targetRoles: {
          has: targetRole.name,
        },
      },
    });

    if (questionsCount > 0) {
      return NextResponse.json(
        { error: `이 대상 역할을 사용하는 ${questionsCount}개의 질문이 있습니다. 먼저 해당 질문에서 이 대상 역할을 제거해주세요.` },
        { status: 400 }
      );
    }

    await prisma.targetRole.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting target role:", error);
    return NextResponse.json(
      { error: "Failed to delete target role" },
      { status: 500 }
    );
  }
}
