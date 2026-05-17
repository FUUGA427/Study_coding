export type ProblemSource = "lesson" | "generated" | string;

export type AttemptSummary = {
  id: string;
  problem_source: ProblemSource;
  lesson_id: string | null;
  generated_problem_id: string | null;
  lesson_title: string | null;
  is_correct: boolean;
  score: number;
  attempted_at: string;
};

export type AttemptDetail = AttemptSummary & {
  submitted_code: string | null;
  answer: Record<string, unknown> | null;
  ai_review: string | null;
  time_spent_seconds: number | null;
  problem_content: Record<string, unknown> | null;
};

export type HistoryListResponse = {
  items: AttemptSummary[];
  next_cursor: string | null;
};
