import type {
  CodeReviewRequest,
  CodeReviewResponse,
  CodeReviewResult,
} from "@learning-platform/shared-types";
import { api } from "@/lib/api";

export async function requestReview(body: CodeReviewRequest) {
  const { data } = await api.post<CodeReviewResponse>("/ai/review", body);
  return data;
}

export async function getReviewResult(taskId: string) {
  const { data } = await api.get<CodeReviewResult>(`/ai/review/${taskId}`);
  return data;
}
