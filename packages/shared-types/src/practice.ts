import type { AsyncTaskStatus } from "./common";

export type ProblemType = "quiz" | "coding";
export type Difficulty = "easy" | "medium" | "hard";

export type GenerateProblemRequest = {
  problem_type: ProblemType;
  difficulty: Difficulty;
  tags?: string[];
  source_lesson_id?: string | null;
};

export type GenerateProblemResponse = {
  task_id: string;
  status: AsyncTaskStatus;
  message: string;
};

export type TaskStatusResponse = {
  task_id: string;
  status: AsyncTaskStatus;
  problem: Record<string, unknown> | null;
  error_message: string | null;
};

export type SubmitPracticeRequest = {
  problem_id: string;
  submitted_code?: string | null;
  answer?: Record<string, unknown> | null;
  time_spent_seconds?: number | null;
};

export type SubmitPracticeResponse = {
  is_correct: boolean;
  score: number;
  ai_review: string | null;
  ai_review_task_id: string | null;
};
