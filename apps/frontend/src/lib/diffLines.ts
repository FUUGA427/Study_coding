import type { CodeDiffLine } from "@/types/coding";

/**
 * LCS ベースの行単位 diff。
 * a = 古い側 (ユーザーコード)、b = 新しい側 (解答例) を想定。
 *  - 同じ行 → "unchanged"
 *  - a にしかない行 → "removed"
 *  - b にしかない行 → "added"
 */
export function diffLines(aText: string, bText: string): CodeDiffLine[] {
  const a = aText.split("\n");
  const b = bText.split("\n");
  const m = a.length;
  const n = b.length;

  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array<number>(n + 1).fill(0),
  );
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (a[i] === b[j]) dp[i][j] = 1 + dp[i + 1][j + 1];
      else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const out: CodeDiffLine[] = [];
  let i = 0;
  let j = 0;
  let oldLine = 1;
  let newLine = 1;
  while (i < m && j < n) {
    if (a[i] === b[j]) {
      out.push({ type: "unchanged", content: a[i], lineNumber: newLine });
      i++;
      j++;
      oldLine++;
      newLine++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ type: "removed", content: a[i], lineNumber: oldLine });
      i++;
      oldLine++;
    } else {
      out.push({ type: "added", content: b[j], lineNumber: newLine });
      j++;
      newLine++;
    }
  }
  while (i < m) {
    out.push({ type: "removed", content: a[i++], lineNumber: oldLine++ });
  }
  while (j < n) {
    out.push({ type: "added", content: b[j++], lineNumber: newLine++ });
  }
  return out;
}
