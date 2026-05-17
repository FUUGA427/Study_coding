import type {
  CodingDifficulty,
  CodingQuestion,
  CodingQuestionType,
  CodingRepository,
  CodingTestCase,
  Framework,
  HintCloseness,
  HintLevel,
  IssueStatus,
  Language,
  MonacoLanguage,
  SolutionExample,
  StepHint,
} from "@/types/coding";

/* =============================================================
 * Language / Framework メタ情報
 * ============================================================= */

export const LANGUAGE_LABEL: Record<Language, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
  sql: "SQL",
  html: "HTML",
  css: "CSS",
  go: "Go",
  java: "Java",
};

export const LANGUAGE_ICON: Record<Language, string> = {
  javascript: "⚡",
  typescript: "🔷",
  python: "🐍",
  sql: "🗄️",
  html: "🎨",
  css: "💅",
  go: "🐹",
  java: "☕",
};

export const FRAMEWORK_LABEL: Record<Framework, string> = {
  react: "React",
  next: "Next.js",
  vue: "Vue",
  nuxt: "Nuxt",
  node: "Node.js",
  express: "Express",
  nestjs: "NestJS",
  fastapi: "FastAPI",
  django: "Django",
  flask: "Flask",
  postgres: "PostgreSQL",
  mysql: "MySQL",
  sqlite: "SQLite",
  tailwind: "Tailwind CSS",
  "css-modules": "CSS Modules",
  sass: "Sass",
  gin: "Gin",
  echo: "Echo",
  "spring-boot": "Spring Boot",
};

export const LANGUAGE_MONACO: Record<Language, MonacoLanguage> = {
  javascript: "javascript",
  typescript: "typescript",
  python: "python",
  sql: "sql",
  html: "html",
  css: "css",
  go: "go",
  java: "java",
};

export const DIFFICULTY_LABEL: Record<CodingDifficulty, string> = {
  easy: "初級",
  normal: "中級",
  hard: "上級",
};

export const ISSUE_STATUS_LABEL: Record<IssueStatus, string> = {
  open: "Open",
  "in-progress": "In Progress",
  solved: "Solved",
};

export const QUESTION_TYPE_LABEL: Record<CodingQuestionType, string> = {
  "fill-blank": "穴埋め",
  implementation: "実装",
  refactor: "リファクタ",
  bugfix: "バグ修正",
};

/* =============================================================
 * Auto-generation helpers (dummy 段階用)
 * ============================================================= */

type BaseQ = Omit<CodingQuestion, "hints" | "solutionExamples" | "diff" | "testCases" | "explanation"> & {
  /** モデル解答 (autoSolutions のベース) */
  sampleSolution: string;
  /** 部分指定で渡せる */
  hints?: StepHint[];
  solutionExamples?: SolutionExample[];
  testCases?: CodingTestCase[];
  explanation?: string;
  diff?: CodingQuestion["diff"];
};

const truncate = (s: string, n: number) =>
  s.length > n ? s.slice(0, n).trimEnd() + " ..." : s;

const autoHints = (q: BaseQ): StepHint[] => {
  const tag = q.tags[0] ?? "基本";
  const closes: HintCloseness[] = [
    "concept",
    "focus",
    "implementation",
    "near-answer",
    "almost-answer",
  ];
  const contents = [
    `${tag} の基本イディオムから考えてみましょう。直接 API を書く前に「何を達成したいか」を1文で言語化すると整理できます。`,
    `${q.title} の核心は「${q.tags.join(" / ")}」です。空欄/TODOコメントから手をつけ、まず最小限の入出力に絞って実装してください。`,
    `${tag} の典型的なシンタックスを使うと自然に書けます。標準ライブラリやフレームワークの定番イディオムを思い出してください。`,
    "解答例の構造を思い浮かべると、必要な行は数行に収まります。最初に書く行と最後に書く行をイメージしましょう。",
    `最小実装はほぼこの形になります:\n${truncate(q.sampleSolution, 120)}`,
  ];
  const titles = [
    "Hint 1 — 考え方の方向性",
    "Hint 2 — 着目すべき箇所",
    "Hint 3 — 実装に近いヒント",
    "Hint 4 — ほぼ答え",
    "Hint 5 — 答え直前",
  ];
  return ([1, 2, 3, 4, 5] as HintLevel[]).map((level, i) => ({
    level,
    title: titles[i],
    content: contents[i],
    closeness: closes[i],
  }));
};

const autoSolutions = (q: BaseQ): SolutionExample[] => [
  {
    id: `${q.id}-recommended`,
    title: "実務で扱いやすい書き方",
    code: q.sampleSolution,
    explanation:
      "可読性と保守性を最優先した教科書的な実装です。チームレビューでも合意を取りやすい書き方。",
    points: [
      "意図がコードから読み取れる",
      "テストが書きやすい",
      "副作用が局所化されている",
    ],
    isRecommended: true,
  },
  {
    id: `${q.id}-functional`,
    title: "宣言的に書いた別解",
    code: `// 関数型寄りの別解例 (擬似コード)\n// map / filter / reduce などを使い宣言的にデータを流す書き方\n${q.sampleSolution}`,
    explanation:
      "データの流れが追いやすい宣言的な書き方。短くなる代わりに初学者にはやや読みにくいことがある。",
    points: ["副作用が少ない", "再利用性が高い"],
  },
];

const autoTestCases = (q: BaseQ): CodingTestCase[] => [
  { name: "ケース1 (基本)", input: "基本入力", expected: "想定通り", passed: true, actual: "想定通り" },
  { name: "ケース2 (典型)", input: "典型ケース", expected: "想定通り", passed: true, actual: "想定通り" },
  {
    name: `ケース3 (エッジ: ${q.tags[0] ?? "境界"})`,
    input: "エッジケース",
    expected: "想定通り",
    passed: false,
    actual: "想定外",
  },
];

const autoExplanation = (q: BaseQ): string =>
  `この問題は ${q.tags.join(" / ")} の理解度を確認します。${q.title} を解くことで「${q.tags[0] ?? "基本"}」を実装ベースで身につけられます。`;

const fill = (q: BaseQ): CodingQuestion => ({
  ...q,
  testCases: q.testCases ?? autoTestCases(q),
  hints: q.hints ?? autoHints(q),
  solutionExamples: q.solutionExamples ?? autoSolutions(q),
  diff: q.diff ?? [],
  explanation: q.explanation ?? autoExplanation(q),
});

/* =============================================================
 * Repositories
 * ============================================================= */

export const CODING_REPOSITORIES: CodingRepository[] = [
  {
    id: "repo-ts-react",
    name: "TypeScript / React",
    description: "Reactコンポーネント、Hooks、状態管理を実装ベースで学ぶ。",
    language: "typescript",
    framework: "react",
    tags: ["Hooks", "State", "Components"],
    difficultyRange: "初級〜中級",
    lastUpdated: "2 days ago",
    status: "active",
  },
  {
    id: "repo-ts-next",
    name: "TypeScript / Next.js",
    description: "App Router / Server Component / API Routes の基本を扱う。",
    language: "typescript",
    framework: "next",
    tags: ["App Router", "RSC", "API Routes"],
    difficultyRange: "中級",
    lastUpdated: "5 days ago",
    status: "active",
  },
  {
    id: "repo-ts",
    name: "TypeScript",
    description: "Generics / Union / 型推論など、フレームワーク非依存の型システム演習。",
    language: "typescript",
    tags: ["Generics", "Union", "型推論"],
    difficultyRange: "初級〜中級",
    lastUpdated: "1 day ago",
    status: "active",
  },
  {
    id: "repo-js",
    name: "JavaScript",
    description: "配列操作・非同期・イベントなどモダン JS の基礎演習。",
    language: "javascript",
    tags: ["配列", "Promise", "DOM"],
    difficultyRange: "初級〜中級",
    lastUpdated: "3 days ago",
    status: "active",
  },
  {
    id: "repo-py-fastapi",
    name: "Python / FastAPI",
    description: "API設計、Pydantic、依存性注入、ルーティングを実装で学ぶ。",
    language: "python",
    framework: "fastapi",
    tags: ["REST", "Pydantic", "Depends"],
    difficultyRange: "初級〜中級",
    lastUpdated: "1 day ago",
    status: "active",
  },
  {
    id: "repo-py-django",
    name: "Python / Django",
    description: "MVT パターン、ORM、URLルーティングなど Django の基本。",
    language: "python",
    framework: "django",
    tags: ["MVT", "ORM"],
    difficultyRange: "初級〜中級",
    lastUpdated: "12 days ago",
    status: "wip",
  },
  {
    id: "repo-py",
    name: "Python",
    description: "型ヒント・内包表記・クラスなど、Pythonの基本要素を扱う。",
    language: "python",
    tags: ["型ヒント", "内包表記", "OOP"],
    difficultyRange: "初級",
    lastUpdated: "3 days ago",
    status: "active",
  },
  {
    id: "repo-sql-postgres",
    name: "SQL / PostgreSQL",
    description: "SELECT / JOIN / GROUP BY など、SQLの基本を実問題で学ぶ。",
    language: "sql",
    framework: "postgres",
    tags: ["SELECT", "JOIN", "GROUP BY"],
    difficultyRange: "初級〜中級",
    lastUpdated: "6 days ago",
    status: "active",
  },
  {
    id: "repo-html-tailwind",
    name: "HTML / Tailwind CSS",
    description: "Tailwind を使った高速な UI 実装を体験する。",
    language: "html",
    framework: "tailwind",
    tags: ["Tailwind", "Flex", "Responsive"],
    difficultyRange: "初級",
    lastUpdated: "4 days ago",
    status: "active",
  },
  {
    id: "repo-html",
    name: "HTML / CSS",
    description: "セマンティックHTMLとCSSのレイアウト基礎。",
    language: "html",
    tags: ["Semantic", "Flexbox"],
    difficultyRange: "初級",
    lastUpdated: "9 days ago",
    status: "active",
  },
  {
    id: "repo-node-express",
    name: "JavaScript / Express",
    description: "Node.js + Express で REST API を実装する基礎。",
    language: "javascript",
    framework: "express",
    tags: ["Node.js", "Express", "REST"],
    difficultyRange: "初級〜中級",
    lastUpdated: "8 days ago",
    status: "wip",
  },
  {
    id: "repo-vue-nuxt",
    name: "TypeScript / Vue (Nuxt)",
    description: "Vue Composition API と Nuxt の基本(WIP)。",
    language: "typescript",
    framework: "vue",
    tags: ["Vue", "Nuxt"],
    difficultyRange: "中級",
    lastUpdated: "2 weeks ago",
    status: "wip",
  },
  {
    id: "repo-go-gin",
    name: "Go / Gin",
    description: "Go と Gin で HTTP サーバーを書く基本(WIP)。",
    language: "go",
    framework: "gin",
    tags: ["Go", "Gin", "HTTP"],
    difficultyRange: "中級",
    lastUpdated: "3 weeks ago",
    status: "wip",
  },
  {
    id: "repo-java-spring",
    name: "Java / Spring Boot",
    description: "Spring Boot で REST API を書く基本(WIP)。",
    language: "java",
    framework: "spring-boot",
    tags: ["Spring Boot", "DI", "REST"],
    difficultyRange: "中級〜上級",
    lastUpdated: "1 month ago",
    status: "wip",
  },
];

/* =============================================================
 * Questions
 * ============================================================= */

const showcaseUseStateHints: StepHint[] = [
  {
    level: 1,
    closeness: "concept",
    title: "Hint 1 — 考え方の方向性",
    content:
      "状態が変わる値を扱うときは、Reactでは通常の変数ではなく専用の仕組みを使います。",
  },
  {
    level: 2,
    closeness: "focus",
    title: "Hint 2 — 着目すべき箇所",
    content:
      "空欄になっている `______(0)` の部分に、Reactの状態管理Hookを入れる必要があります。",
  },
  {
    level: 3,
    closeness: "implementation",
    title: "Hint 3 — 実装に近いヒント",
    content:
      "Reactで状態を管理するには `useState` を使います。初期値は `0` にします。",
  },
  {
    level: 4,
    closeness: "near-answer",
    title: "Hint 4 — ほぼ答え",
    content: "`const [count, setCount] = useState(0);` の形を思い出してください。",
  },
  {
    level: 5,
    closeness: "almost-answer",
    title: "Hint 5 — 答え直前",
    content:
      "空欄には `useState` が入ります。つまり `______(0)` は `useState(0)` になります。",
  },
];

const showcaseUseStateSolutions: SolutionExample[] = [
  {
    id: "sol-usestate-recommended",
    title: "実務でよく使う基本的な書き方",
    code: `import { useState } from "react";

export function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}`,
    explanation:
      "useState で状態を持ち、onClick で setCount を呼んで状態を更新する基本形。",
    points: ["状態の宣言と更新のセット", "イベントハンドラから状態更新"],
    isRecommended: true,
  },
  {
    id: "sol-usestate-functional",
    title: "関数型更新を使った書き方",
    code: `import { useState } from "react";

export function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount((c) => c + 1)}>
      Count: {count}
    </button>
  );
}`,
    explanation:
      "setCount に前回値を受け取る関数を渡す書き方。連続更新やバッチ更新で安全。",
    points: ["前回値ベースで更新", "クロージャ問題を避けやすい"],
  },
  {
    id: "sol-usestate-extract",
    title: "ハンドラを切り出した実務寄りの書き方",
    code: `import { useState } from "react";

export function Counter() {
  const [count, setCount] = useState(0);
  const handleClick = () => setCount((c) => c + 1);
  return <button onClick={handleClick}>Count: {count}</button>;
}`,
    explanation:
      "ハンドラを変数に切り出すと再レンダリングごとの関数生成を抑えやすく、テストもしやすい。",
    points: ["責務分離", "テスト容易性"],
  },
];

const QUESTIONS: CodingQuestion[] = [
  // ============= TypeScript / React =============
  fill({
    id: "q-react-usestate-fill",
    repositoryId: "repo-ts-react",
    issueNumber: 1,
    title: "useState を使ってカウントアップを実装しよう",
    description:
      "useState を使って、ボタンを押すたびに数値が増えるカウンターを完成させてください。空欄に入る Hook 名を埋めてください。",
    language: "typescript",
    framework: "react",
    difficulty: "easy",
    type: "fill-blank",
    initialCode: `import { useState } from "react";

export function Counter() {
  const [count, setCount] = ______(0);
  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}
`,
    sampleSolution: `import { useState } from "react";

export function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}
`,
    estimatedMinutes: 10,
    status: "open",
    tags: ["React", "useState", "初級", "穴埋め"],
    hints: showcaseUseStateHints,
    solutionExamples: showcaseUseStateSolutions,
    testCases: [
      {
        name: "Test 1 — 初期表示",
        input: "render Counter",
        expected: "Count: 0",
        passed: true,
        actual: "Count: 0",
      },
      {
        name: "Test 2 — 1回クリック",
        input: "click button once",
        expected: "Count: 1",
        passed: true,
        actual: "Count: 1",
      },
      {
        name: "Test 3 — 2回クリック",
        input: "click button twice",
        expected: "Count: 2",
        passed: true,
        actual: "Count: 2",
      },
    ],
    explanation:
      "React で状態を持つには `useState` を使います。返り値は [現在値, 更新関数] のタプル。更新関数を呼ぶと再レンダリングが起き、UI が新しい値で描画されます。",
  }),
  fill({
    id: "q-react-props",
    repositoryId: "repo-ts-react",
    issueNumber: 2,
    title: "props を使ってコンポーネントに値を渡そう",
    description:
      "親から子コンポーネントに name を渡し、`Hello, {name}!` と表示できるよう Greet を実装してください。",
    language: "typescript",
    framework: "react",
    difficulty: "easy",
    type: "implementation",
    initialCode: `type GreetProps = { /* TODO */ };

export function Greet(/* TODO */) {
  return <div>{/* TODO */}</div>;
}
`,
    sampleSolution: `type GreetProps = { name: string };

export function Greet({ name }: GreetProps) {
  return <div>Hello, {name}!</div>;
}
`,
    estimatedMinutes: 15,
    status: "open",
    tags: ["React", "props", "初級", "実装問題"],
  }),
  fill({
    id: "q-react-useeffect",
    repositoryId: "repo-ts-react",
    issueNumber: 3,
    title: "useEffect でマウント時に1回だけ実行する",
    description:
      "コンポーネントのマウント時にだけ `console.log` を呼ぶ useEffect の依存配列を埋めてください。",
    language: "typescript",
    framework: "react",
    difficulty: "easy",
    type: "fill-blank",
    initialCode: `import { useEffect } from "react";

export function Logger() {
  useEffect(() => {
    console.log("mounted");
  }, /* TODO */);
  return null;
}
`,
    sampleSolution: `import { useEffect } from "react";

export function Logger() {
  useEffect(() => {
    console.log("mounted");
  }, []);
  return null;
}
`,
    estimatedMinutes: 10,
    status: "open",
    tags: ["React", "useEffect", "初級", "穴埋め"],
  }),

  // ============= TypeScript / Next.js =============
  fill({
    id: "q-next-link",
    repositoryId: "repo-ts-next",
    issueNumber: 1,
    title: "Next.js Link を使ったクライアント遷移",
    description:
      "Next.js でクライアントサイド遷移を行う Link コンポーネントを使い、'/about' へのリンクを実装してください。",
    language: "typescript",
    framework: "next",
    difficulty: "easy",
    type: "implementation",
    initialCode: `// TODO: next/link をインポート
export default function Home() {
  return <a href="/about">About</a>;
}
`,
    sampleSolution: `import Link from "next/link";

export default function Home() {
  return <Link href="/about">About</Link>;
}
`,
    estimatedMinutes: 10,
    status: "in-progress",
    tags: ["Next.js", "Link", "初級"],
  }),

  // ============= TypeScript =============
  fill({
    id: "q-ts-generic-first",
    repositoryId: "repo-ts",
    issueNumber: 1,
    title: "Generics で型安全な first<T> を実装",
    description: "任意の型 T の配列の先頭要素を返す型安全な関数 first<T> を実装してください。",
    language: "typescript",
    difficulty: "easy",
    type: "implementation",
    initialCode: `function first/* <T> */(arr: any[]): any {
  return arr[0];
}
`,
    sampleSolution: `function first<T>(arr: T[]): T | undefined {
  return arr[0];
}
`,
    estimatedMinutes: 12,
    status: "open",
    tags: ["TypeScript", "Generics", "初級"],
  }),
  fill({
    id: "q-ts-discriminated-union",
    repositoryId: "repo-ts",
    issueNumber: 2,
    title: "判別可能な Union 型で結果を扱う",
    description:
      "result.kind に応じて分岐する handleResult を実装してください。switch を使うと TypeScript が網羅性を判定してくれます。",
    language: "typescript",
    difficulty: "normal",
    type: "implementation",
    initialCode: `type Result =
  | { kind: "ok"; value: number }
  | { kind: "error"; message: string };

function handleResult(result: Result): string {
  // TODO
  return "";
}
`,
    sampleSolution: `type Result =
  | { kind: "ok"; value: number }
  | { kind: "error"; message: string };

function handleResult(result: Result): string {
  switch (result.kind) {
    case "ok":
      return \`OK: \${result.value}\`;
    case "error":
      return \`Error: \${result.message}\`;
  }
}
`,
    estimatedMinutes: 15,
    status: "open",
    tags: ["TypeScript", "Union", "中級"],
  }),

  // ============= JavaScript =============
  fill({
    id: "q-js-fizzbuzz",
    repositoryId: "repo-js",
    issueNumber: 1,
    title: "FizzBuzz を実装する",
    description:
      "1〜n を出力する関数 fizzBuzz を実装。3 の倍数で 'Fizz'、5 で 'Buzz'、両方の倍数で 'FizzBuzz'。",
    language: "javascript",
    difficulty: "easy",
    type: "implementation",
    initialCode: `function fizzBuzz(n) {
  for (let i = 1; i <= n; i++) {
    // TODO
  }
}

fizzBuzz(15);
`,
    sampleSolution: `function fizzBuzz(n) {
  for (let i = 1; i <= n; i++) {
    if (i % 15 === 0) console.log("FizzBuzz");
    else if (i % 3 === 0) console.log("Fizz");
    else if (i % 5 === 0) console.log("Buzz");
    else console.log(i);
  }
}

fizzBuzz(15);
`,
    estimatedMinutes: 12,
    status: "open",
    tags: ["JavaScript", "loop", "条件分岐", "初級"],
  }),
  fill({
    id: "q-js-unique",
    repositoryId: "repo-js",
    issueNumber: 2,
    title: "配列の重複を除去する unique を実装",
    description: "配列を受け取り重複を除去した新しい配列を返す関数 unique を実装してください。",
    language: "javascript",
    difficulty: "easy",
    type: "implementation",
    initialCode: `function unique(arr) {
  // TODO
}

console.log(unique([1, 2, 2, 3, 3, 3, 4]));
`,
    sampleSolution: `function unique(arr) {
  return [...new Set(arr)];
}

console.log(unique([1, 2, 2, 3, 3, 3, 4]));
`,
    estimatedMinutes: 10,
    status: "solved",
    tags: ["JavaScript", "Set", "配列", "初級"],
  }),

  // ============= Python / FastAPI =============
  fill({
    id: "q-fastapi-hello",
    repositoryId: "repo-py-fastapi",
    issueNumber: 1,
    title: "FastAPI で Hello エンドポイントを作る",
    description:
      "GET /hello に対して { 'message': 'Hello' } を返すエンドポイントを実装してください。",
    language: "python",
    framework: "fastapi",
    difficulty: "easy",
    type: "implementation",
    initialCode: `from fastapi import FastAPI

app = FastAPI()

# TODO: GET /hello を実装
`,
    sampleSolution: `from fastapi import FastAPI

app = FastAPI()


@app.get("/hello")
def hello():
    return {"message": "Hello"}
`,
    estimatedMinutes: 10,
    status: "open",
    tags: ["FastAPI", "GET", "初級"],
  }),
  fill({
    id: "q-fastapi-path-param",
    repositoryId: "repo-py-fastapi",
    issueNumber: 2,
    title: "Path Parameter を受け取る",
    description: "GET /users/{user_id} を作り、 user_id を { 'id': user_id } 形式で返してください。",
    language: "python",
    framework: "fastapi",
    difficulty: "easy",
    type: "implementation",
    initialCode: `from fastapi import FastAPI

app = FastAPI()

# TODO: GET /users/{user_id}
`,
    sampleSolution: `from fastapi import FastAPI

app = FastAPI()


@app.get("/users/{user_id}")
def get_user(user_id: int):
    return {"id": user_id}
`,
    estimatedMinutes: 10,
    status: "open",
    tags: ["FastAPI", "Path", "初級"],
  }),
  fill({
    id: "q-fastapi-pydantic",
    repositoryId: "repo-py-fastapi",
    issueNumber: 3,
    title: "Pydantic で POST リクエストを受ける",
    description:
      "POST /items で Item (name, price) を受け取り、そのまま返してください。Pydantic BaseModel を使うこと。",
    language: "python",
    framework: "fastapi",
    difficulty: "normal",
    type: "implementation",
    initialCode: `from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

# TODO: Item モデルと POST /items
`,
    sampleSolution: `from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()


class Item(BaseModel):
    name: str
    price: float


@app.post("/items")
def create_item(item: Item):
    return item
`,
    estimatedMinutes: 15,
    status: "open",
    tags: ["FastAPI", "Pydantic", "POST", "中級"],
  }),

  // ============= Python / Django =============
  fill({
    id: "q-django-view",
    repositoryId: "repo-py-django",
    issueNumber: 1,
    title: "Django View で JSON を返す",
    description:
      "Django の View で { 'message': 'Hello' } を JsonResponse で返すコードを書いてください。",
    language: "python",
    framework: "django",
    difficulty: "easy",
    type: "implementation",
    initialCode: `from django.http import JsonResponse

# TODO: hello ビューを実装
`,
    sampleSolution: `from django.http import JsonResponse


def hello(request):
    return JsonResponse({"message": "Hello"})
`,
    estimatedMinutes: 12,
    status: "open",
    tags: ["Django", "View", "初級"],
  }),

  // ============= Python =============
  fill({
    id: "q-py-sum",
    repositoryId: "repo-py",
    issueNumber: 1,
    title: "リストの合計を返す",
    description: "組み込み sum を使わずに、リストの合計を返す my_sum を実装してください。",
    language: "python",
    difficulty: "easy",
    type: "implementation",
    initialCode: `def my_sum(nums: list[int]) -> int:
    # TODO
    return 0

print(my_sum([1, 2, 3, 4, 5]))
`,
    sampleSolution: `def my_sum(nums: list[int]) -> int:
    total = 0
    for n in nums:
        total += n
    return total

print(my_sum([1, 2, 3, 4, 5]))
`,
    estimatedMinutes: 10,
    status: "open",
    tags: ["Python", "loop", "初級"],
  }),
  fill({
    id: "q-py-comprehension",
    repositoryId: "repo-py",
    issueNumber: 2,
    title: "内包表記で偶数の2乗",
    description: "リスト内包表記で、与えられたリストから偶数だけ抽出して2乗したリストを返してください。",
    language: "python",
    difficulty: "easy",
    type: "implementation",
    initialCode: `def even_squares(nums: list[int]) -> list[int]:
    # TODO
    return []

print(even_squares([1, 2, 3, 4, 5, 6]))
`,
    sampleSolution: `def even_squares(nums: list[int]) -> list[int]:
    return [n * n for n in nums if n % 2 == 0]

print(even_squares([1, 2, 3, 4, 5, 6]))
`,
    estimatedMinutes: 10,
    status: "open",
    tags: ["Python", "内包表記", "初級"],
  }),
  fill({
    id: "q-py-class",
    repositoryId: "repo-py",
    issueNumber: 3,
    title: "Person クラスと greet メソッド",
    description: "name と age を持つ Person クラスと、自己紹介する greet メソッドを実装してください。",
    language: "python",
    difficulty: "normal",
    type: "implementation",
    initialCode: `class Person:
    # TODO: __init__ を実装
    pass


p = Person("Alice", 30)
print(p.greet())
`,
    sampleSolution: `class Person:
    def __init__(self, name: str, age: int) -> None:
        self.name = name
        self.age = age

    def greet(self) -> str:
        return f"こんにちは、{self.name} ({self.age}) です。"


p = Person("Alice", 30)
print(p.greet())
`,
    estimatedMinutes: 15,
    status: "open",
    tags: ["Python", "class", "OOP", "中級"],
  }),

  // ============= SQL / PostgreSQL =============
  fill({
    id: "q-sql-select",
    repositoryId: "repo-sql-postgres",
    issueNumber: 1,
    title: "users テーブルから全件取得",
    description: "users テーブルから全レコードを取得する SQL を完成させてください。",
    language: "sql",
    framework: "postgres",
    difficulty: "easy",
    type: "fill-blank",
    initialCode: `______ * FROM users;`,
    sampleSolution: `SELECT * FROM users;`,
    estimatedMinutes: 5,
    status: "open",
    tags: ["SQL", "SELECT", "初級"],
  }),
  fill({
    id: "q-sql-join",
    repositoryId: "repo-sql-postgres",
    issueNumber: 2,
    title: "INNER JOIN で関連テーブルを結合",
    description: "users と orders を user_id で INNER JOIN し、user.name と order.total を取得してください。",
    language: "sql",
    framework: "postgres",
    difficulty: "normal",
    type: "implementation",
    initialCode: `SELECT u.name, o.total
FROM users u
-- TODO: JOIN
;`,
    sampleSolution: `SELECT u.name, o.total
FROM users u
INNER JOIN orders o ON o.user_id = u.id;`,
    estimatedMinutes: 12,
    status: "open",
    tags: ["SQL", "JOIN", "中級"],
  }),

  // ============= HTML / Tailwind =============
  fill({
    id: "q-tailwind-card",
    repositoryId: "repo-html-tailwind",
    issueNumber: 1,
    title: "Tailwind でカードレイアウト",
    description:
      "Tailwind だけで、影付き・角丸のカードを実装してください。タイトルと説明文を含めること。",
    language: "html",
    framework: "tailwind",
    difficulty: "easy",
    type: "implementation",
    initialCode: `<div class="">
  <h2>Card title</h2>
  <p>Description...</p>
</div>`,
    sampleSolution: `<div class="rounded-2xl shadow-md p-4 bg-white max-w-sm">
  <h2 class="text-lg font-semibold">Card title</h2>
  <p class="text-sm text-slate-600 mt-1">Description...</p>
</div>`,
    estimatedMinutes: 10,
    status: "open",
    tags: ["Tailwind", "Layout", "初級"],
  }),

  // ============= HTML / CSS =============
  fill({
    id: "q-html-flex-center",
    repositoryId: "repo-html",
    issueNumber: 1,
    title: "Flexbox で要素を中央寄せ",
    description: ".container 内の .box を縦横ともに中央寄せする CSS を書いてください。",
    language: "css",
    difficulty: "easy",
    type: "implementation",
    initialCode: `.container {
  /* TODO */
  height: 200px;
}
.box {
  width: 80px;
  height: 80px;
}
`,
    sampleSolution: `.container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}
.box {
  width: 80px;
  height: 80px;
}
`,
    estimatedMinutes: 8,
    status: "open",
    tags: ["CSS", "Flexbox", "初級"],
  }),

  // ============= Node.js / Express (WIP) =============
  fill({
    id: "q-express-hello",
    repositoryId: "repo-node-express",
    issueNumber: 1,
    title: "Express で GET /hello を作る",
    description:
      "Express で GET /hello に対して { message: 'Hello' } を返すルートを書いてください。",
    language: "javascript",
    framework: "express",
    difficulty: "easy",
    type: "implementation",
    initialCode: `const express = require("express");
const app = express();

// TODO: GET /hello

app.listen(3000);
`,
    sampleSolution: `const express = require("express");
const app = express();

app.get("/hello", (req, res) => {
  res.json({ message: "Hello" });
});

app.listen(3000);
`,
    estimatedMinutes: 10,
    status: "open",
    tags: ["Node.js", "Express", "初級"],
  }),

  // ============= Vue / Nuxt (WIP) =============
  fill({
    id: "q-vue-counter",
    repositoryId: "repo-vue-nuxt",
    issueNumber: 1,
    title: "Vue Composition API でカウンター",
    description: "ref を使って <button @click=\"count++\">+</button> でインクリメントするカウンターを書いてください。",
    language: "typescript",
    framework: "vue",
    difficulty: "easy",
    type: "implementation",
    initialCode: `<script setup lang="ts">
// TODO: ref を使う
</script>

<template>
  <button>+</button>
</template>
`,
    sampleSolution: `<script setup lang="ts">
import { ref } from "vue";
const count = ref(0);
</script>

<template>
  <button @click="count++">Count: {{ count }}</button>
</template>
`,
    estimatedMinutes: 12,
    status: "open",
    tags: ["Vue", "ref", "初級"],
  }),

  // ============= Go / Gin (WIP) =============
  fill({
    id: "q-go-gin-hello",
    repositoryId: "repo-go-gin",
    issueNumber: 1,
    title: "Gin で GET /hello",
    description: "Gin の Default ルーターで GET /hello に {\"message\":\"Hello\"} を返してください。",
    language: "go",
    framework: "gin",
    difficulty: "easy",
    type: "implementation",
    initialCode: `package main

import "github.com/gin-gonic/gin"

func main() {
    r := gin.Default()
    // TODO: GET /hello
    r.Run()
}
`,
    sampleSolution: `package main

import "github.com/gin-gonic/gin"

func main() {
    r := gin.Default()
    r.GET("/hello", func(c *gin.Context) {
        c.JSON(200, gin.H{"message": "Hello"})
    })
    r.Run()
}
`,
    estimatedMinutes: 15,
    status: "open",
    tags: ["Go", "Gin", "初級"],
  }),

  // ============= Java / Spring Boot (WIP) =============
  fill({
    id: "q-java-spring-controller",
    repositoryId: "repo-java-spring",
    issueNumber: 1,
    title: "Spring Boot で REST Controller",
    description: "@RestController と @GetMapping を使い、/hello で \"Hello\" を返してください。",
    language: "java",
    framework: "spring-boot",
    difficulty: "easy",
    type: "implementation",
    initialCode: `import org.springframework.web.bind.annotation.*;

// TODO: RestController を実装
public class HelloController {
}
`,
    sampleSolution: `import org.springframework.web.bind.annotation.*;

@RestController
public class HelloController {
    @GetMapping("/hello")
    public String hello() {
        return "Hello";
    }
}
`,
    estimatedMinutes: 15,
    status: "open",
    tags: ["Java", "Spring Boot", "初級"],
  }),
];

export const CODING_QUESTIONS: CodingQuestion[] = QUESTIONS;

/* =============================================================
 * Lookups (将来は API 化する想定の中継関数)
 * ============================================================= */

export const fetchRepositories = async (): Promise<CodingRepository[]> =>
  CODING_REPOSITORIES;

export const fetchQuestionsByRepository = async (
  repositoryId: string,
): Promise<CodingQuestion[]> =>
  CODING_QUESTIONS.filter((q) => q.repositoryId === repositoryId);

export const fetchRepository = async (
  repositoryId: string,
): Promise<CodingRepository | null> =>
  CODING_REPOSITORIES.find((r) => r.id === repositoryId) ?? null;

export const fetchQuestion = async (
  questionId: string,
): Promise<CodingQuestion | null> =>
  CODING_QUESTIONS.find((q) => q.id === questionId) ?? null;
