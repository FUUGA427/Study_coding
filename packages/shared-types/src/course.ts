export type CourseLevel = "beginner" | "intermediate" | "advanced" | string;
export type ProgressStatus = "not_started" | "in_progress" | "completed" | string;

export type CourseResponse = {
  id: string;
  title: string;
  description: string | null;
  level: CourseLevel;
  sort_order: number;
  is_published: boolean;
  prerequisite_course_id: string | null;
};

export type CourseWithProgressResponse = CourseResponse & {
  progress_status: ProgressStatus;
  progress_pct: string;
  is_unlocked: boolean;
};

export type CourseListResponse = {
  courses: CourseWithProgressResponse[];
};
