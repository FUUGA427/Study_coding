import type {
  GenerateProblemRequest,
  GenerateProblemResponse,
  TaskStatusResponse,
} from "@learning-platform/shared-types";
import { api } from "@/lib/api";

export async function generateProblem(body: GenerateProblemRequest) {
  const { data } = await api.post<GenerateProblemResponse>("/practice/generate", body);
  return data;
}

export async function getPracticeStatus(taskId: string) {
  const { data } = await api.get<TaskStatusResponse>(`/practice/status/${taskId}`);
  return data;
}
