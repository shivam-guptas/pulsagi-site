import type { ReactNode } from "react";
import { Copy, Download, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function EditorPanel({
  title,
  children,
  onCopy,
  onDownload,
  onClear,
  actions
}: {
  title: string;
  children: ReactNode;
  onCopy?: () => void;
  onDownload?: () => void;
  onClear?: () => void;
  actions?: ReactNode;
}) {
  return (
    <Card className="overflow-hidden border-white/10 bg-black/30">
      <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-white/10">
        <CardTitle className="text-base">{title}</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          {onCopy ? (
            <Button type="button" variant="ghost" size="sm" onClick={onCopy}>
              <Copy className="h-4 w-4" />
              Copy
            </Button>
          ) : null}
          {onDownload ? (
            <Button type="button" variant="ghost" size="sm" onClick={onDownload}>
              <Download className="h-4 w-4" />
              Download
            </Button>
          ) : null}
          {onClear ? (
            <Button type="button" variant="ghost" size="sm" onClick={onClear}>
              <Trash2 className="h-4 w-4" />
              Clear
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  );
}
