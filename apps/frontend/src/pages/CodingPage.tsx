import { useState } from "react";
import type { CodingQuestion, CodingRepository } from "@/types/coding";
import { RepositoryList } from "@/components/coding/RepositoryList";
import { IssueList } from "@/components/coding/IssueList";
import { Editor } from "@/components/coding/Editor";

type Mode =
  | { kind: "repos" }
  | { kind: "issues"; repository: CodingRepository }
  | { kind: "editor"; repository: CodingRepository; question: CodingQuestion };

export function CodingPage() {
  const [mode, setMode] = useState<Mode>({ kind: "repos" });

  if (mode.kind === "repos") {
    return (
      <RepositoryList
        onSelect={(repository) => setMode({ kind: "issues", repository })}
      />
    );
  }

  if (mode.kind === "issues") {
    return (
      <IssueList
        repository={mode.repository}
        onBack={() => setMode({ kind: "repos" })}
        onSelect={(question) =>
          setMode({ kind: "editor", repository: mode.repository, question })
        }
      />
    );
  }

  return (
    <Editor
      key={mode.question.id}
      question={mode.question}
      onBack={() => setMode({ kind: "issues", repository: mode.repository })}
    />
  );
}
