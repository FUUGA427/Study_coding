export type ApiError = {
  detail: string | { msg: string; loc?: (string | number)[] }[];
};

export type AsyncTaskStatus = "pending" | "processing" | "completed" | "failed";
