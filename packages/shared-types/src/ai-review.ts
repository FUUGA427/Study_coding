import type { AsyncTaskStatus } from "./common";

export type CodeReviewRequest = {
  code: string;
  problem_description: string;
  language?: string;
};

export type CodeReviewResponse = {
  task_id: string;
  status: AsyncTaskStatus;
  message: string;
};

export type CodeReviewResult = {
  task_id: string;
  status: AsyncTaskStatus;
  review: string | null;
  error_message: string | null;
};
