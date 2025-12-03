import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";

// GET: 대상 역할 목록 조회
export async function GET() {
  const targetRoles = await prisma.targetRole.findMany({
    orderBy: { order: "asc" },
  });

  return NextResponse.json(targetRoles);
}

// POST: 새 대상 역할 생성
export async function POST(request: NextRequest) {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, order } = body;

    const newTargetRole = await prisma.targetRole.create({
      data: {
        name,
        description,
        order: order || 0,
      },
    });

    return NextResponse.json(newTargetRole, { status: 201 });
  } catch (error) {
    console.error("Error creating target role:", error);
    return NextResponse.json(
      { error: "Failed to create target role" },
      { status: 500 }
    );
  }
}
