import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getLessonDetail, submitLesson } from "@/api/courses";
import { queryKeys } from "@/lib/queryKeys";
import { PageHeader } from "@/components/common/PageHeader";
import { ErrorState, LoadingState } from "@/components/common/LoadingState";
import { CodeEditor } from "@/components/common/CodeEditor";
import { AiReviewPanel } from "@/components/common/AiReviewPanel";
import { getErrorMessage } from "@/lib/api";
import type { SubmitLessonResponse } from "@learning-platform/shared-types";

type QuizContent = { question?: string; choices?: string[]; correct_index?: number };
type CodingContent = { problem_description?: string; starter_code?: string; language?: string };

export function LessonPage() {
  const { lessonId = "" } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.lessonDetail(lessonId),
    queryFn: () => getLessonDetail(lessonId),
    enabled: !!lessonId,
  });

  const [code, setCode] = useState<string>("");
  const [selected, setSelected] = useState<number | null>(null);
  const [startedAt] = useState(Date.now());
  const [result, setResult] = useState<SubmitLessonResponse | null>(null);

  const mutation = useMutation({
    mutationFn: () => {
      const timeSpent = Math.floor((Date.now() - startedAt) / 1000);
      if (data?.lesson_type === "coding") {
        return submitLesson(lessonId, { submitted_code: code, time_spent_seconds: timeSpent });
      }
      return submitLesson(lessonId, {
        answer: { selected_index: selected },
        time_spent_seconds: timeSpent,
      });
    },
    onSuccess: (res) => {
      setResult(res);
      qc.invalidateQueries({ queryKey: queryKeys.courses });
      if (data) qc.invalidateQueries({ queryKey: queryKeys.lessons(data.course_id) });
    },
  });

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={getErrorMessage(error)} />;
  if (!data) return null;

  const starterCode =
    (data.content as CodingContent)?.starter_code ?? "# ここにコードを書いてください\n";
  const language = (data.content as CodingContent)?.language ?? "python";

  return (
    <div>
      <PageHeader
        title={data.title}
        description={data.description ?? undefined}
        actions={
          <button className="btn-secondary" onClick={() => navigate(-1)}>
            戻る
          </button>
        }
      />

      {data.lesson_type === "quiz" && (
        <div className="card p-6 space-y-4">
          <div className="text-slate-800 whitespace-pre-wrap">
            {(data.content as QuizContent)?.question}
          </div>
          <ul className="space-y-2">
            {(data.content as QuizContent)?.choices?.map((c, i) => (
              <li key={i}>
                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-md cursor-pointer hover:bg-slate-50">
                  <input
                    type="radio"
                    name="choice"
                    checked={selected === i}
                    onChange={() => setSelected(i)}
                  />
                  <span>{c}</span>
                </label>
              </li>
            ))}
          </ul>
          <button
            className="btn-primary"
            disabled={selected === null || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "提出中..." : "回答を提出"}
          </button>
        </div>
      )}

      {data.lesson_type === "coding" && (
        <div className="space-y-4">
          <div className="card p-6">
            <h3 className="font-semibold mb-2">課題</h3>
            <div className="whitespace-pre-wrap text-sm text-slate-700">
              {(data.content as CodingContent)?.problem_description}
            </div>
          </div>
          <CodeEditor
            value={code || starterCode}
            onChange={setCode}
            language={language}
            height={360}
          />
          <button
            className="btn-primary"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "提出中..." : "コードを提出"}
          </button>
        </div>
      )}

      {data.lesson_type === "reading" && (
        <div className="card p-6 space-y-4">
          <div className="text-sm text-slate-600 whitespace-pre-wrap">
            {(data.content as { body?: string })?.body ?? "読み物コンテンツ"}
          </div>
          <button
            className="btn-primary"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            完了にする
          </button>
        </div>
      )}

      {mutation.error && <ErrorState message={getErrorMessage(mutation.error)} />}

      {result && (
        <div className="mt-6 card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <span
              className={`badge ${
                result.is_correct
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {result.is_correct ? "正解" : "不正解"}
            </span>
            <span className="text-lg font-semibold">
              スコア: {result.score} / {data.max_score}
            </span>
          </div>
          {result.ai_review_task_id && (
            <div>
              <h3 className="font-semibold mb-2">AIレビュー</h3>
              <AiReviewPanel taskId={result.ai_review_task_id} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
