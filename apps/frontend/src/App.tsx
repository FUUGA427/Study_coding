import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { CoursesPage } from "@/pages/CoursesPage";
import { CatalogCoursePage } from "@/pages/CatalogCoursePage";
import { CourseLessonsPage } from "@/pages/CourseLessonsPage";
import { LessonPage } from "@/pages/LessonPage";
import { CodingPage } from "@/pages/CodingPage";
import { HistoryPage } from "@/pages/HistoryPage";
import { AttemptDetailPage } from "@/pages/AttemptDetailPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/catalog/courses/:courseId" element={<CatalogCoursePage />} />
        <Route path="/courses/:courseId" element={<CourseLessonsPage />} />
        <Route path="/lessons/:lessonId" element={<LessonPage />} />
        <Route path="/practice" element={<CodingPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/history/:attemptId" element={<AttemptDetailPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
