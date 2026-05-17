import { useMemo, useState } from "react";
import clsx from "clsx";
import type { Question, QuestionType } from "@/types/catalog";

type Props = {
  index: number;
  total: number;
  question: Question;
  onAdvance: () => void;
};

const QUESTION_TYPE_LABEL: Record<QuestionType, string> = {
  choice: "選択式",
  "multiple-choice": "複数選択",
  text: "記述式",
  code: "コード穴埋め",
};

const QUESTION_TYPE_CLASS: Record<QuestionType, string> = {
  choice: "bg-blue-100 text-blue-700",
  "multiple-choice": "bg-purple-100 text-purple-700",
  text: "bg-amber-100 text-amber-700",
  code: "bg-emerald-100 text-emerald-700",
};

const DIFFICULTY_LABEL: Record<Question["difficulty"], string> = {
  easy: "易",
  normal: "中",
  hard: "難",
};

const DIFFICULTY_CLASS: Record<Question["difficulty"], string> = {
  easy: "bg-emerald-50 text-emerald-700",
  normal: "bg-slate-100 text-slate-600",
  hard: "bg-rose-50 text-rose-700",
};

export function QuestionItem({ index, total, question, onAdvance }: Props) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <header className="flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
          {index + 1}
        </span>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={clsx(
                "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                QUESTION_TYPE_CLASS[question.type],
              )}
            >
              {QUESTION_TYPE_LABEL[question.type]}
            </span>
            <span
              className={clsx(
                "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                DIFFICULTY_CLASS[question.difficulty],
              )}
            >
              難易度: {DIFFICULTY_LABEL[question.difficulty]}
            </span>
            <span className="text-[11px] text-slate-500">
              {index + 1} / {total}
            </span>
          </div>
          <h3 className="mt-1 text-sm font-bold text-slate-900">{question.title}</h3>
          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
            {question.description}
          </p>
        </div>
      </header>
      <div className="mt-4">{renderBody(question, onAdvance)}</div>
    </article>
  );
}

function renderBody(question: Question, onAdvance: () => void) {
  switch (question.type) {
    case "choice":
      return <ChoiceBody question={question} onAdvance={onAdvance} />;
    case "multiple-choice":
      return <MultipleChoiceBody question={question} onAdvance={onAdvance} />;
    case "text":
      return <TextBody question={question} onAdvance={onAdvance} />;
    case "code":
      return <CodeBody question={question} onAdvance={onAdvance} />;
  }
}

function Feedback({
  correct,
  explanation,
}: {
  correct: boolean | null;
  explanation?: string;
}) {
  if (correct === null) return null;
  return (
    <div
      role="status"
      className={clsx(
        "mt-3 rounded-lg p-3 text-sm",
        correct
          ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
          : "bg-rose-50 text-rose-800 ring-1 ring-rose-200",
      )}
    >
      <div className="font-semibold">
        {correct ? "正解 🎉" : "不正解 — もう一度挑戦してみましょう"}
      </div>
      {explanation && <div className="mt-1 text-slate-700">{explanation}</div>}
    </div>
  );
}

function PrimaryButton({
  onClick,
  disabled,
  label,
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-full bg-brand-500 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-slate-300"
    >
      {label}
    </button>
  );
}

function GhostButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50"
    >
      {label}
    </button>
  );
}

function AdvanceButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-600"
      autoFocus
    >
      次の問題へ →
    </button>
  );
}

// -------- choice (single) --------
function ChoiceBody({
  question,
  onAdvance,
}: {
  question: Question;
  onAdvance: () => void;
}) {
  const choices = question.choices ?? [];
  const expected = typeof question.answer === "string" ? question.answer : question.answer[0] ?? "";
  const [selected, setSelected] = useState<string | null>(null);
  const [correct, setCorrect] = useState<boolean | null>(null);

  const handleSubmit = () => {
    if (selected === null) return;
    setCorrect(selected === expected);
  };
  const handleRetry = () => {
    setSelected(null);
    setCorrect(null);
  };

  return (
    <div>
      <div role="radiogroup" className="space-y-2">
        {choices.map((label) => {
          const checked = selected === label;
          const isCorrect = correct !== null && label === expected;
          const isWrong = correct === false && checked;
          return (
            <label
              key={label}
              className={clsx(
                "flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-sm transition",
                "border-slate-200 hover:bg-slate-50",
                checked && correct === null && "border-brand-400 bg-brand-50",
                isCorrect && "border-emerald-400 bg-emerald-50",
                isWrong && "border-rose-400 bg-rose-50",
              )}
            >
              <input
                type="radio"
                name={question.id}
                checked={checked}
                onChange={() => setSelected(label)}
                disabled={correct !== null}
                className="mt-0.5"
              />
              <span className="flex-1 whitespace-pre-wrap">{label}</span>
            </label>
          );
        })}
      </div>
      <div className="mt-3 flex gap-2">
        {correct === null && (
          <PrimaryButton onClick={handleSubmit} disabled={selected === null} label="回答する" />
        )}
        {correct === false && (
          <>
            <GhostButton onClick={handleRetry} label="もう一度" />
            <AdvanceButton onClick={onAdvance} />
          </>
        )}
        {correct === true && <AdvanceButton onClick={onAdvance} />}
      </div>
      <Feedback correct={correct} explanation={question.explanation} />
    </div>
  );
}

// -------- multiple-choice --------
function MultipleChoiceBody({
  question,
  onAdvance,
}: {
  question: Question;
  onAdvance: () => void;
}) {
  const choices = question.choices ?? [];
  const expectedList = useMemo(
    () => (Array.isArray(question.answer) ? question.answer : [question.answer]),
    [question.answer],
  );
  const expectedSet = useMemo(() => new Set(expectedList), [expectedList]);

  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [correct, setCorrect] = useState<boolean | null>(null);

  const toggle = (label: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };
  const handleSubmit = () => {
    const same =
      selected.size === expectedSet.size && [...selected].every((s) => expectedSet.has(s));
    setCorrect(same);
  };
  const handleRetry = () => {
    setSelected(new Set());
    setCorrect(null);
  };

  return (
    <div>
      <div className="space-y-2">
        {choices.map((label) => {
          const checked = selected.has(label);
          const isCorrectOpt = expectedSet.has(label);
          const showCorrect = correct !== null && isCorrectOpt;
          const showWrong = correct !== null && checked && !isCorrectOpt;
          return (
            <label
              key={label}
              className={clsx(
                "flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-sm transition",
                "border-slate-200 hover:bg-slate-50",
                checked && correct === null && "border-brand-400 bg-brand-50",
                showCorrect && "border-emerald-400 bg-emerald-50",
                showWrong && "border-rose-400 bg-rose-50",
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(label)}
                disabled={correct !== null}
                className="mt-0.5"
              />
              <span className="flex-1 whitespace-pre-wrap">{label}</span>
            </label>
          );
        })}
      </div>
      <div className="mt-3 flex gap-2">
        {correct === null && (
          <PrimaryButton onClick={handleSubmit} disabled={selected.size === 0} label="回答する" />
        )}
        {correct === false && (
          <>
            <GhostButton onClick={handleRetry} label="もう一度" />
            <AdvanceButton onClick={onAdvance} />
          </>
        )}
        {correct === true && <AdvanceButton onClick={onAdvance} />}
      </div>
      <Feedback correct={correct} explanation={question.explanation} />
    </div>
  );
}

// -------- text --------
function TextBody({ question, onAdvance }: { question: Question; onAdvance: () => void }) {
  const sample = Array.isArray(question.answer) ? question.answer.join("\n") : question.answer;
  const [value, setValue] = useState("");
  const [revealed, setRevealed] = useState(false);

  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        placeholder="自分の言葉で答えてみましょう"
        className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
      <div className="mt-3 flex gap-2">
        {!revealed ? (
          <PrimaryButton onClick={() => setRevealed(true)} label="解答例を見る" />
        ) : (
          <AdvanceButton onClick={onAdvance} />
        )}
      </div>
      {revealed && (
        <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm ring-1 ring-slate-200">
          <div className="text-xs font-semibold text-slate-500">解答例</div>
          <p className="mt-1 whitespace-pre-wrap text-slate-800">{sample}</p>
          {question.explanation && (
            <p className="mt-2 text-xs text-slate-600">{question.explanation}</p>
          )}
        </div>
      )}
    </div>
  );
}

// -------- code (blank fill) --------
function CodeBody({ question, onAdvance }: { question: Question; onAdvance: () => void }) {
  const template = question.codeTemplate ?? "";
  const expectedAnswers = useMemo(
    () => (Array.isArray(question.answer) ? question.answer : [question.answer]),
    [question.answer],
  );
  const blankCount = expectedAnswers.length;

  const [values, setValues] = useState<string[]>(() => Array(blankCount).fill(""));
  const [correct, setCorrect] = useState<boolean | null>(null);

  const handleSubmit = () => {
    const allCorrect = expectedAnswers.every((a, i) => (values[i] ?? "").trim() === a);
    setCorrect(allCorrect);
  };
  const handleRetry = () => {
    setValues(Array(blankCount).fill(""));
    setCorrect(null);
  };

  return (
    <div>
      <pre className="overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs leading-relaxed text-slate-100">
        <code className="font-mono">{template}</code>
      </pre>
      <div className="mt-3 space-y-2">
        {expectedAnswers.map((expected, i) => {
          const value = values[i] ?? "";
          const isBlankCorrect = correct !== null && value.trim() === expected;
          return (
            <div key={i} className="flex items-center gap-2 text-sm">
              <label className="w-16 text-xs text-slate-500" htmlFor={`${question.id}-blank-${i}`}>
                穴 {i + 1}
              </label>
              <input
                id={`${question.id}-blank-${i}`}
                type="text"
                value={value}
                onChange={(e) =>
                  setValues((prev) => {
                    const next = [...prev];
                    next[i] = e.target.value;
                    return next;
                  })
                }
                disabled={correct !== null}
                placeholder="答えを入力"
                className={clsx(
                  "flex-1 rounded-md border px-2 py-1 font-mono focus:outline-none focus:ring-2 focus:ring-brand-500",
                  correct === null && "border-slate-200",
                  correct !== null && isBlankCorrect && "border-emerald-400 bg-emerald-50",
                  correct !== null && !isBlankCorrect && "border-rose-400 bg-rose-50",
                )}
              />
              {correct !== null && !isBlankCorrect && (
                <span className="text-xs text-slate-500">
                  正解: <code className="font-mono">{expected}</code>
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex gap-2">
        {correct === null && (
          <PrimaryButton
            onClick={handleSubmit}
            disabled={values.some((v) => !v.trim())}
            label="回答する"
          />
        )}
        {correct === false && (
          <>
            <GhostButton onClick={handleRetry} label="もう一度" />
            <AdvanceButton onClick={onAdvance} />
          </>
        )}
        {correct === true && <AdvanceButton onClick={onAdvance} />}
      </div>
      <Feedback correct={correct} explanation={question.explanation} />
    </div>
  );
}
