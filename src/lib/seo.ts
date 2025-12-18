// SEO Configuration Constants
export const SEO_CONFIG = {
  SITE_URL: "https://www.devinterview.site",
  SITE_NAME: "DevInterview",
  DEFAULT_TITLE: "DevInterview - 개발자 면접 준비 가이드",
  DEFAULT_DESCRIPTION:
    "개발자 면접 예상 질문과 모범 답안을 확인하세요. AI 요약과 추천 강의를 통해 효율적으로 면접을 준비할 수 있습니다.",
  DEFAULT_OG_IMAGE: "/og-default.png",
  LOCALE: "ko_KR",
  KEYWORDS: [
    "개발자 면접",
    "기술 면접",
    "면접 질문",
    "개발자 취업",
    "코딩 면접",
    "백엔드 면접",
    "프론트엔드 면접",
    "IT 면접",
    "프로그래밍 면접",
  ] as string[],
};

/**
 * Strip markdown syntax and return plain text
 * Used for meta descriptions and JSON-LD content
 */
export function stripMarkdown(markdown: string): string {
  return markdown
    // Remove headers
    .replace(/^#{1,6}\s+/gm, "")
    // Remove bold/italic
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1")
    // Remove inline code
    .replace(/`([^`]+)`/g, "$1")
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, "")
    // Remove links but keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Remove images
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "")
    // Remove blockquotes
    .replace(/^>\s+/gm, "")
    // Remove horizontal rules
    .replace(/^[-*_]{3,}\s*$/gm, "")
    // Remove list markers
    .replace(/^[\s]*[-*+]\s+/gm, "")
    .replace(/^[\s]*\d+\.\s+/gm, "")
    // Collapse multiple newlines
    .replace(/\n{2,}/g, " ")
    // Collapse multiple spaces
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Truncate text to specified length with ellipsis
 * Ensures we don't cut in the middle of a word
 */
export function truncateText(text: string, maxLength: number = 160): string {
  if (text.length <= maxLength) return text;

  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");

  if (lastSpace > maxLength * 0.8) {
    return truncated.slice(0, lastSpace) + "...";
  }

  return truncated + "...";
}
