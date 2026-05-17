export type CourseLevel = "beginner" | "intermediate" | "advanced";

export type CourseCategory =
  | "frontend"
  | "backend"
  | "ai"
  | "database"
  | "infra"
  | "testing"
  | "practice";

export type CourseStatus = "not-started" | "in-progress" | "completed" | "locked";

export type QuestionType = "choice" | "multiple-choice" | "text" | "code";

export type QuestionDifficulty = "easy" | "normal" | "hard";

export type Question = {
  id: string;
  type: QuestionType;
  title: string;
  description: string;
  choices?: string[];
  /** choice/multiple-choice: 正解ラベル(複数選択なら配列)、text/code: 模範解答(text)または穴埋め解答リスト(code) */
  answer: string | string[];
  explanation: string;
  difficulty: QuestionDifficulty;
  /** code 型のみ: ユーザーに見せるテンプレート(`___` の箇所が穴埋め対象) */
  codeTemplate?: string;
};

export type Lesson = {
  id: string;
  title: string;
  description: string;
  order: number;
  questions: Question[];
};

export type Course = {
  id: string;
  title: string;
  description: string;
  category: CourseCategory;
  level: CourseLevel;
  status: CourseStatus;
  icon: string;
  /** Tailwindのカテゴリ別アクセントグラデ用 (catalogStylesと整合) */
  color: string;
  estimatedHours: number;
  lessonCount: number;
  questionCount: number;
  /** 0〜100 */
  progress: number;
  isLocked: boolean;
  tags: string[];
  lessons: Lesson[];
};

export type CourseCatalogResponse = {
  courses: Course[];
};
