"use client";

import dynamic from "next/dynamic";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

export function CodeEditor({
  value,
  onChange,
  language = "javascript",
  height = 360,
  readOnly = false
}: {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  height?: number;
  readOnly?: boolean;
}) {
  return (
    <MonacoEditor
      height={height}
      theme="vs-dark"
      language={language}
      value={value}
      onChange={(nextValue) => onChange(nextValue ?? "")}
      options={{
        minimap: { enabled: false },
        fontSize: 13,
        wordWrap: "on",
        readOnly,
        smoothScrolling: true,
        scrollBeyondLastLine: false,
        automaticLayout: true
      }}
    />
  );
}
