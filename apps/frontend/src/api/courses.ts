import type {
  CourseListResponse,
  LessonDetailResponse,
  LessonListResponse,
  SubmitLessonRequest,
  SubmitLessonResponse,
} from "@learning-platform/shared-types";
import { api } from "@/lib/api";

export async function listCourses() {
  const { data } = await api.get<CourseListResponse>("/courses");
  return data;
}

export async function listLessons(courseId: string) {
  const { data } = await api.get<LessonListResponse>(`/courses/${courseId}/lessons`);
  return data;
}

export async function getLessonDetail(lessonId: string) {
  const { data } = await api.get<LessonDetailResponse>(`/courses/lessons/${lessonId}`);
  return data;
}

export async function submitLesson(lessonId: string, body: SubmitLessonRequest) {
  const { data } = await api.post<SubmitLessonResponse>(
    `/courses/lessons/${lessonId}/submit`,
    body,
  );
  return data;
}
