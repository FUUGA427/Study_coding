import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { getReviewResult } from "@/api/aiReview";
import { queryKeys } from "@/lib/queryKeys";

export function AiReviewPanel({ taskId }: { taskId: string }) {
  const { data, error } = useQuery({
    queryKey: queryKeys.reviewTask(taskId),
    queryFn: () => getReviewResult(taskId),
    refetchInterval: (q) => {
      const s = q.state.data?.status;
      return s === "completed" || s === "failed" ? false : 2000;
    },
  });

  if (error) {
    return <div className="text-sm text-red-600">AIレビュー取得に失敗しました</div>;
  }
  if (!data || data.status === "pending" || data.status === "processing") {
    return (
      <div className="flex items-center text-sm text-slate-600">
        <div className="h-4 w-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mr-2" />
        AIレビュー生成中...
      </div>
    );
  }
  if (data.status === "failed") {
    return (
      <div className="text-sm text-red-600">
        AIレビュー生成に失敗しました: {data.error_message ?? "不明なエラー"}
      </div>
    );
  }
  return (
    <div className="prose prose-sm max-w-none">
      <ReactMarkdown>{data.review ?? ""}</ReactMarkdown>
    </div>
  );
}
