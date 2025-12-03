import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateSummary(
  question: string,
  answer: string
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY 환경변수가 설정되지 않았습니다.");
  }

  const prompt = `다음 개발자 면접 질문과 답안을 한 줄로 요약해주세요.
핵심 키워드와 개념을 포함하고, 간결하게 작성하세요.

질문: ${question}

답안: ${answer}

요약:`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "당신은 개발자 면접 전문가입니다. 질문과 답안을 분석하여 핵심 내용을 간결하게 요약합니다.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    max_tokens: 200,
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content?.trim() || "";
}
