import { Link } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { getHistory } from "@/api/history";
import { queryKeys } from "@/lib/queryKeys";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/LoadingState";
import { getErrorMessage } from "@/lib/api";

export function HistoryPage() {
  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: queryKeys.history,
      queryFn: ({ pageParam }) => getHistory({ limit: 20, cursor: pageParam }),
      initialPageParam: null as string | null,
      getNextPageParam: (last) => last.next_cursor,
    });

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={getErrorMessage(error)} />;
  const items = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div>
      <PageHeader title="学習履歴" />
      {items.length === 0 ? (
        <EmptyState message="まだ提出した問題がありません" />
      ) : (
        <div className="card divide-y divide-slate-200">
          {items.map((a) => (
            <Link
              key={a.id}
              to={`/history/${a.id}`}
              className="flex items-center gap-4 p-4 hover:bg-slate-50"
            >
              <span
                className={clsx(
                  "badge",
                  a.is_correct
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-700",
                )}
              >
                {a.is_correct ? "正解" : "不正解"}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {a.lesson_title ?? "生成問題"}
                </div>
                <div className="text-xs text-slate-500">
                  {new Date(a.attempted_at).toLocaleString("ja-JP")}
                </div>
              </div>
              <span className="badge bg-slate-100 text-slate-600">{a.problem_source}</span>
              <span className="font-semibold text-slate-800">{a.score}点</span>
            </Link>
          ))}
        </div>
      )}
      {hasNextPage && (
        <div className="mt-4 text-center">
          <button
            className="btn-secondary"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "読み込み中..." : "もっと見る"}
          </button>
        </div>
      )}
    </div>
  );
}
