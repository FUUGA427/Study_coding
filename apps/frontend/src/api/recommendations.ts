import type {
  RecommendationListResponse,
  WeaknessProfileResponse,
} from "@learning-platform/shared-types";
import { api } from "@/lib/api";

export async function getRecommendations(params?: { limit?: number; type?: string | null }) {
  const { data } = await api.get<RecommendationListResponse>("/recommend/review", { params });
  return data;
}

export async function dismissRecommendation(id: string) {
  const { data } = await api.post<{ status: string }>(`/recommend/${id}/dismiss`);
  return data;
}

export async function getWeaknessProfile() {
  const { data } = await api.get<WeaknessProfileResponse>("/recommend/weakness");
  return data;
}
