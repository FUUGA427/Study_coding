export type LessonType = "reading" | "quiz" | "coding" | string;
export type LessonDifficulty = "easy" | "medium" | "hard" | string;
export type LessonStatus = "not_started" | "in_progress" | "completed" | string;

export type LessonResponse = {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  lesson_type: LessonType;
  difficulty: LessonDifficulty;
  sort_order: number;
  tags: string[];
  max_score: number;
  pass_score: number;
};

export type LessonDetailResponse = LessonResponse & {
  content: Record<string, unknown>;
};

export type LessonProgressResponse = {
  lesson_id: string;
  status: LessonStatus;
  best_score: number;
  attempt_count: number;
};

export type LessonListResponse = {
  lessons: LessonResponse[];
  progress: Record<string, LessonProgressResponse>;
};

export type SubmitLessonRequest = {
  submitted_code?: string | null;
  answer?: Record<string, unknown> | null;
  time_spent_seconds?: number | null;
};

export type SubmitLessonResponse = {
  submission_id: string;
  is_correct: boolean;
  score: number;
  ai_review_task_id: string | null;
};
