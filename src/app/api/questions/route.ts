import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";

// GET: 질문 목록 조회
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get("category");
  const role = searchParams.get("role");
  const published = searchParams.get("published");
  const take = searchParams.get("take");
  const skip = searchParams.get("skip");

  const where = {
    ...(category && { category: { slug: category } }),
    ...(role && { targetRoles: { has: role } }),
    ...(published !== null && { isPublished: published === "true" }),
  };

  const [questions, totalCount] = await Promise.all([
    prisma.interviewQuestion.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: "desc" },
      ...(take && { take: parseInt(take, 10) }),
      ...(skip && { skip: parseInt(skip, 10) }),
    }),
    prisma.interviewQuestion.count({ where }),
  ]);

  return NextResponse.json({
    questions,
    totalCount,
    hasMore: skip && take ? parseInt(skip, 10) + questions.length < totalCount : false,
  });
}

// POST: 새 질문 생성
export async function POST(request: NextRequest) {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

    const newQuestion = await prisma.interviewQuestion.create({
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
        isPublished: isPublished || false,
      },
      include: { category: true },
    });

    return NextResponse.json(newQuestion, { status: 201 });
  } catch (error) {
    console.error("Error creating question:", error);
    return NextResponse.json(
      { error: "Failed to create question" },
      { status: 500 }
    );
  }
}
