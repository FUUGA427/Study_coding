import type {
  Course,
  CourseCatalogResponse,
  Lesson,
  Question,
  QuestionDifficulty,
  QuestionType,
} from "@/types/catalog";

const CATEGORY_COLOR: Record<Course["category"], string> = {
  frontend: "from-pink-400 to-fuchsia-500",
  backend: "from-indigo-400 to-blue-600",
  ai: "from-purple-500 via-fuchsia-500 to-cyan-400",
  database: "from-emerald-400 to-teal-500",
  infra: "from-sky-400 to-indigo-500",
  testing: "from-amber-400 to-orange-500",
  practice: "from-rose-400 to-red-500",
};

type QuestionInit = {
  id: string;
  type: QuestionType;
  title: string;
  description: string;
  choices?: string[];
  answer: string | string[];
  explanation: string;
  difficulty?: QuestionDifficulty;
  codeTemplate?: string;
};

const q = (init: QuestionInit): Question => ({
  difficulty: "normal",
  ...init,
});

// ============================== Frontend ==============================

const htmlCssQuestions: Question[] = [
  q({
    id: "q-html-heading",
    type: "choice",
    title: "見出しタグ",
    description: "HTMLで見出しを表すタグはどれ?",
    choices: ["<p>", "<h1>", "<div>", "<span>"],
    answer: "<h1>",
    explanation: "<h1>〜<h6> が見出し用のタグ。",
    difficulty: "easy",
  }),
  q({
    id: "q-html-link",
    type: "choice",
    title: "リンク作成",
    description: "HTMLでリンクを作成するタグは?",
    choices: ["<link>", "<href>", "<a>", "<nav>"],
    answer: "<a>",
    explanation: "<a href=\"...\"> がアンカータグ。",
    difficulty: "easy",
  }),
  q({
    id: "q-css-color",
    type: "choice",
    title: "文字色プロパティ",
    description: "CSSで文字色を変更するプロパティは?",
    choices: ["font-color", "text-color", "color", "foreground"],
    answer: "color",
    explanation: "文字色は `color` プロパティ。",
    difficulty: "easy",
  }),
  q({
    id: "q-css-bg",
    type: "choice",
    title: "背景色プロパティ",
    description: "CSSで背景色を変更するプロパティは?",
    choices: ["bg-color", "background-color", "color-bg", "fill"],
    answer: "background-color",
    explanation: "背景色は `background-color`。",
    difficulty: "easy",
  }),
  q({
    id: "q-css-flex",
    type: "choice",
    title: "Flexbox",
    description: "flexbox で要素を横並びにする時、コンテナに指定するプロパティは?",
    choices: ["display: block", "display: inline", "display: flex", "position: absolute"],
    answer: "display: flex",
    explanation: "親要素に `display: flex` を指定する。",
  }),
  q({
    id: "q-class-id",
    type: "text",
    title: "class と id の違い",
    description: "class 属性と id 属性の違いを説明してください。",
    answer:
      "class は複数要素に付与可能で共通スタイルに使う。id は1ページ内でユニークで、ページ内リンクや JS から特定要素を参照する用途。",
    explanation: "再利用性の class、識別性の id と覚える。",
  }),
  q({
    id: "q-box-model",
    type: "multiple-choice",
    title: "ボックスモデル",
    description: "CSS ボックスモデルを構成する要素を全て選んでください。",
    choices: ["content", "padding", "border", "margin", "outline"],
    answer: ["content", "padding", "border", "margin"],
    explanation: "outline はボックスモデルには含まれない。",
  }),
  q({
    id: "q-margin-padding",
    type: "text",
    title: "margin と padding",
    description: "margin と padding の違いを説明してください。",
    answer:
      "padding は要素の border の内側にできる余白(背景色が及ぶ)。margin は border の外側にできる余白(隣接要素との間隔)。",
    explanation: "内側=padding、外側=margin。",
  }),
  q({
    id: "q-media-query",
    type: "code",
    title: "メディアクエリ",
    description: "768px 以上で発火するメディアクエリを完成させてください。",
    codeTemplate: "@media (___-width: 768px) { /* styles */ }",
    answer: "min",
    explanation: "min-width はそれ以上の幅で適用、max-width はそれ以下で適用。",
  }),
];

const jsQuestions: Question[] = [
  q({
    id: "q-js-let-const-var",
    type: "choice",
    title: "let/const/var",
    description: "再代入も再宣言もできるのは?",
    choices: ["let", "const", "var", "どれも不可"],
    answer: "var",
    explanation: "var は再宣言も可能。let は再宣言不可・再代入可。const は両方不可。",
  }),
  q({
    id: "q-js-array-method",
    type: "multiple-choice",
    title: "新しい配列を返すメソッド",
    description: "新しい配列を返す配列メソッドを全て選んでください。",
    choices: ["map", "filter", "reduce", "forEach"],
    answer: ["map", "filter"],
    explanation: "reduce は単一値、forEach は undefined を返す。",
  }),
  q({
    id: "q-js-promise",
    type: "text",
    title: "Promise の役割",
    description: "Promise の役割を説明してください。",
    answer:
      "非同期処理の結果(成功/失敗)を表すオブジェクト。then/catch でチェーン可能にし、async/await の基盤になる。",
    explanation: "非同期処理を直列に書ける仕組み。",
  }),
  q({
    id: "q-js-async-await",
    type: "code",
    title: "async/await",
    description: "非同期で fetch するコードを完成させてください(2箇所)。",
    codeTemplate: "___ function getUser(id) {\n  const res = ___ fetch(`/api/users/${id}`);\n  return res.json();\n}",
    answer: ["async", "await"],
    explanation: "async 関数内で await を使う。",
  }),
  q({
    id: "q-js-dom-select",
    type: "choice",
    title: "DOM選択",
    description: "id が \"app\" の要素を取得するメソッドは?",
    choices: [
      "document.getElement('app')",
      "document.getElementById('app')",
      "document.querySelectorAll('app')",
      "document.find('#app')",
    ],
    answer: "document.getElementById('app')",
    explanation: "getElementById を使うか、querySelector('#app') を使う。",
  }),
  q({
    id: "q-js-event-listener",
    type: "choice",
    title: "イベントリスナー",
    description: "button にクリックイベントを追加する書き方は?",
    choices: [
      "button.onClick = handler",
      "button.addEventListener('click', handler)",
      "button.on('click', handler)",
      "button.click(handler)",
    ],
    answer: "button.addEventListener('click', handler)",
    explanation: "addEventListener が標準的。",
  }),
  q({
    id: "q-js-truthy-falsy",
    type: "multiple-choice",
    title: "Falsy値",
    description: "falsy な値を全て選んでください。",
    choices: ["0", "''", "[]", "null", "undefined"],
    answer: ["0", "''", "null", "undefined"],
    explanation: "[] (空配列) は truthy。",
  }),
  q({
    id: "q-js-object-array",
    type: "text",
    title: "オブジェクトと配列",
    description: "オブジェクトと配列の違いを説明してください。",
    answer:
      "オブジェクトはキーと値のペアで順序保証は弱い。配列は数値インデックスでアクセスする順序付きデータ。配列は内部的にオブジェクトの一種。",
    explanation: "key-value か順序付きか。",
  }),
  q({
    id: "q-js-arrow-fn",
    type: "text",
    title: "アロー関数",
    description: "関数宣言とアロー関数の違いを1つ以上挙げてください。",
    answer:
      "アロー関数は自身の this を持たず外側の this を継承する。arguments も持たない。コンストラクタとして使えない。",
    explanation: "this の扱いが最大の違い。",
  }),
];

const tsQuestions: Question[] = [
  q({
    id: "q-ts-annotation",
    type: "code",
    title: "型注釈",
    description: "x を number 型として宣言してください。",
    codeTemplate: "const x: ___ = 42;",
    answer: "number",
    explanation: "プリミティブ型は小文字で書く。",
    difficulty: "easy",
  }),
  q({
    id: "q-ts-primitives",
    type: "multiple-choice",
    title: "プリミティブ型",
    description: "TypeScript のプリミティブ型を全て選んでください。",
    choices: ["string", "number", "boolean", "Object", "any"],
    answer: ["string", "number", "boolean"],
    explanation: "Object と any はプリミティブではない。",
  }),
  q({
    id: "q-ts-interface-vs-type",
    type: "text",
    title: "interface vs type",
    description: "interface と type の違いを1つ以上挙げてください。",
    answer:
      "interface は宣言マージ可能で拡張しやすい。type は union/intersection/プリミティブ別名等で表現力が広い。",
    explanation: "拡張性の interface、表現力の type。",
  }),
  q({
    id: "q-ts-union",
    type: "code",
    title: "Union型",
    description: "string または number を受け取る型注釈にしてください。",
    codeTemplate: "function format(value: string ___ number): string { /*...*/ }",
    answer: "|",
    explanation: "| で union 型。",
  }),
  q({
    id: "q-ts-optional",
    type: "choice",
    title: "Optional Property",
    description: "`type User = { name: string; age?: number }` の age について正しい説明は?",
    choices: [
      "age は必須",
      "age は省略可能で未指定時は undefined",
      "age は null になる",
      "age は number または string",
    ],
    answer: "age は省略可能で未指定時は undefined",
    explanation: "? は optional の意味。",
  }),
  q({
    id: "q-ts-generics",
    type: "code",
    title: "Generics基本",
    description: "T 型の値をそのまま返す identity 関数を完成させてください。",
    codeTemplate: "function identity<___>(value: T): T {\n  return value;\n}",
    answer: "T",
    explanation: "型パラメータを<>内に宣言する。",
  }),
  q({
    id: "q-ts-inference",
    type: "text",
    title: "型推論",
    description: "TypeScript の型推論とは何か説明してください。",
    answer:
      "明示的に型注釈を書かなくても、コンパイラが代入値や戻り値から自動的に型を推測してくれる仕組み。",
    explanation: "型注釈の省略を可能にする。",
  }),
  q({
    id: "q-ts-any",
    type: "choice",
    title: "any を避ける理由",
    description: "any を避けるべき最大の理由は?",
    choices: [
      "実行時パフォーマンスが落ちる",
      "コンパイル時間が伸びる",
      "型安全性が無効化され、エラーがコンパイル時に検知できなくなる",
      "ESLint で必ずエラーになる",
    ],
    answer: "型安全性が無効化され、エラーがコンパイル時に検知できなくなる",
    explanation: "型システムの恩恵が失われる。",
  }),
  q({
    id: "q-ts-api-response",
    type: "code",
    title: "APIレスポンス型",
    description: "User 型を持つ APIレスポンス型を完成させてください。",
    codeTemplate: "type User = { id: string; name: string };\ntype UserListResponse = { users: ___[] };",
    answer: "User",
    explanation: "User 型の配列をプロパティに持つ。",
  }),
];

const reactQuestions: Question[] = [
  q({
    id: "q-react-component",
    type: "text",
    title: "コンポーネントとは",
    description: "React のコンポーネントとは何か説明してください。",
    answer:
      "UI の再利用可能な単位。関数(またはクラス)として定義され、props を受け取って JSX を返す。",
    explanation: "UI を分解する単位。",
    difficulty: "easy",
  }),
  q({
    id: "q-react-props-state",
    type: "choice",
    title: "props と state",
    description: "props と state の違いとして正しいのは?",
    choices: [
      "props は内部状態、state は外部入力",
      "props は親から渡される外部入力、state は内部で管理する状態",
      "両者に違いはない",
      "props は更新可、state は不変",
    ],
    answer: "props は親から渡される外部入力、state は内部で管理する状態",
    explanation: "外部からの props、内部の state。",
  }),
  q({
    id: "q-react-usestate",
    type: "code",
    title: "useState",
    description: "count を 0 で初期化する useState の宣言を完成させてください。",
    codeTemplate: "const [count, setCount] = ___(0);",
    answer: "useState",
    explanation: "useState フックで状態を持つ。",
  }),
  q({
    id: "q-react-useeffect",
    type: "choice",
    title: "useEffect",
    description: "マウント時に一度だけ実行したい時、useEffect の第二引数は?",
    choices: ["undefined", "[]", "[依存変数]", "null"],
    answer: "[]",
    explanation: "空配列は依存なし = マウント時のみ。",
  }),
  q({
    id: "q-react-key",
    type: "choice",
    title: "リストレンダリングのkey",
    description: "リストレンダリングで key に推奨される値は?",
    choices: [
      "配列のインデックス",
      "Math.random()",
      "各要素を一意に識別できる安定したID",
      "現在時刻",
    ],
    answer: "各要素を一意に識別できる安定したID",
    explanation: "ID は安定していること、ユニークであること。",
  }),
  q({
    id: "q-react-cond",
    type: "code",
    title: "条件付きレンダリング",
    description: "isLoggedIn が true の時だけ <Dashboard /> を表示する書き方は?",
    codeTemplate: "{isLoggedIn ___ <Dashboard />}",
    answer: "&&",
    explanation: "短絡評価で表示制御。",
  }),
  q({
    id: "q-react-event",
    type: "choice",
    title: "イベントハンドラ",
    description: "React のクリックイベントハンドラの正しい書き方は?",
    choices: [
      "onclick=\"handleClick()\"",
      "onClick={handleClick}",
      "onClick={handleClick()}",
      "on-click={handleClick}",
    ],
    answer: "onClick={handleClick}",
    explanation: "{}で参照を渡す。()付きだと即実行になる。",
  }),
  q({
    id: "q-react-parent-child",
    type: "text",
    title: "親子データ受け渡し",
    description: "親から子コンポーネントへデータを渡す方法を説明してください。",
    answer:
      "親のJSXで子コンポーネントに props として渡す。例: <Child name={user.name} />。子は引数 props でアクセス。",
    explanation: "props で渡す。",
  }),
  q({
    id: "q-react-controlled",
    type: "choice",
    title: "Controlled Component",
    description: "controlled component の説明として正しいのは?",
    choices: [
      "DOM が値を保持する非制御コンポーネント",
      "Reactのstateが入力値のソースで、value と onChange を併用するもの",
      "useRefを使うフォーム",
      "refで直接DOMを操作するもの",
    ],
    answer: "Reactのstateが入力値のソースで、value と onChange を併用するもの",
    explanation: "state ⇄ value の双方向バインド。",
  }),
];

const reactAdvQuestions: Question[] = [
  q({
    id: "q-react-adv-memo",
    type: "choice",
    title: "React.memo",
    description: "React.memo の目的として正しいのは?",
    choices: [
      "stateを保持する",
      "propsが変わらない時にコンポーネントの再レンダリングをスキップする",
      "useEffectの代替",
      "Context の作成",
    ],
    answer: "propsが変わらない時にコンポーネントの再レンダリングをスキップする",
    explanation: "props の浅い比較で再レンダリングを抑制。",
    difficulty: "hard",
  }),
  q({
    id: "q-react-adv-usememo",
    type: "text",
    title: "useMemo の使い所",
    description: "useMemo を使うべき典型的なケースを1つ挙げてください。",
    answer: "計算コストの高い派生値をメモ化したい時。または、参照同一性が必要な値(useEffect の依存等)を保ちたい時。",
    explanation: "計算コストと参照同一性の2軸。",
    difficulty: "hard",
  }),
  q({
    id: "q-react-adv-context",
    type: "choice",
    title: "Context API",
    description: "Context API を使うのに最も適した状況は?",
    choices: [
      "兄弟コンポーネント間で頻繁に値を共有",
      "テーマ・認証情報など、深い階層に伝搬したい値",
      "ローカルなフォームの state 管理",
      "1コンポーネント内のキャッシュ",
    ],
    answer: "テーマ・認証情報など、深い階層に伝搬したい値",
    explanation: "props ドリリング回避の用途。",
  }),
  q({
    id: "q-react-adv-error",
    type: "choice",
    title: "Error Boundary",
    description: "Error Boundary が補足できないエラーは?",
    choices: [
      "render 内のエラー",
      "lifecycle メソッド内のエラー",
      "イベントハンドラ内のエラー",
      "子孫コンポーネントのエラー",
    ],
    answer: "イベントハンドラ内のエラー",
    explanation: "イベントハンドラ・非同期コード・Error Boundary 自身のエラーは捕捉対象外。",
    difficulty: "hard",
  }),
];

const nextQuestions: Question[] = [
  q({
    id: "q-next-vs-react",
    type: "text",
    title: "Next.js と React",
    description: "Next.js と React の違いを1つ以上挙げてください。",
    answer:
      "React は UI ライブラリ。Next.js はそれを基にしたフレームワークで、ルーティング/SSR/SSG/API Routes/画像最適化等を提供する。",
    explanation: "ライブラリ vs フレームワーク。",
  }),
  q({
    id: "q-next-app-router",
    type: "choice",
    title: "App Router",
    description: "Next.js (App Router) でページを作るには?",
    choices: [
      "pages/ にファイルを置く",
      "app/ に page.tsx を置く",
      "routes.json に追加",
      "next.config.js で定義",
    ],
    answer: "app/ に page.tsx を置く",
    explanation: "App Router はディレクトリベース。",
  }),
  q({
    id: "q-next-server-component",
    type: "text",
    title: "Server Component",
    description: "Server Component の概要を説明してください。",
    answer:
      "サーバー側でレンダリングされるコンポーネント。JSバンドルに含まれず、DB直接アクセスやサーバー専用パッケージが使える。",
    explanation: "デフォルトが Server Component。",
  }),
  q({
    id: "q-next-client-directive",
    type: "choice",
    title: "Client Component",
    description: "Client Component を明示するディレクティブは?",
    choices: ['"use client"', '"use browser"', '"client only"', "@client"],
    answer: '"use client"',
    explanation: "ファイル先頭に書く。",
  }),
  q({
    id: "q-next-ssg",
    type: "multiple-choice",
    title: "ビルド時HTML生成",
    description: "ビルド時にHTMLを生成する方式を選んでください。",
    choices: ["SSR", "SSG", "CSR", "ISR"],
    answer: ["SSG"],
    explanation: "SSG=ビルド時、SSR=リクエスト時、ISR=再生成、CSR=クライアント側。",
  }),
];

const tailwindQuestions: Question[] = [
  q({
    id: "q-tw-utility",
    type: "text",
    title: "Tailwindの思想",
    description: "Tailwind CSS のユーティリティファースト思想を1文で説明してください。",
    answer:
      "意味的なクラスを設計するのではなく、bg-blue-500 のような小さなユーティリティを HTML に直接組み合わせて UI を構築する思想。",
    explanation: "CSS設計コストを下げる代わりにマークアップが冗長になる。",
    difficulty: "easy",
  }),
  q({
    id: "q-tw-responsive",
    type: "choice",
    title: "レスポンシブプレフィックス",
    description: "md: プレフィックスはどの幅から適用される?",
    choices: ["640px〜", "768px〜", "1024px〜", "1280px〜"],
    answer: "768px〜",
    explanation: "デフォルトのmdは768px。",
  }),
  q({
    id: "q-tw-hover",
    type: "code",
    title: "Hover時の背景",
    description: "ホバー時に背景色を blue-600 にする書き方を完成させてください。",
    codeTemplate: "<button class=\"bg-blue-500 ___:bg-blue-600\">click</button>",
    answer: "hover",
    explanation: "状態プレフィックスは hover:, focus:, active: など。",
    difficulty: "easy",
  }),
  q({
    id: "q-tw-flex-center",
    type: "code",
    title: "Flexで中央寄せ",
    description: "Flexコンテナで子を中央に配置するクラスを完成させてください。",
    codeTemplate: "<div class=\"flex items-center ___\">...</div>",
    answer: "justify-center",
    explanation: "items-center=縦中央、justify-center=横中央(rowの場合)。",
  }),
];

const uiComponentQuestions: Question[] = [
  q({
    id: "q-ui-atomic",
    type: "choice",
    title: "Atomic Design",
    description: "Atomic Design における最も小さい単位は?",
    choices: ["Templates", "Organisms", "Atoms", "Molecules"],
    answer: "Atoms",
    explanation: "Atoms → Molecules → Organisms → Templates → Pages。",
  }),
  q({
    id: "q-ui-composition",
    type: "text",
    title: "Composition 設計",
    description: "コンポーネントの「合成優先(composition over inheritance)」の意味を説明してください。",
    answer:
      "継承で機能を拡張するのではなく、小さなコンポーネントを children/props として組み合わせて新しい UI を作る方針。",
    explanation: "Reactは特に composition 推奨。",
  }),
  q({
    id: "q-ui-controlled-uncontrolled",
    type: "choice",
    title: "コンポーネントの状態",
    description: "再利用可能な Input コンポーネントを設計する時、より柔軟な方式は?",
    choices: [
      "内部 state でだけ値を持つ",
      "value と onChange を必須にして親に制御させる",
      "props を受け取らない",
      "ref で直接操作",
    ],
    answer: "value と onChange を必須にして親に制御させる",
    explanation: "controlled なコンポーネントは親側で値を集約できる。",
  }),
];

const formQuestions: Question[] = [
  q({
    id: "q-form-controlled",
    type: "choice",
    title: "controlled form",
    description: "React の controlled form では必須のpairは?",
    choices: ["value+ref", "value+onChange", "defaultValue+ref", "onBlur+name"],
    answer: "value+onChange",
    explanation: "state↔valueをonChangeで同期。",
    difficulty: "easy",
  }),
  q({
    id: "q-form-validation",
    type: "text",
    title: "クライアントバリデーションの目的",
    description: "クライアント側バリデーションを行う目的を1つ以上挙げてください。",
    answer:
      "ユーザーへの即時フィードバック、入力ミス削減、サーバー往復削減。ただしサーバー側バリデーションは別途必須。",
    explanation: "あくまでUX目的。セキュリティはサーバー必須。",
  }),
  q({
    id: "q-form-submit",
    type: "choice",
    title: "submitのデフォルト挙動",
    description: "<form> 内の <button type=\"submit\"> をクリックすると、デフォルトで何が起きる?",
    choices: ["何も起きない", "ページがリロードされる", "JSが実行される", "全フォームが消える"],
    answer: "ページがリロードされる",
    explanation: "e.preventDefault() で抑止できる。",
  }),
];

const frontTestQuestions: Question[] = [
  q({
    id: "q-fetest-rtl",
    type: "choice",
    title: "Testing Library 思想",
    description: "React Testing Library の基本方針は?",
    choices: [
      "実装詳細をテストする",
      "ユーザーが見えるもの/触れるものをテストする",
      "snapshot だけで充分",
      "console.log だけで十分",
    ],
    answer: "ユーザーが見えるもの/触れるものをテストする",
    explanation: "実装詳細を避け、振る舞いをテスト。",
  }),
  q({
    id: "q-fetest-vitest-jest",
    type: "text",
    title: "Vitest と Jest",
    description: "Vitest を選ぶ理由として典型的なものを1つ挙げてください。",
    answer: "Vite ベースのプロジェクトで設定が最小、起動も速い。Jest 互換 API が多く移行しやすい。",
    explanation: "Vite ユーザーの第一選択。",
  }),
  q({
    id: "q-fetest-async",
    type: "code",
    title: "非同期要素の取得",
    description: "Testing Library で非同期に表示される要素を取得する関数を完成させてください。",
    codeTemplate: "const el = await screen.___ByText('ログイン成功');",
    answer: "find",
    explanation: "findBy* は非同期、getBy* は即時、queryBy* は null 許容。",
  }),
];

// ============================== Backend ==============================

const pythonQuestions: Question[] = [
  q({
    id: "q-py-list-comp",
    type: "code",
    title: "リスト内包表記",
    description: "1〜5を2乗したリストを作る内包表記を完成させてください。",
    codeTemplate: "squares = [x ___ x for x in range(1, 6)]",
    answer: "*",
    explanation: "Pythonの乗算は * 記号。",
    difficulty: "easy",
  }),
  q({
    id: "q-py-type-hint",
    type: "code",
    title: "型ヒント",
    description: "add 関数の引数と戻り値の型ヒントを完成させてください(intを使用)。",
    codeTemplate: "def add(a: ___, b: int) -> int:\n    return a + b",
    answer: "int",
    explanation: "Python 3.5+ で型ヒント可。",
  }),
  q({
    id: "q-py-dict-vs-list",
    type: "text",
    title: "dict と list",
    description: "Python の dict と list の使い分けを説明してください。",
    answer:
      "list は順序付きの値の集まり、インデックスでアクセス。dict はキーと値のマッピング、キーで高速にアクセスする。順序が意味を持つなら list、ラベル付けが必要なら dict。",
    explanation: "順序か、ラベルか。",
  }),
  q({
    id: "q-py-venv",
    type: "choice",
    title: "venv",
    description: "python -m venv の目的は?",
    choices: [
      "Pythonのバージョンアップ",
      "プロジェクトごとに独立したパッケージ環境を作る",
      "ファイルを圧縮する",
      "テストを実行する",
    ],
    answer: "プロジェクトごとに独立したパッケージ環境を作る",
    explanation: "依存衝突の防止。",
  }),
];

const fastapiQuestions: Question[] = [
  q({
    id: "q-fa-method",
    type: "choice",
    title: "HTTPメソッド",
    description: "リソース作成に最も適した HTTP メソッドは?",
    choices: ["GET", "POST", "PUT", "DELETE"],
    answer: "POST",
    explanation: "POSTが新規作成に一般的。",
  }),
  q({
    id: "q-fa-path-vs-query",
    type: "text",
    title: "path と query",
    description: "path parameter と query parameter の違いを説明してください。",
    answer:
      "path はリソースを特定する識別子 (/users/{id})。query は ? 以降の検索条件や並び順などのオプション (?limit=10)。",
    explanation: "識別子か絞り込み条件か。",
  }),
  q({
    id: "q-fa-pydantic",
    type: "choice",
    title: "Pydantic",
    description: "FastAPI における Pydantic の主な役割は?",
    choices: [
      "DB接続",
      "リクエスト/レスポンスのバリデーションと型定義",
      "ルーティング",
      "認証",
    ],
    answer: "リクエスト/レスポンスのバリデーションと型定義",
    explanation: "型と実行時検証を兼ねる。",
  }),
  q({
    id: "q-fa-depends",
    type: "code",
    title: "Depends",
    description: "DB セッションを依存性注入する書き方を完成させてください。",
    codeTemplate: "def get_users(db: Session = ___(get_db)):\n    return db.query(User).all()",
    answer: "Depends",
    explanation: "Depends() で依存解決。",
  }),
  q({
    id: "q-fa-422",
    type: "choice",
    title: "バリデーションエラー",
    description: "Pydantic のバリデーションエラー時に FastAPI が返すデフォルトのステータスコードは?",
    choices: ["400", "401", "422", "500"],
    answer: "422",
    explanation: "422 Unprocessable Entity。",
  }),
];

const restQuestions: Question[] = [
  q({
    id: "q-rest-stateless",
    type: "choice",
    title: "REST原則",
    description: "REST の原則として最も重要なのは?",
    choices: ["状態を持つ", "ステートレス", "サーバーが session を保持", "GET で更新"],
    answer: "ステートレス",
    explanation: "リクエストが完結する。",
  }),
  q({
    id: "q-rest-resource",
    type: "text",
    title: "URLとリソース",
    description: "RESTful な API でユーザー一覧と特定ユーザーを取得する URL設計の例を答えてください。",
    answer:
      "一覧: GET /users / 個別: GET /users/{id}。動詞は HTTPメソッドで表し、URL は名詞のリソースで構成する。",
    explanation: "リソース指向で設計。",
  }),
  q({
    id: "q-rest-status",
    type: "choice",
    title: "404 vs 422",
    description: "存在しないIDが渡された時の適切なステータスコードは?",
    choices: ["200", "404", "422", "500"],
    answer: "404",
    explanation: "リソースが見つからない=404。",
  }),
];

const sqlQuestions: Question[] = [
  q({
    id: "q-sql-select",
    type: "code",
    title: "SELECT基本",
    description: "users テーブルから全件取得する SQL を完成させてください。",
    codeTemplate: "___ * FROM users;",
    answer: "SELECT",
    explanation: "SELECT 句で取得。",
    difficulty: "easy",
  }),
  q({
    id: "q-sql-where",
    type: "code",
    title: "WHERE句",
    description: "age が 20 以上のユーザーを取得する SQL を完成させてください。",
    codeTemplate: "SELECT * FROM users ___ age >= 20;",
    answer: "WHERE",
    explanation: "条件指定は WHERE。",
    difficulty: "easy",
  }),
  q({
    id: "q-sql-join",
    type: "text",
    title: "JOIN",
    description: "JOIN の役割を説明してください。",
    answer:
      "複数テーブルを関連カラム(主キー/外部キー等)で結合して、1つの結果セットを返す SQL 構文。INNER/LEFT/RIGHT/FULL がある。",
    explanation: "テーブル結合の基本。",
  }),
  q({
    id: "q-sql-group-by",
    type: "choice",
    title: "GROUP BY",
    description: "GROUP BY の用途として正しいのは?",
    choices: [
      "結果のソート",
      "重複行の削除",
      "集約関数とセットでカラム単位の集計をする",
      "テーブル結合",
    ],
    answer: "集約関数とセットでカラム単位の集計をする",
    explanation: "SUM/COUNT/AVG とセットで使う。",
  }),
];

const pgQuestions: Question[] = [
  q({
    id: "q-pg-types",
    type: "choice",
    title: "PostgreSQL固有型",
    description: "PostgreSQL 固有でよく使われる型は?",
    choices: ["VARCHAR", "JSONB", "TEXT", "INT"],
    answer: "JSONB",
    explanation: "JSONB は PG の強み。",
  }),
  q({
    id: "q-pg-index",
    type: "choice",
    title: "index",
    description: "index の主目的は?",
    choices: [
      "ストレージ削減",
      "WHERE/JOIN の高速化",
      "暗号化",
      "バックアップ",
    ],
    answer: "WHERE/JOIN の高速化",
    explanation: "書き込みは遅くなるトレードオフ。",
  }),
  q({
    id: "q-pg-tx",
    type: "text",
    title: "トランザクション",
    description: "トランザクションの意味を説明してください。",
    answer:
      "複数のSQL操作を1まとまりとして実行し、全て成功するか全て失敗(ロールバック)するかを保証する仕組み。ACID 特性を持つ。",
    explanation: "ACID の A (原子性) が肝。",
  }),
];

const sqlalchemyQuestions: Question[] = [
  q({
    id: "q-sa-orm",
    type: "choice",
    title: "ORM",
    description: "ORM (SQLAlchemy) の利点として正しいのは?",
    choices: [
      "SQLが速くなる",
      "Pythonオブジェクトとして DB を操作できて型安全性が上がる",
      "DBが不要になる",
      "全クエリが自動最適化される",
    ],
    answer: "Pythonオブジェクトとして DB を操作できて型安全性が上がる",
    explanation: "抽象化と型安全性の向上。",
  }),
  q({
    id: "q-sa-session",
    type: "text",
    title: "Sessionの役割",
    description: "SQLAlchemy の Session の役割を説明してください。",
    answer:
      "DB とのやり取りを束ねる単位。Unit of Work パターンに従い、追加/変更/削除を蓄えて commit でまとめて反映する。",
    explanation: "トランザクション境界に近い。",
  }),
  q({
    id: "q-sa-relationship",
    type: "choice",
    title: "relationship",
    description: "1対多の関連を表現するのに使うのは?",
    choices: ["Column", "ForeignKey + relationship", "Index", "Constraint"],
    answer: "ForeignKey + relationship",
    explanation: "ForeignKey で外部キー、relationship で関連オブジェクトに辿れる。",
  }),
];

const authQuestions: Question[] = [
  q({
    id: "q-auth-authn-authz",
    type: "text",
    title: "認証と認可",
    description: "「認証(authentication)」と「認可(authorization)」の違いを説明してください。",
    answer: "認証はユーザーが誰かを確認すること、認可はそのユーザーが何にアクセスできるかを判定すること。",
    explanation: "ログイン vs 権限。",
  }),
  q({
    id: "q-auth-jwt",
    type: "choice",
    title: "JWT",
    description: "JWT の特徴として正しいのは?",
    choices: [
      "サーバー側でセッション保持必須",
      "ペイロードが暗号化されており第三者が読めない",
      "署名付きのトークンで改ざん検知できるが、payload は base64 でデコード可能",
      "expire 設定不可",
    ],
    answer: "署名付きのトークンで改ざん検知できるが、payload は base64 でデコード可能",
    explanation: "署名と暗号化は別。",
    difficulty: "hard",
  }),
  q({
    id: "q-auth-hash",
    type: "choice",
    title: "パスワード保存",
    description: "パスワードを DB に保存する正しい方法は?",
    choices: ["平文で保存", "Base64エンコード", "MD5", "bcrypt/argon2 でハッシュ化"],
    answer: "bcrypt/argon2 でハッシュ化",
    explanation: "ソルト付きの強いハッシュ関数を使う。",
  }),
];

const backTestQuestions: Question[] = [
  q({
    id: "q-betest-pytest",
    type: "choice",
    title: "pytest基本",
    description: "pytest でテスト関数の命名規則は?",
    choices: ["check_*", "test_*", "spec_*", "verify_*"],
    answer: "test_*",
    explanation: "test_ プレフィックスで自動発見される。",
  }),
  q({
    id: "q-betest-fixture",
    type: "text",
    title: "fixtureの目的",
    description: "pytest の fixture の目的を説明してください。",
    answer:
      "テスト関数に共通の前準備・後片付けを提供する仕組み。引数として渡すことで自動的に注入される。",
    explanation: "DI に近い思想。",
  }),
  q({
    id: "q-betest-integration",
    type: "choice",
    title: "Integration test",
    description: "API のテストとして本物の DB を立てる方式は?",
    choices: ["unit test", "snapshot test", "integration test", "type test"],
    answer: "integration test",
    explanation: "コンポーネント間の結合点まで含めて検証。",
  }),
];

const dockerQuestions: Question[] = [
  q({
    id: "q-docker-dockerfile",
    type: "choice",
    title: "Dockerfile",
    description: "Dockerfile の役割として正しいのは?",
    choices: [
      "コンテナの起動オプションを記述するファイル",
      "Docker イメージのビルド手順を記述するファイル",
      "環境変数を渡すファイル",
      "ボリュームのマウント定義",
    ],
    answer: "Docker イメージのビルド手順を記述するファイル",
    explanation: "イメージのレシピ。",
  }),
  q({
    id: "q-docker-image-container",
    type: "text",
    title: "image と container",
    description: "image と container の違いを説明してください。",
    answer:
      "image は実行可能なテンプレート(設計図)。container はその image を起動した実行中のインスタンス。",
    explanation: "テンプレート vs インスタンス。",
  }),
  q({
    id: "q-docker-compose",
    type: "choice",
    title: "compose の用途",
    description: "docker compose の主な用途は?",
    choices: [
      "1つのコンテナを起動",
      "複数コンテナの構成と関係を yaml で宣言・一括管理する",
      "イメージを push する",
      "ホストOSをコンテナ化",
    ],
    answer: "複数コンテナの構成と関係を yaml で宣言・一括管理する",
    explanation: "オーケストレーションの簡易版。",
  }),
  q({
    id: "q-docker-volume",
    type: "choice",
    title: "volume",
    description: "volume の役割として正しいのは?",
    choices: [
      "ネットワーク設定",
      "コンテナ削除後もデータを永続化する仕組み",
      "CPU 制限の設定",
      "イメージのキャッシュ",
    ],
    answer: "コンテナ削除後もデータを永続化する仕組み",
    explanation: "永続化レイヤー。",
  }),
];

const awsQuestions: Question[] = [
  q({
    id: "q-aws-ecs",
    type: "choice",
    title: "ECS / Fargate",
    description: "ECS / Fargate の役割は?",
    choices: [
      "オブジェクトストレージ",
      "サーバーレスなコンテナ実行基盤",
      "リレーショナルDB",
      "DNS",
    ],
    answer: "サーバーレスなコンテナ実行基盤",
    explanation: "コンテナ実行のマネージドサービス。",
  }),
  q({
    id: "q-aws-rds",
    type: "choice",
    title: "RDS",
    description: "RDS の役割は?",
    choices: [
      "マネージドなリレーショナルデータベース",
      "オブジェクトストレージ",
      "サーバーレス関数",
      "認証サービス",
    ],
    answer: "マネージドなリレーショナルデータベース",
    explanation: "RDB を AWS が運用してくれる。",
  }),
  q({
    id: "q-aws-s3",
    type: "text",
    title: "S3 の役割",
    description: "S3 の役割を説明してください。",
    answer:
      "高い耐久性と可用性を持つオブジェクトストレージ。ファイル/画像/静的サイト/バックアップ等の保存に使う。バケット単位で管理。",
    explanation: "オブジェクト = ファイル単位の保存。",
  }),
  q({
    id: "q-aws-iam",
    type: "text",
    title: "IAM",
    description: "IAM の役割を説明してください。",
    answer:
      "AWSの認証・認可サービス。ユーザー/ロール/ポリシーで誰がどのリソースに対して何ができるかを制御する。最小権限の原則が基本。",
    explanation: "セキュリティの中心。",
  }),
  q({
    id: "q-aws-cloudwatch",
    type: "multiple-choice",
    title: "CloudWatch",
    description: "CloudWatch で扱えるものを全て選んでください。",
    choices: ["メトリクス", "ログ", "アラーム", "ソースコードの保管"],
    answer: ["メトリクス", "ログ", "アラーム"],
    explanation: "ソースコードは CodeCommit / S3 等の役割。",
  }),
];

// ============================== AI / Practice ==============================

const aiApiQuestions: Question[] = [
  q({
    id: "q-aiapi-overview",
    type: "text",
    title: "AI API連携の基本",
    description: "アプリから AI API を呼ぶ時、サーバー経由が推奨される理由を1つ挙げてください。",
    answer:
      "API キーをクライアントに露出させないため。レート制限・ログ取得・課金監視もサーバー側で一元管理できる。",
    explanation: "API キー保護が最大の理由。",
  }),
  q({
    id: "q-aiapi-streaming",
    type: "choice",
    title: "ストリーミング",
    description: "LLM のレスポンスをストリーミングするメリットは?",
    choices: [
      "総トークン数が減る",
      "ユーザー体感のレスポンス開始時間が短くなる",
      "回答品質が上がる",
      "サーバー負荷が下がる",
    ],
    answer: "ユーザー体感のレスポンス開始時間が短くなる",
    explanation: "TTFT(Time to First Token)が短く感じる。",
  }),
  q({
    id: "q-aiapi-error",
    type: "choice",
    title: "リトライ戦略",
    description: "AI API への呼び出しでエラーが返った時、最初に試すべき対応は?",
    choices: [
      "即座に同じリクエストを連打",
      "指数バックオフ付きリトライ",
      "クライアントに 500 を返してすぐ諦める",
      "サービスを停止する",
    ],
    answer: "指数バックオフ付きリトライ",
    explanation: "5xx や 429 にはバックオフが定石。",
  }),
];

const openaiQuestions: Question[] = [
  q({
    id: "q-openai-keyword",
    type: "text",
    title: "OpenAI API のモデル選択",
    description: "OpenAI のチャット系モデルを選ぶ際に考慮すべき軸を1つ以上挙げてください。",
    answer: "コスト、レイテンシ、コンテキスト長、推論精度(用途次第)、ツール対応の有無など。",
    explanation: "全部最強モデルにすると高い。",
  }),
  q({
    id: "q-openai-temp",
    type: "choice",
    title: "temperature",
    description: "OpenAI API の temperature を 0 に近づけると?",
    choices: [
      "回答が多様になる",
      "回答が決定論的になりやすい",
      "回答が長くなる",
      "回答が短くなる",
    ],
    answer: "回答が決定論的になりやすい",
    explanation: "高いほど多様、低いほど安定。",
  }),
  q({
    id: "q-openai-system",
    type: "choice",
    title: "system message",
    description: "OpenAI ChatCompletion の system role はどのような時に使う?",
    choices: [
      "ユーザーの問いを書く",
      "アシスタントのキャラ・振る舞いを指示する",
      "API キーを渡す",
      "ログを取る",
    ],
    answer: "アシスタントのキャラ・振る舞いを指示する",
    explanation: "system が振る舞いを定義する。",
  }),
];

const promptQuestions: Question[] = [
  q({
    id: "q-prompt-clarity",
    type: "text",
    title: "明確な指示",
    description: "良いプロンプトの基本原則を1つ挙げてください。",
    answer: "曖昧な表現を避け、求める出力フォーマット・制約・例を明示する。役割と前提を最初に置く。",
    explanation: "言わないと察してくれない。",
  }),
  q({
    id: "q-prompt-fewshot",
    type: "choice",
    title: "few-shot",
    description: "few-shot プロンプティングとは?",
    choices: [
      "0個の例を見せる",
      "1個の例を見せる",
      "数個の入出力例を見せて望む形式を学ばせる手法",
      "モデルをファインチューニングする",
    ],
    answer: "数個の入出力例を見せて望む形式を学ばせる手法",
    explanation: "few-shot = 数例。",
  }),
  q({
    id: "q-prompt-structured",
    type: "choice",
    title: "出力形式の制御",
    description: "LLM から JSON を必ず返してほしい時に有効な手段は?",
    choices: [
      "プロンプトで `JSONだけ返して` と書く",
      "JSONスキーマ/Structured Outputs/関数呼び出しを使う",
      "後処理で正規表現",
      "ランダムに試す",
    ],
    answer: "JSONスキーマ/Structured Outputs/関数呼び出しを使う",
    explanation: "確実性は構造化出力機能を使うのが現実的。",
  }),
];

const aiGenQuestions: Question[] = [
  q({
    id: "q-aigen-schema",
    type: "text",
    title: "問題生成のスキーマ設計",
    description:
      "AI で生成する問題を後段で再利用しやすくするために、定義しておくべき項目を3つ以上挙げてください。",
    answer:
      "id、type(選択肢/記述等)、難易度、タグ、本文、選択肢、正解、解説、生成元プロンプト、モデル名、生成日時など。",
    explanation: "再利用・苦手分析・監査ができる粒度に。",
  }),
  q({
    id: "q-aigen-dedup",
    type: "choice",
    title: "問題の重複防止",
    description: "AI が同じような問題を毎回生成しないように工夫する方法は?",
    choices: [
      "プロンプトに「ユニークに」と書くだけ",
      "既出題IDや本文の埋め込みをプロンプト/RAGで除外する",
      "DBを使わない",
      "クライアントで重複を弾く",
    ],
    answer: "既出題IDや本文の埋め込みをプロンプト/RAGで除外する",
    explanation: "既出を渡すか、ベクトル類似度で弾く。",
  }),
  q({
    id: "q-aigen-cost",
    type: "text",
    title: "コスト戦略",
    description: "AI で問題生成する時のコスト最適化策を1つ以上挙げてください。",
    answer:
      "プールキャッシュ(同条件で生成した問題を再利用)、軽量モデルへの分担、レート制御、深夜バッチでの事前生成など。",
    explanation: "都度生成しないのが基本。",
  }),
];

const recoQuestions: Question[] = [
  q({
    id: "q-reco-signal",
    type: "text",
    title: "おすすめのシグナル",
    description: "学習レコメンドで使えるシグナルを2つ以上挙げてください。",
    answer:
      "回答正答率、タグ別の苦手度、最後に学習した日からの経過時間、同年代/同レベル学習者の人気コース、復習スケジュール等。",
    explanation: "履歴×タグ×時間が基本。",
  }),
  q({
    id: "q-reco-coldstart",
    type: "choice",
    title: "コールドスタート",
    description: "新規ユーザーへのレコメンドで使われがちなのは?",
    choices: ["完全ランダム", "人気コース/プリセット推薦", "AIだけで自動生成", "推薦なし"],
    answer: "人気コース/プリセット推薦",
    explanation: "履歴がない時の定石。",
  }),
];

const portfolioQuestions: Question[] = [
  q({
    id: "q-pf-readme",
    type: "text",
    title: "READMEの目的",
    description: "ポートフォリオの README に書くべきことを3つ以上挙げてください。",
    answer:
      "概要、技術スタック、デモURL/スクリーンショット、起動手順、設計上の工夫、課題と今後の改善案。",
    explanation: "読者の意思決定に必要な情報を最初に。",
  }),
  q({
    id: "q-pf-deploy",
    type: "choice",
    title: "デプロイ先",
    description: "個人ポートフォリオ向けの軽量なデプロイ先として一般的なのは?",
    choices: ["オンプレ専用サーバー", "Vercel / Netlify / Render など", "メインフレーム", "FTPサーバーのみ"],
    answer: "Vercel / Netlify / Render など",
    explanation: "PaaSで完結すると運用が楽。",
  }),
];

const webDesignQuestions: Question[] = [
  q({
    id: "q-wd-mvp",
    type: "text",
    title: "MVPの考え方",
    description: "Webアプリの MVP (Minimum Viable Product) を設計する時の原則を説明してください。",
    answer:
      "最小限の価値が伝わるコア機能だけに絞ってリリースし、ユーザーフィードバックで方向を決めていく。便利機能や最適化は後回し。",
    explanation: "学習目的なら特にスコープを切る。",
  }),
  q({
    id: "q-wd-layer",
    type: "choice",
    title: "レイヤー設計",
    description: "FastAPI/SQLAlchemy で一般的なレイヤー構成は?",
    choices: [
      "router + service + repository",
      "router + 何でも routerに",
      "全部 main.py",
      "service だけ",
    ],
    answer: "router + service + repository",
    explanation: "責務分離で再利用性とテスト性が上がる。",
  }),
];

const fullstackQuestions: Question[] = [
  q({
    id: "q-fs-contract",
    type: "choice",
    title: "型の共有",
    description: "フロント (TS) とバック (Python) で API スキーマを揃える方法として最も実用的なのは?",
    choices: [
      "口頭で合わせる",
      "OpenAPI からTS型を生成、または共通の型定義パッケージを使う",
      "全てany",
      "コメントで記述",
    ],
    answer: "OpenAPI からTS型を生成、または共通の型定義パッケージを使う",
    explanation: "ズレを自動で検知できるのが理想。",
  }),
  q({
    id: "q-fs-env",
    type: "text",
    title: "環境分離",
    description: "本番環境とローカル開発環境の差分を吸収する方法を1つ以上挙げてください。",
    answer:
      ".env による環境変数、設定オブジェクトの環境別読み込み、DB接続先の切り替え、CI/CDによるビルド時の差し替えなど。",
    explanation: "12factor の \"Config\" の原則。",
  }),
];

// ============================== Course definitions ==============================

type CourseInit = {
  id: string;
  title: string;
  description: string;
  category: Course["category"];
  level: Course["level"];
  status: Course["status"];
  icon: string;
  estimatedHours: number;
  progress: number;
  tags: string[];
  questions: Question[];
};

const COURSE_INITS: CourseInit[] = [
  // -------- Frontend --------
  {
    id: "course-html-css",
    title: "HTML / CSS 入門",
    description: "Web 表示の基本となる HTML タグと CSS のレイアウト/装飾を体系的に学びます。",
    category: "frontend",
    level: "beginner",
    status: "completed",
    icon: "🎨",
    estimatedHours: 1,
    progress: 100,
    tags: ["HTML", "CSS", "Web基礎"],
    questions: htmlCssQuestions,
  },
  {
    id: "course-javascript",
    title: "JavaScript 入門",
    description: "変数・配列・関数・非同期など、モダンな JavaScript の必須要素を学びます。",
    category: "frontend",
    level: "beginner",
    status: "in-progress",
    icon: "⚡",
    estimatedHours: 1.5,
    progress: 60,
    tags: ["JavaScript", "ES6", "非同期"],
    questions: jsQuestions,
  },
  {
    id: "course-typescript",
    title: "TypeScript 入門",
    description: "型システムの基礎から generics や型推論まで、安全な JS 開発を可能にする TS を学びます。",
    category: "frontend",
    level: "intermediate",
    status: "in-progress",
    icon: "🔷",
    estimatedHours: 1.5,
    progress: 30,
    tags: ["TypeScript", "型", "Generics"],
    questions: tsQuestions,
  },
  {
    id: "course-react",
    title: "React 入門",
    description: "コンポーネント設計・hooks・state など React の基礎を学びます。",
    category: "frontend",
    level: "intermediate",
    status: "not-started",
    icon: "⚛️",
    estimatedHours: 2,
    progress: 0,
    tags: ["React", "Hooks", "コンポーネント"],
    questions: reactQuestions,
  },
  {
    id: "course-react-adv",
    title: "React 応用",
    description: "memo/useMemo/Context/Error Boundary など、現場で役立つ最適化と設計を学びます。",
    category: "frontend",
    level: "advanced",
    status: "locked",
    icon: "⚛️",
    estimatedHours: 2.5,
    progress: 0,
    tags: ["React", "最適化", "設計"],
    questions: reactAdvQuestions,
  },
  {
    id: "course-nextjs",
    title: "Next.js 入門",
    description: "App Router・Server Component・SSR/SSG など Next.js の要点を学びます。",
    category: "frontend",
    level: "intermediate",
    status: "locked",
    icon: "▲",
    estimatedHours: 1.7,
    progress: 0,
    tags: ["Next.js", "SSR", "RSC"],
    questions: nextQuestions,
  },
  {
    id: "course-tailwind",
    title: "Tailwind CSS 入門",
    description: "ユーティリティファーストでの UI 構築・レスポンシブ・状態クラスを学びます。",
    category: "frontend",
    level: "beginner",
    status: "not-started",
    icon: "🌬️",
    estimatedHours: 1,
    progress: 0,
    tags: ["Tailwind", "CSS", "ユーティリティ"],
    questions: tailwindQuestions,
  },
  {
    id: "course-ui-design",
    title: "UIコンポーネント設計",
    description: "Atomic Design・composition・controlled API など、再利用可能な UI 設計を学びます。",
    category: "frontend",
    level: "intermediate",
    status: "locked",
    icon: "🧩",
    estimatedHours: 1.5,
    progress: 0,
    tags: ["UI設計", "Atomic", "composition"],
    questions: uiComponentQuestions,
  },
  {
    id: "course-form",
    title: "フォーム実装入門",
    description: "controlled form / バリデーション / submit 制御など、フォーム実装の基本を学びます。",
    category: "frontend",
    level: "beginner",
    status: "not-started",
    icon: "📝",
    estimatedHours: 1,
    progress: 0,
    tags: ["フォーム", "バリデーション"],
    questions: formQuestions,
  },
  {
    id: "course-frontend-test",
    title: "フロントエンドテスト入門",
    description: "React Testing Library と Vitest を中心に、UI のテスト戦略を学びます。",
    category: "testing",
    level: "intermediate",
    status: "locked",
    icon: "🧪",
    estimatedHours: 1.5,
    progress: 0,
    tags: ["テスト", "Vitest", "RTL"],
    questions: frontTestQuestions,
  },

  // -------- Backend --------
  {
    id: "course-python",
    title: "Python 入門",
    description: "型ヒント・内包表記・venv など、Pythonの基本要素を学びます。",
    category: "backend",
    level: "beginner",
    status: "not-started",
    icon: "🐍",
    estimatedHours: 1.5,
    progress: 0,
    tags: ["Python", "型ヒント"],
    questions: pythonQuestions,
  },
  {
    id: "course-fastapi",
    title: "FastAPI 入門",
    description: "Pydantic を活かした型安全な API 開発と、Depends による依存性注入を学びます。",
    category: "backend",
    level: "intermediate",
    status: "not-started",
    icon: "🚀",
    estimatedHours: 1.7,
    progress: 0,
    tags: ["FastAPI", "Python", "REST"],
    questions: fastapiQuestions,
  },
  {
    id: "course-rest",
    title: "REST API 設計入門",
    description: "リソース指向・ステートレス・ステータスコードなど、API 設計の原則を学びます。",
    category: "backend",
    level: "intermediate",
    status: "locked",
    icon: "🔌",
    estimatedHours: 1,
    progress: 0,
    tags: ["REST", "API設計"],
    questions: restQuestions,
  },
  {
    id: "course-sql",
    title: "SQL 入門",
    description: "SELECT / WHERE / JOIN / GROUP BY など、SQL の基本構文を学びます。",
    category: "database",
    level: "beginner",
    status: "not-started",
    icon: "🗄️",
    estimatedHours: 1.5,
    progress: 0,
    tags: ["SQL", "RDB"],
    questions: sqlQuestions,
  },
  {
    id: "course-postgres",
    title: "PostgreSQL 入門",
    description: "JSONB・index・トランザクションなど PostgreSQL 特有の話題を学びます。",
    category: "database",
    level: "intermediate",
    status: "locked",
    icon: "🐘",
    estimatedHours: 1.5,
    progress: 0,
    tags: ["PostgreSQL", "JSONB", "index"],
    questions: pgQuestions,
  },
  {
    id: "course-sqlalchemy",
    title: "SQLAlchemy 入門",
    description: "ORM・Session・relationship など、Python から RDB を扱う基本を学びます。",
    category: "database",
    level: "intermediate",
    status: "locked",
    icon: "🧬",
    estimatedHours: 1.5,
    progress: 0,
    tags: ["SQLAlchemy", "ORM"],
    questions: sqlalchemyQuestions,
  },
  {
    id: "course-auth",
    title: "認証・認可入門",
    description: "認証/認可の区別、JWT、パスワードハッシュなどセキュリティの基本を学びます。",
    category: "backend",
    level: "intermediate",
    status: "locked",
    icon: "🔐",
    estimatedHours: 1.7,
    progress: 0,
    tags: ["認証", "認可", "JWT"],
    questions: authQuestions,
  },
  {
    id: "course-backend-test",
    title: "バックエンドテスト入門",
    description: "pytest・fixture・integration test 等、バックエンドのテスト戦略を学びます。",
    category: "testing",
    level: "intermediate",
    status: "locked",
    icon: "🧪",
    estimatedHours: 1.5,
    progress: 0,
    tags: ["pytest", "テスト"],
    questions: backTestQuestions,
  },
  {
    id: "course-docker",
    title: "Docker 入門",
    description: "Dockerfile / image / container / compose の基本を学びます。",
    category: "infra",
    level: "intermediate",
    status: "locked",
    icon: "🐳",
    estimatedHours: 1.5,
    progress: 0,
    tags: ["Docker", "Compose"],
    questions: dockerQuestions,
  },
  {
    id: "course-aws-deploy",
    title: "AWS デプロイ入門",
    description: "ECS / RDS / S3 / CloudFront / IAM を組み合わせた本番デプロイの考え方を学びます。",
    category: "infra",
    level: "advanced",
    status: "locked",
    icon: "☁️",
    estimatedHours: 2.5,
    progress: 0,
    tags: ["AWS", "デプロイ"],
    questions: awsQuestions,
  },

  // -------- AI / Practice --------
  {
    id: "course-ai-api",
    title: "AI API連携入門",
    description: "AI API をアプリに組み込む時の基本(キー管理・リトライ・ストリーミング)を学びます。",
    category: "ai",
    level: "intermediate",
    status: "locked",
    icon: "🤖",
    estimatedHours: 1.5,
    progress: 0,
    tags: ["AI API", "LLM"],
    questions: aiApiQuestions,
  },
  {
    id: "course-openai",
    title: "OpenAI API 入門",
    description: "ChatCompletion・temperature・systemロールなど OpenAI API の使い方を学びます。",
    category: "ai",
    level: "intermediate",
    status: "locked",
    icon: "🧠",
    estimatedHours: 1.3,
    progress: 0,
    tags: ["OpenAI", "ChatGPT"],
    questions: openaiQuestions,
  },
  {
    id: "course-prompt",
    title: "プロンプト設計入門",
    description: "明確な指示・few-shot・構造化出力など、プロンプト設計の基本を学びます。",
    category: "ai",
    level: "intermediate",
    status: "locked",
    icon: "✍️",
    estimatedHours: 1.5,
    progress: 0,
    tags: ["プロンプト", "few-shot"],
    questions: promptQuestions,
  },
  {
    id: "course-ai-gen",
    title: "AI問題生成機能入門",
    description: "AI で学習問題を生成・重複防止・コスト戦略など、実装の考え方を学びます。",
    category: "ai",
    level: "advanced",
    status: "locked",
    icon: "🪄",
    estimatedHours: 2,
    progress: 0,
    tags: ["AI生成", "問題", "スキーマ"],
    questions: aiGenQuestions,
  },
  {
    id: "course-recommend",
    title: "レコメンド機能入門",
    description: "シグナル設計・コールドスタートなど、学習レコメンドの基本を学びます。",
    category: "ai",
    level: "intermediate",
    status: "locked",
    icon: "🎯",
    estimatedHours: 1.5,
    progress: 0,
    tags: ["レコメンド", "シグナル"],
    questions: recoQuestions,
  },
  {
    id: "course-portfolio",
    title: "ポートフォリオ開発実践",
    description: "READMEの書き方からデプロイ選定まで、ポートフォリオ全体の設計を学びます。",
    category: "practice",
    level: "intermediate",
    status: "locked",
    icon: "📁",
    estimatedHours: 2,
    progress: 0,
    tags: ["ポートフォリオ", "README"],
    questions: portfolioQuestions,
  },
  {
    id: "course-webapp",
    title: "Webアプリ設計実践",
    description: "MVP の考え方とレイヤー設計を、実プロジェクトの視点で学びます。",
    category: "practice",
    level: "intermediate",
    status: "locked",
    icon: "🧭",
    estimatedHours: 2,
    progress: 0,
    tags: ["設計", "MVP"],
    questions: webDesignQuestions,
  },
  {
    id: "course-fullstack",
    title: "フルスタック開発実践",
    description: "フロント/バックの型共有・環境分離など、フルスタックでの実装パターンを学びます。",
    category: "practice",
    level: "advanced",
    status: "locked",
    icon: "🛠️",
    estimatedHours: 2.5,
    progress: 0,
    tags: ["フルスタック", "型共有", "環境"],
    questions: fullstackQuestions,
  },
];

const buildCourse = (init: CourseInit): Course => {
  const lesson: Lesson = {
    id: `${init.id}-lesson-1`,
    title: `${init.title} 基礎`,
    description: `${init.title} の主要ポイントを問題で確認します。`,
    order: 1,
    questions: init.questions,
  };
  return {
    id: init.id,
    title: init.title,
    description: init.description,
    category: init.category,
    level: init.level,
    status: init.status,
    icon: init.icon,
    color: CATEGORY_COLOR[init.category],
    estimatedHours: init.estimatedHours,
    lessonCount: 1,
    questionCount: init.questions.length,
    progress: init.progress,
    isLocked: init.status === "locked",
    tags: init.tags,
    lessons: [lesson],
  };
};

const COURSE_CATALOG: Course[] = COURSE_INITS.map(buildCourse);

export const fetchCourseCatalog = async (): Promise<CourseCatalogResponse> => {
  return { courses: COURSE_CATALOG };
};

export const getCourseCatalog = (): CourseCatalogResponse => ({ courses: COURSE_CATALOG });

export const fetchCatalogCourse = async (courseId: string): Promise<Course | null> => {
  return COURSE_CATALOG.find((c) => c.id === courseId) ?? null;
};
