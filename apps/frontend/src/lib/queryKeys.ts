export const queryKeys = {
  courses: ["courses"] as const,
  lessons: (courseId: string) => ["courses", courseId, "lessons"] as const,
  lessonDetail: (lessonId: string) => ["lessons", lessonId] as const,
  history: ["history"] as const,
  attempt: (id: string) => ["history", id] as const,
  recommendations: (type?: string | null) => ["recommendations", type ?? "all"] as const,
  weakness: ["weakness"] as const,
  practiceTask: (taskId: string) => ["practice", "task", taskId] as const,
  reviewTask: (taskId: string) => ["ai", "review", taskId] as const,
};
