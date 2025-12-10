/**
 * 면접 질문 일괄 등록을 위한 텍스트 파싱 유틸리티
 */

export interface RelatedCourse {
  title: string;
  affiliateUrl: string;
  thumbnailUrl?: string;
}

export interface ParsedQuestion {
  categoryName: string;
  categoryId?: string;
  tags: string[];
  questionTitle: string;
  questionBody: string;
  answerContent: string;
  followUpQuestions: string;
  targetRoles: string[];
  relatedCourses: RelatedCourse[];
}

/**
 * 텍스트를 파싱하여 질문 배열로 변환
 */
export function parseQuestions(text: string): ParsedQuestion[] {
  // --- 로 질문 분리
  const sections = text
    .split(/\n---\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  return sections.map(parseSection).filter((q): q is ParsedQuestion => q !== null);
}

/**
 * 개별 섹션을 파싱하여 ParsedQuestion 객체로 변환
 */
function parseSection(section: string): ParsedQuestion | null {
  // 카테고리 추출: **카테고리: XXX**
  const categoryMatch = section.match(/\*\*카테고리:\s*(.+?)\*\*/);
  const categoryName = categoryMatch ? categoryMatch[1].trim() : "";

  // 태그 추출: **태그: tag1, tag2**
  const tagsMatch = section.match(/\*\*태그:\s*(.+?)\*\*/);
  const tags = tagsMatch
    ? tagsMatch[1]
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
    : [];

  // 질문 제목 추출: **Q. 질문내용?**
  const questionMatch = section.match(/\*\*Q\.\s*(.+?)\*\*/);
  const questionTitle = questionMatch ? questionMatch[1].trim() : "";

  // 질문이 없으면 null 반환
  if (!questionTitle) {
    return null;
  }

  // 질문 본문 추출: 질문 의도 + 평가 포인트 섹션
  const questionBody = extractQuestionBody(section);

  // 답변 내용 및 꼬리 질문 추출
  const { answerContent, followUpQuestions } = extractAnswerContent(section);

  return {
    categoryName,
    tags,
    questionTitle,
    questionBody,
    answerContent,
    followUpQuestions,
    targetRoles: [],
    relatedCourses: [],
  };
}

/**
 * 질문 본문(질문 의도 + 평가 포인트) 추출
 */
function extractQuestionBody(section: string): string {
  // **Q. 질문** 이후부터 **A. 답변** 이전까지의 내용
  const questionBodyMatch = section.match(/\*\*Q\..*?\*\*\s*([\s\S]*?)(?=\*\*A\.)/);

  if (!questionBodyMatch) {
    return "";
  }

  let body = questionBodyMatch[1].trim();

  // 질문 의도와 평가 포인트 부분 정리
  // * **질문 의도:** 내용 형식을 마크다운으로 변환
  body = body
    .replace(/\*\s*\*\*질문 의도:\*\*\s*/g, "### 질문 의도\n")
    .replace(/\*\s*\*\*평가 포인트:\*\*\s*/g, "\n### 평가 포인트\n");

  return body.trim();
}

/**
 * 답변 내용(답변 제목 + 핵심 키워드 + 답변 내용)과 꼬리 질문을 별도로 추출
 */
function extractAnswerContent(section: string): {
  answerContent: string;
  followUpQuestions: string;
} {
  // **A. 답변** 이후의 모든 내용
  const answerMatch = section.match(/\*\*A\.\s*(.+?)\*\*([\s\S]*)/);

  if (!answerMatch) {
    return { answerContent: "", followUpQuestions: "" };
  }

  const answerTitle = answerMatch[1].trim();
  let answerBody = answerMatch[2].trim();

  // 핵심 키워드 추출 및 포맷팅
  const keywordsMatch = answerBody.match(/\*\*핵심 키워드:\*\*\s*(.+)/);
  let keywords = "";
  if (keywordsMatch) {
    keywords = keywordsMatch[1].trim();
    // 핵심 키워드 라인 제거
    answerBody = answerBody.replace(/\*\*핵심 키워드:\*\*\s*.+\n?/, "");
  }

  // 꼬리 질문 추출 (별도 필드로 분리)
  const followUpMatch = answerBody.match(/\*\*꼬리 질문:\*\*([\s\S]*)/);
  let followUpQuestions = "";
  let mainContent = answerBody;

  if (followUpMatch) {
    followUpQuestions = followUpMatch[1].trim();
    mainContent = answerBody.replace(/\*\*꼬리 질문:\*\*[\s\S]*/, "").trim();
  }

  // 마크다운 형식으로 조합 (꼬리 질문은 별도 필드로)
  let answerContent = `## ${answerTitle}\n\n`;

  if (keywords) {
    answerContent += `**핵심 키워드:** ${keywords}\n\n`;
  }

  // 메인 답변 내용 정리 (불릿 포인트 유지)
  if (mainContent) {
    answerContent += mainContent;
  }

  return {
    answerContent: answerContent.trim(),
    followUpQuestions,
  };
}

/**
 * 파싱 결과 유효성 검사
 */
export function validateParsedQuestions(questions: ParsedQuestion[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  questions.forEach((q, index) => {
    if (!q.questionTitle) {
      errors.push(`질문 #${index + 1}: 질문 제목이 없습니다.`);
    }
    if (!q.categoryName) {
      errors.push(`질문 #${index + 1}: 카테고리가 없습니다.`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
