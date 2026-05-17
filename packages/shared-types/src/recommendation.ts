import type { ProblemSource } from "./history";

export type RecommendationType = "weakness" | "next_step" | "review" | string;

export type RecommendationItem = {
  id: string;
  recommendation_type: RecommendationType;
  problem_source: ProblemSource;
  lesson_id: string | null;
  generated_problem_id: string | null;
  priority_score: string;
  score_breakdown: Record<string, unknown>;
  reason: string | null;
  lesson_title: string | null;
};

export type RecommendationListResponse = {
  items: RecommendationItem[];
};

export type WeaknessItem = {
  tag: string;
  total_attempts: number;
  correct_count: number;
  accuracy_rate: string;
  avg_score: string;
};

export type WeaknessProfileResponse = {
  items: WeaknessItem[];
};
