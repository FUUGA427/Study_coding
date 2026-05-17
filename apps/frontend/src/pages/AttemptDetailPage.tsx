import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { getAttemptDetail } from "@/api/history";
import { queryKeys } from "@/lib/queryKeys";
import { PageHeader } from "@/components/common/PageHeader";
import { ErrorState, LoadingState } from "@/components/common/LoadingState";
import { getErrorMessage } from "@/lib/api";

export function AttemptDetailPage() {
  const { attemptId = "" } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.attempt(attemptId),
    queryFn: () => getAttemptDetail(attemptId),
    enabled: !!attemptId,
  });

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={getErrorMessage(error)} />;
  if (!data) return null;

  return (
    <div>
      <PageHeader
        title={data.lesson_title ?? "提出詳細"}
        description={new Date(data.attempted_at).toLocaleString("ja-JP")}
        actions={
          <button className="btn-secondary" onClick={() => navigate(-1)}>
            戻る
          </button>
        }
      />

      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span
            className={`badge ${
              data.is_correct ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
            }`}
          >
            {data.is_correct ? "正解" : "不正解"}
          </span>
          <span className="text-lg font-semibold">スコア: {data.score}</span>
          {data.time_spent_seconds != null && (
            <span className="text-sm text-slate-500">
              所要時間: {data.time_spent_seconds}秒
            </span>
          )}
        </div>

        {data.submitted_code && (
          <div>
            <h3 className="font-semibold mb-2">提出コード</h3>
            <pre className="bg-slate-900 text-slate-100 text-sm p-4 rounded overflow-auto">
              <code>{data.submitted_code}</code>
            </pre>
          </div>
        )}

        {data.answer && (
          <div>
            <h3 className="font-semibold mb-2">回答</h3>
            <pre className="bg-slate-50 text-sm p-4 rounded overflow-auto">
              {JSON.stringify(data.answer, null, 2)}
            </pre>
          </div>
        )}

        {data.ai_review && (
          <div>
            <h3 className="font-semibold mb-2">AIレビュー</h3>
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>{data.ai_review}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
