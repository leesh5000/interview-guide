import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";

interface RelatedCourse {
  title: string;
  affiliateUrl: string;
  thumbnailUrl?: string;
}

interface BulkQuestionInput {
  categoryId: string;
  questionTitle: string;
  questionBody: string;
  answerContent: string;
  followUpQuestions: string;
  tags: string[];
  targetRoles: string[];
  relatedCourses: RelatedCourse[];
}

// POST: 질문 일괄 생성
export async function POST(request: NextRequest) {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { questions } = body as { questions: BulkQuestionInput[] };

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: "질문 배열이 필요합니다." },
        { status: 400 }
      );
    }

    // 유효성 검사
    const errors: string[] = [];
    questions.forEach((q, index) => {
      if (!q.categoryId) {
        errors.push(`질문 #${index + 1}: 카테고리가 선택되지 않았습니다.`);
      }
      if (!q.questionTitle) {
        errors.push(`질문 #${index + 1}: 질문 제목이 없습니다.`);
      }
    });

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join("\n") }, { status: 400 });
    }

    // 트랜잭션으로 일괄 생성
    const createdQuestions = await prisma.$transaction(
      questions.map((q) =>
        prisma.interviewQuestion.create({
          data: {
            categoryId: q.categoryId,
            questionTitle: q.questionTitle,
            questionBody: q.questionBody || "",
            answerContent: q.answerContent || "",
            followUpQuestions: q.followUpQuestions || "",
            tags: q.tags || [],
            targetRoles: q.targetRoles || [],
            relatedCourses: (q.relatedCourses || []) as unknown as Prisma.JsonArray,
            isPublished: true, // 모두 발행 상태로 생성
          },
          select: {
            id: true,
            questionTitle: true,
          },
        })
      )
    );

    return NextResponse.json(
      {
        created: createdQuestions.length,
        questions: createdQuestions,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating bulk questions:", error);
    return NextResponse.json(
      { error: "질문 일괄 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}
