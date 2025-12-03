import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { generateSummary } from "@/lib/openai";

export async function POST(request: NextRequest) {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { question, answer } = await request.json();

    if (!question || !answer) {
      return NextResponse.json(
        { error: "질문과 답안이 필요합니다." },
        { status: 400 }
      );
    }

    const summary = await generateSummary(question, answer);

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Error generating summary:", error);

    if (error instanceof Error && error.message.includes("OPENAI_API_KEY")) {
      return NextResponse.json(
        { error: "OpenAI API 키가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "AI 요약 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}
