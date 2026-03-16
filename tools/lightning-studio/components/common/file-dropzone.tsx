"use client";

import { useRef } from "react";
import { UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn, formatBytes } from "@/lib/utils";

export function FileDropzone({
  onTextLoaded,
  className,
  accept = ".txt,.log,.json,.xml,.cls,.trigger,.js,.ts"
}: {
  onTextLoaded: (value: string, fileName: string) => void;
  className?: string;
  accept?: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function readFile(file: File) {
    const content = await file.text();
    onTextLoaded(content, `${file.name} (${formatBytes(file.size)})`);
  }

  return (
    <div
      className={cn(
        "flex min-h-36 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center",
        className
      )}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const file = event.dataTransfer.files?.[0];
        if (file) {
          void readFile(file);
        }
      }}
    >
      <UploadCloud className="h-8 w-8 text-primary" />
      <div className="space-y-1">
        <p className="font-medium">Paste content or drop a file here</p>
        <p className="text-sm text-muted-foreground">
          Great for debug logs, metadata XML, JSON payloads, and Apex snippets.
        </p>
      </div>
      <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()}>
        Browse file
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void readFile(file);
          }
        }}
      />
    </div>
  );
}
