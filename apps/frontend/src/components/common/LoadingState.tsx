export function LoadingState({ label = "読み込み中..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-16 text-slate-500">
      <div className="h-5 w-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mr-3" />
      {label}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="card p-4 border-red-200 bg-red-50 text-red-700 text-sm">{message}</div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return <div className="card p-8 text-center text-slate-500 text-sm">{message}</div>;
}
