import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";

// GET: 단일 질문 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const question = await prisma.interviewQuestion.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  return NextResponse.json(question);
}

// PUT: 질문 수정
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
    const {
      categoryId,
      questionTitle,
      questionBody,
      answerContent,
      followUpQuestions,
      targetRoles,
      tags,
      aiSummary,
      relatedCourses,
      isPublished,
    } = body;

    const updatedQuestion = await prisma.interviewQuestion.update({
      where: { id },
      data: {
        categoryId,
        questionTitle,
        questionBody: questionBody || "",
        answerContent: answerContent || "",
        followUpQuestions: followUpQuestions || "",
        targetRoles: targetRoles || [],
        tags: tags || [],
        aiSummary,
        relatedCourses: relatedCourses || [],
        isPublished,
      },
      include: { category: true },
    });

    return NextResponse.json(updatedQuestion);
  } catch (error) {
    console.error("Error updating question:", error);
    return NextResponse.json(
      { error: "Failed to update question" },
      { status: 500 }
    );
  }
}

// DELETE: 질문 삭제
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
    await prisma.interviewQuestion.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting question:", error);
    return NextResponse.json(
      { error: "Failed to delete question" },
      { status: 500 }
    );
  }
}
