"use client";

import { useMemo, useState } from "react";

import { CodeEditor } from "@/components/common/monaco-editor";
import { EditorPanel } from "@/components/common/editor-panel";
import { StatusCallout } from "@/components/common/status-callout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateMarkup } from "@/lib/builders/markup";
import { copyText, downloadTextFile } from "@/lib/utils";

export function SalesforceMarkupBuilderTool() {
  const [title, setTitle] = useState("Account Workspace");
  const [options, setOptions] = useState({
    includeCard: true,
    includeInput: true,
    includeButton: true,
    includeGrid: true,
    includeDatatable: false
  });

  const output = useMemo(
    () =>
      generateMarkup({
        title,
        ...options
      }),
    [options, title]
  );

  return (
    <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Card className="border-white/10 bg-white/[0.03]">
        <CardHeader>
          <CardTitle className="text-2xl">Salesforce Markup Builder</CardTitle>
          <p className="text-sm leading-6 text-muted-foreground">
            Turn common Lightning UI patterns into clean LWC markup snippets with a visual form instead of starting from scratch.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <StatusCallout
            tone="info"
            title="Visual to code workflow"
            description="Pick the building blocks you want and Lightning Studio keeps the generated markup in sync live."
          />
          <div className="space-y-2">
            <Label htmlFor="markup-title">Card title</Label>
            <Input id="markup-title" value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>
          <div className="grid gap-2 text-sm text-muted-foreground">
            {[
              ["includeCard", "Wrap content in a lightning-card"],
              ["includeGrid", "Add a responsive grid section"],
              ["includeInput", "Include a lightning-input"],
              ["includeButton", "Include a primary button"],
              ["includeDatatable", "Include a lightning-datatable"]
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={options[key as keyof typeof options]}
                  onChange={(event) =>
                    setOptions((current) => ({
                      ...current,
                      [key]: event.target.checked
                    }))
                  }
                />
                {label}
              </label>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => void copyText(output)}>
              Copy markup
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => downloadTextFile("markup-builder-output.html", output)}
            >
              Download snippet
            </Button>
          </div>
        </CardContent>
      </Card>
      <EditorPanel title="Generated LWC markup" onCopy={() => void copyText(output)}>
        <CodeEditor value={output} onChange={() => undefined} language="html" readOnly />
      </EditorPanel>
    </section>
  );
}
