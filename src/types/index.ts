export interface RelatedCourse {
  title: string;
  affiliateUrl: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  order: number;
}

export interface TargetRole {
  id: string;
  name: string;
  description: string | null;
  order: number;
}

export interface InterviewQuestion {
  id: string;
  categoryId: string;
  category: Category;

  // 질문 정보
  questionTitle: string;
  questionBody: string;   // 마크다운
  answerContent: string;  // 마크다운

  // 메타 정보
  targetRoles: string[];
  tags: string[];

  // AI 및 강의
  aiSummary: string | null;
  relatedCourses: RelatedCourse[];

  // 상태
  viewCount: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

