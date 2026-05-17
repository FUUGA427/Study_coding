import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { generateProblem, getPracticeStatus } from "@/api/practice";
import { queryKeys } from "@/lib/queryKeys";
import { PageHeader } from "@/components/common/PageHeader";
import { ErrorState } from "@/components/common/LoadingState";
import { CodeEditor } from "@/components/common/CodeEditor";
import { AiReviewPanel } from "@/components/common/AiReviewPanel";
import { requestReview } from "@/api/aiReview";
import { getErrorMessage } from "@/lib/api";
import type { Difficulty, ProblemType } from "@learning-platform/shared-types";

type GeneratedProblem = {
  title?: string;
  description?: string;
  starter_code?: string;
  language?: string;
  choices?: string[];
  correct_index?: number;
};

export function PracticePage() {
  const [problemType, setProblemType] = useState<ProblemType>("coding");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [tagsInput, setTagsInput] = useState("");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [reviewTaskId, setReviewTaskId] = useState<string | null>(null);

  const generate = useMutation({
    mutationFn: generateProblem,
    onSuccess: (res) => {
      setTaskId(res.task_id);
      setCode("");
      setReviewTaskId(null);
    },
  });

  const { data: taskStatus } = useQuery({
    queryKey: queryKeys.practiceTask(taskId ?? ""),
    queryFn: () => getPracticeStatus(taskId!),
    enabled: !!taskId,
    refetchInterval: (q) => {
      const s = q.state.data?.status;
      return s === "completed" || s === "failed" ? false : 2000;
    },
  });

  const review = useMutation({
    mutationFn: requestReview,
    onSuccess: (res) => setReviewTaskId(res.task_id),
  });

  const onGenerate = () => {
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 5);
    generate.mutate({ problem_type: problemType, difficulty, tags });
  };

  const problem = taskStatus?.problem as GeneratedProblem | null | undefined;

  return (
    <div>
      <PageHeader
        title="練習問題"
        description="AIが問題を生成します。解いてコードレビューを受けましょう。"
      />

      <div className="card p-6 space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="label">問題タイプ</label>
            <select
              className="input"
              value={problemType}
              onChange={(e) => setProblemType(e.target.value as ProblemType)}
            >
              <option value="coding">コーディング</option>
              <option value="quiz">クイズ</option>
            </select>
          </div>
          <div>
            <label className="label">難易度</label>
            <select
              className="input"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            >
              <option value="easy">易</option>
              <option value="medium">中</option>
              <option value="hard">難</option>
            </select>
          </div>
          <div>
            <label className="label">タグ（カンマ区切り、最大5つ）</label>
            <input
              className="input"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="loop, list, dict"
            />
          </div>
        </div>
        <button className="btn-primary" onClick={onGenerate} disabled={generate.isPending}>
          {generate.isPending ? "リクエスト中..." : "問題を生成"}
        </button>
        {generate.error && <ErrorState message={getErrorMessage(generate.error)} />}
      </div>

      {taskId && (
        <div className="mt-6 card p-6">
          {taskStatus?.status === "pending" || taskStatus?.status === "processing" ? (
            <div className="flex items-center text-slate-600 text-sm">
              <div className="h-4 w-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mr-2" />
              問題を生成中...
            </div>
          ) : taskStatus?.status === "failed" ? (
            <ErrorState
              message={taskStatus.error_message ?? "問題生成に失敗しました"}
            />
          ) : problem ? (
            <div className="space-y-4">
              {problem.title && <h2 className="text-xl font-semibold">{problem.title}</h2>}
              {problem.description && (
                <div className="whitespace-pre-wrap text-sm text-slate-700">
                  {problem.description}
                </div>
              )}
              {problemType === "coding" && (
                <>
                  <CodeEditor
                    value={code || problem.starter_code || ""}
                    onChange={setCode}
                    language={problem.language ?? "python"}
                    height={340}
                  />
                  <button
                    className="btn-primary"
                    disabled={!code.trim() || review.isPending}
                    onClick={() =>
                      review.mutate({
                        code,
                        problem_description: problem.description ?? "",
                        language: problem.language ?? "python",
                      })
                    }
                  >
                    {review.isPending ? "リクエスト中..." : "AIレビューを受ける"}
                  </button>
                  {review.error && <ErrorState message={getErrorMessage(review.error)} />}
                  {reviewTaskId && (
                    <div>
                      <h3 className="font-semibold mb-2">AIレビュー</h3>
                      <AiReviewPanel taskId={reviewTaskId} />
                    </div>
                  )}
                </>
              )}
              {problemType === "quiz" && problem.choices && (
                <ul className="space-y-2">
                  {problem.choices.map((c, i) => (
                    <li key={i} className="p-3 border border-slate-200 rounded-md">
                      {i + 1}. {c}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
