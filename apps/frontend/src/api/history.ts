import type {
  AttemptDetail,
  HistoryListResponse,
} from "@learning-platform/shared-types";
import { api } from "@/lib/api";

export async function getHistory(params?: { limit?: number; cursor?: string | null }) {
  const { data } = await api.get<HistoryListResponse>("/history", { params });
  return data;
}

export async function getAttemptDetail(id: string) {
  const { data } = await api.get<AttemptDetail>(`/history/${id}`);
  return data;
}
