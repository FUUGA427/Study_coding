import Editor from "@monaco-editor/react";

export function CodeEditor({
  value,
  onChange,
  language = "python",
  height = 320,
}: {
  value: string;
  onChange: (v: string) => void;
  language?: string;
  height?: number | string;
}) {
  return (
    <div className="border border-slate-300 rounded-md overflow-hidden">
      <Editor
        height={height}
        defaultLanguage={language}
        language={language}
        value={value}
        onChange={(v) => onChange(v ?? "")}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
      />
    </div>
  );
}
