"use client";

import { useMemo, useState } from "react";

import { CodeEditor } from "@/components/common/monaco-editor";
import { EditorPanel } from "@/components/common/editor-panel";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { copyText, downloadTextFile } from "@/lib/utils";

export function FilesBundleViewer({
  files,
  language = "xml"
}: {
  files: Record<string, string>;
  language?: string;
}) {
  const entries = useMemo(() => Object.entries(files), [files]);
  const [selectedFile, setSelectedFile] = useState(entries[0]?.[0] ?? "");

  if (!entries.length) {
    return null;
  }

  const currentContent = files[selectedFile] ?? entries[0][1];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {entries.map(([fileName]) => (
          <Badge key={fileName} variant="secondary">
            {fileName}
          </Badge>
        ))}
      </div>
      <Tabs value={selectedFile} onValueChange={setSelectedFile}>
        <TabsList className="h-auto flex-wrap">
          {entries.map(([fileName]) => (
            <TabsTrigger key={fileName} value={fileName}>
              {fileName}
            </TabsTrigger>
          ))}
        </TabsList>
        {entries.map(([fileName]) => (
          <TabsContent key={fileName} value={fileName} />
        ))}
        <EditorPanel
          title={selectedFile}
          onCopy={() => void copyText(currentContent)}
          onDownload={() => downloadTextFile(selectedFile, currentContent)}
        >
          <CodeEditor
            value={currentContent}
            onChange={() => undefined}
            language={guessLanguage(selectedFile, language)}
            readOnly
          />
        </EditorPanel>
      </Tabs>
    </div>
  );
}

function guessLanguage(fileName: string, fallback: string) {
  if (fileName.endsWith(".html") || fileName.endsWith(".cmp")) {
    return "html";
  }

  if (fileName.endsWith(".js")) {
    return "javascript";
  }

  if (fileName.endsWith(".css")) {
    return "css";
  }

  if (fileName.endsWith(".xml") || fileName.endsWith(".auradoc")) {
    return "xml";
  }

  if (fileName.endsWith(".cls") || fileName.endsWith(".trigger")) {
    return "java";
  }

  return fallback;
}
