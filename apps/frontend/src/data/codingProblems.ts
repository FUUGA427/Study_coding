export type CodingLanguageId =
  | "javascript"
  | "typescript"
  | "python"
  | "react"
  | "html"
  | "fastapi";

/** Monaco editor 用の言語名 */
export type MonacoLanguage =
  | "javascript"
  | "typescript"
  | "python"
  | "html"
  | "css"
  | "json";

export type CodingLanguage = {
  id: CodingLanguageId;
  label: string;
  icon: string;
  monaco: MonacoLanguage;
  description: string;
};

export type CodingDifficulty = "easy" | "normal" | "hard";

export type CodingProblem = {
  id: string;
  languageId: CodingLanguageId;
  title: string;
  description: string;
  difficulty: CodingDifficulty;
  starterCode: string;
  /** モデル解答 (採点ではなく参考用) */
  sampleSolution: string;
  tags: string[];
};

export const CODING_LANGUAGES: CodingLanguage[] = [
  {
    id: "javascript",
    label: "JavaScript",
    icon: "⚡",
    monaco: "javascript",
    description: "ES2015+ のモダン JavaScript",
  },
  {
    id: "typescript",
    label: "TypeScript",
    icon: "🔷",
    monaco: "typescript",
    description: "型付き JavaScript",
  },
  {
    id: "python",
    label: "Python",
    icon: "🐍",
    monaco: "python",
    description: "Python 3.x",
  },
  {
    id: "react",
    label: "React",
    icon: "⚛️",
    monaco: "typescript",
    description: "Hooks ベースの関数コンポーネント",
  },
  {
    id: "html",
    label: "HTML / CSS",
    icon: "🎨",
    monaco: "html",
    description: "HTML マークアップ + CSS スタイル",
  },
  {
    id: "fastapi",
    label: "FastAPI",
    icon: "🚀",
    monaco: "python",
    description: "FastAPI による REST API",
  },
];

export const CODING_PROBLEMS: CodingProblem[] = [
  // ----- JavaScript -----
  {
    id: "js-fizzbuzz",
    languageId: "javascript",
    title: "FizzBuzz",
    description:
      "1〜n までの数を出力する関数 fizzBuzz(n) を実装してください。\n3 の倍数は 'Fizz'、5 の倍数は 'Buzz'、両方の倍数は 'FizzBuzz' を出力します。",
    difficulty: "easy",
    starterCode: `function fizzBuzz(n) {
  for (let i = 1; i <= n; i++) {
    // ここに実装
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
    tags: ["loop", "条件分岐"],
  },
  {
    id: "js-array-unique",
    languageId: "javascript",
    title: "配列の重複を除去",
    description: "配列を受け取り重複を除去した新しい配列を返す関数 unique を実装してください。",
    difficulty: "easy",
    starterCode: `function unique(arr) {
  // ここに実装
}

console.log(unique([1, 2, 2, 3, 3, 3, 4]));
`,
    sampleSolution: `function unique(arr) {
  return [...new Set(arr)];
}

console.log(unique([1, 2, 2, 3, 3, 3, 4]));
`,
    tags: ["Set", "配列"],
  },
  {
    id: "js-promise-all",
    languageId: "javascript",
    title: "Promise.all で並列実行",
    description:
      "ユーザーIDの配列を受け取り、Promise.all で全ユーザー情報を並列取得する関数を完成させてください。",
    difficulty: "normal",
    starterCode: `async function fetchUsers(ids) {
  // ヒント: ids.map で Promise の配列を作り、Promise.all で待つ
}

fetchUsers([1, 2, 3]).then(console.log);
`,
    sampleSolution: `async function fetchUsers(ids) {
  return Promise.all(
    ids.map((id) => fetch(\`/api/users/\${id}\`).then((r) => r.json())),
  );
}

fetchUsers([1, 2, 3]).then(console.log);
`,
    tags: ["Promise", "非同期"],
  },

  // ----- TypeScript -----
  {
    id: "ts-generic-array",
    languageId: "typescript",
    title: "Generics で型安全な配列ユーティリティ",
    description: "任意の型 T の配列の先頭要素を返す関数 first<T> を実装してください。",
    difficulty: "easy",
    starterCode: `function first/* <T> */(arr: any[]): any {
  return arr[0];
}

const n = first([1, 2, 3]);
const s = first(["a", "b"]);
`,
    sampleSolution: `function first<T>(arr: T[]): T | undefined {
  return arr[0];
}

const n = first([1, 2, 3]);          // number | undefined
const s = first(["a", "b"]);         // string | undefined
`,
    tags: ["Generics"],
  },
  {
    id: "ts-discriminated-union",
    languageId: "typescript",
    title: "判別可能な Union 型",
    description:
      "result.kind に応じて正しい分岐ができる関数 handleResult を実装してください。",
    difficulty: "normal",
    starterCode: `type Result =
  | { kind: "ok"; value: number }
  | { kind: "error"; message: string };

function handleResult(result: Result): string {
  // ここに実装
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
    tags: ["Union", "Discriminated"],
  },

  // ----- Python -----
  {
    id: "py-sum",
    languageId: "python",
    title: "リストの合計",
    description: "リストを受け取り合計を返す関数 my_sum を実装してください(組み込み sum 不使用で)。",
    difficulty: "easy",
    starterCode: `def my_sum(nums: list[int]) -> int:
    # ここに実装
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
    tags: ["loop", "list"],
  },
  {
    id: "py-comprehension",
    languageId: "python",
    title: "内包表記で偶数の2乗",
    description:
      "リスト内包表記を使って、与えられたリストから偶数だけ抽出して2乗したリストを返してください。",
    difficulty: "easy",
    starterCode: `def even_squares(nums: list[int]) -> list[int]:
    # ここに内包表記で実装
    return []

print(even_squares([1, 2, 3, 4, 5, 6]))
`,
    sampleSolution: `def even_squares(nums: list[int]) -> list[int]:
    return [n * n for n in nums if n % 2 == 0]

print(even_squares([1, 2, 3, 4, 5, 6]))
`,
    tags: ["内包表記"],
  },
  {
    id: "py-class",
    languageId: "python",
    title: "クラスの基本",
    description: "name と age を持つ Person クラスと、自己紹介する greet メソッドを実装してください。",
    difficulty: "normal",
    starterCode: `class Person:
    # __init__ を実装
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
    tags: ["class", "OOP"],
  },

  // ----- React -----
  {
    id: "react-counter",
    languageId: "react",
    title: "カウンター",
    description: "useState を使って増減できるカウンターコンポーネントを実装してください。",
    difficulty: "easy",
    starterCode: `import { useState } from "react";

export function Counter() {
  // useState を使ってカウンターを実装
  return (
    <div>
      <button>-</button>
      <span>0</span>
      <button>+</button>
    </div>
  );
}
`,
    sampleSolution: `import { useState } from "react";

export function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div className="flex items-center gap-2">
      <button onClick={() => setCount((c) => c - 1)}>-</button>
      <span>{count}</span>
      <button onClick={() => setCount((c) => c + 1)}>+</button>
    </div>
  );
}
`,
    tags: ["useState"],
  },
  {
    id: "react-todo",
    languageId: "react",
    title: "シンプルなTODOリスト",
    description: "入力フォームと表示リストを持つ最小限の TodoList を実装してください。",
    difficulty: "normal",
    starterCode: `import { useState } from "react";

export function TodoList() {
  // input と todos の state を作成
  return (
    <div>
      <input placeholder="やること" />
      <button>追加</button>
      <ul></ul>
    </div>
  );
}
`,
    sampleSolution: `import { useState } from "react";

export function TodoList() {
  const [input, setInput] = useState("");
  const [todos, setTodos] = useState<string[]>([]);

  const add = () => {
    if (!input.trim()) return;
    setTodos((t) => [...t, input.trim()]);
    setInput("");
  };

  return (
    <div>
      <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="やること" />
      <button onClick={add}>追加</button>
      <ul>
        {todos.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
    </div>
  );
}
`,
    tags: ["useState", "フォーム"],
  },

  // ----- HTML / CSS -----
  {
    id: "html-card",
    languageId: "html",
    title: "カードレイアウト",
    description:
      "画像 + タイトル + 説明 + ボタンを持つカードを HTML + CSS で作ってください。Flexbox か Grid で中央寄せ。",
    difficulty: "easy",
    starterCode: `<!doctype html>
<html>
<head>
  <style>
    /* ここにスタイル */
  </style>
</head>
<body>
  <div class="card">
    <!-- ここに構造 -->
  </div>
</body>
</html>
`,
    sampleSolution: `<!doctype html>
<html>
<head>
  <style>
    body { display: flex; justify-content: center; padding: 40px; font-family: sans-serif; }
    .card {
      width: 280px; border-radius: 12px; overflow: hidden;
      box-shadow: 0 6px 20px rgba(0,0,0,.08);
    }
    .card img { width: 100%; display: block; }
    .card .body { padding: 16px; }
    .card h2 { margin: 0 0 4px; font-size: 16px; }
    .card p { margin: 0 0 12px; color: #555; font-size: 13px; }
    .card button { background: #3b5bdb; color: white; border: 0; padding: 8px 12px; border-radius: 6px; }
  </style>
</head>
<body>
  <div class="card">
    <img src="https://picsum.photos/280/160" alt="" />
    <div class="body">
      <h2>カードタイトル</h2>
      <p>カードの説明文。余白と影でリッチな見た目に。</p>
      <button>詳細を見る</button>
    </div>
  </div>
</body>
</html>
`,
    tags: ["HTML", "CSS", "Flexbox"],
  },

  // ----- FastAPI -----
  {
    id: "fastapi-hello",
    languageId: "fastapi",
    title: "FastAPI で Hello World",
    description: "FastAPI で GET /hello を作り、 { \"message\": \"Hello\" } を返してください。",
    difficulty: "easy",
    starterCode: `from fastapi import FastAPI

app = FastAPI()

# GET /hello を実装
`,
    sampleSolution: `from fastapi import FastAPI

app = FastAPI()


@app.get("/hello")
def hello():
    return {"message": "Hello"}
`,
    tags: ["FastAPI", "GET"],
  },
  {
    id: "fastapi-path-param",
    languageId: "fastapi",
    title: "Path Parameter で User 取得",
    description: "GET /users/{user_id} を作り、 user_id をそのまま返してください。",
    difficulty: "easy",
    starterCode: `from fastapi import FastAPI

app = FastAPI()

# GET /users/{user_id} を実装
`,
    sampleSolution: `from fastapi import FastAPI

app = FastAPI()


@app.get("/users/{user_id}")
def get_user(user_id: int):
    return {"id": user_id}
`,
    tags: ["FastAPI", "Path"],
  },
  {
    id: "fastapi-pydantic",
    languageId: "fastapi",
    title: "Pydantic で POST リクエスト",
    description:
      "POST /items で受け取った Item (name, price) をそのまま返してください。Pydantic BaseModel を使うこと。",
    difficulty: "normal",
    starterCode: `from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

# Item モデルと POST /items を実装
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
    tags: ["FastAPI", "Pydantic", "POST"],
  },
];

export const fetchCodingProblems = async (
  languageId: CodingLanguageId,
): Promise<CodingProblem[]> => {
  return CODING_PROBLEMS.filter((p) => p.languageId === languageId);
};
