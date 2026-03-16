"use client";

import { useMemo, useState } from "react";
import { diffLines } from "diff";

import { CodeEditor } from "@/components/common/monaco-editor";
import { EditorPanel } from "@/components/common/editor-panel";
import { EmptyState } from "@/components/common/empty-state";
import { FileDropzone } from "@/components/common/file-dropzone";
import { StatusCallout } from "@/components/common/status-callout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { analyzeGovernorRisks } from "@/lib/analyzers/governor";
import { inspectLog } from "@/lib/parsers/log-inspector";
import { copyText, downloadTextFile } from "@/lib/utils";
import { useLocalStorage } from "@/hooks/use-local-storage";

export function LogInspectorTool() {
  const { value: logContent, setValue: setLogContent } = useLocalStorage(
    "ls-log-input",
    "09:00:00.0 (100000)|EXECUTION_STARTED\n09:00:00.0 (200000)|SOQL_EXECUTE_BEGIN|[14]|Aggregations:0|SELECT Id, Name FROM Account\n09:00:00.0 (300000)|DML_BEGIN|[25]|Op:Update|Type:Account|Rows:1\n09:00:00.0 (450000)|EXCEPTION_THROWN|[31]|System.NullPointerException: Attempt to de-reference a null object"
  );
  const [filter, setFilter] = useState("");
  const summary = useMemo(() => inspectLog(logContent, filter), [filter, logContent]);

  return (
    <section className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader className="space-y-4 border-b border-white/10">
            <div className="space-y-2">
              <CardTitle className="text-2xl">Log Inspector</CardTitle>
              <p className="text-sm leading-6 text-muted-foreground">
                Paste or upload a Salesforce debug log, filter important lines, and summarize the events that matter first.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={() => downloadTextFile("log-summary.txt", summary.filteredLines.join("\n"))}>
                Export filtered lines
              </Button>
              <Button type="button" variant="secondary" onClick={() => setLogContent("")}>
                Clear log
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <FileDropzone onTextLoaded={(value) => setLogContent(value)} />
            <Input
              placeholder="Filter lines by text, token, exception, or object name"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            />
            <EditorPanel
              title="Debug log"
              onCopy={() => void copyText(logContent)}
              onClear={() => setLogContent("")}
            >
              <CodeEditor value={logContent} onChange={setLogContent} language="plaintext" />
            </EditorPanel>
          </CardContent>
        </Card>
        <div className="space-y-4">
          <StatusCallout
            tone="info"
            title="Rule-based summary"
            description="Counts are derived from actual log tokens such as SOQL_EXECUTE_BEGIN, DML_BEGIN, and EXCEPTION_THROWN."
          />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            {[
              ["Lines", summary.lineCount],
              ["SOQL", summary.soqlCount],
              ["DML", summary.dmlCount],
              ["Exceptions", summary.exceptionCount],
              ["Limit signals", summary.limitSignals]
            ].map(([label, value]) => (
              <Card key={label} className="bg-white/[0.03]">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="mt-2 text-3xl font-semibold">{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader>
            <CardTitle>Suspicious events</CardTitle>
          </CardHeader>
          <CardContent>
            {summary.suspiciousEvents.length ? (
              <div className="space-y-2">
                {summary.suspiciousEvents.slice(0, 20).map((eventLine, index) => (
                  <div
                    key={`${eventLine}-${index}`}
                    className="rounded-xl border border-amber-400/15 bg-amber-400/10 p-3 text-sm text-amber-100"
                  >
                    {eventLine}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No suspicious events surfaced"
                description="Paste a fuller log or search for a specific token to narrow down the lines you care about."
              />
            )}
          </CardContent>
        </Card>
        <EditorPanel title="Filtered log lines">
          <CodeEditor
            value={summary.filteredLines.join("\n")}
            onChange={() => undefined}
            language="plaintext"
            readOnly
          />
        </EditorPanel>
      </div>
    </section>
  );
}

export function GovernorLimitAnalyzerTool() {
  const { value: input, setValue: setInput } = useLocalStorage(
    "ls-governor-input",
    "trigger AccountTrigger on Account (before insert, before update) {\n  for (Account account : Trigger.new) {\n    List<Contact> contacts = [SELECT Id FROM Contact WHERE AccountId = :account.Id];\n    update contacts;\n  }\n}"
  );
  const findings = useMemo(() => analyzeGovernorRisks(input), [input]);

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <EditorPanel
        title="Apex or log input"
        onCopy={() => void copyText(input)}
        onClear={() => setInput("")}
      >
        <CodeEditor value={input} onChange={setInput} language="java" />
      </EditorPanel>
      <div className="space-y-4">
        <StatusCallout
          tone="warning"
          title="High-confidence rules only"
          description="This analyzer reports findings only when the rule engine sees specific patterns instead of inventing possible issues."
        />
        {findings.map((finding) => (
          <Card key={finding.id} className="border-white/10 bg-white/[0.03]">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-lg">{finding.category}</CardTitle>
                <Badge variant={finding.severity === "high" ? "warning" : "secondary"}>
                  {finding.severity}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{finding.message}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-primary">Evidence</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{finding.evidence}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-primary">Suggestion</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {finding.suggestion}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

export function MetadataDiffTool() {
  const { value: leftText, setValue: setLeftText } = useLocalStorage(
    "ls-diff-left",
    "<CustomObject>\n  <label>Invoice</label>\n  <deploymentStatus>Deployed</deploymentStatus>\n</CustomObject>"
  );
  const { value: rightText, setValue: setRightText } = useLocalStorage(
    "ls-diff-right",
    "<CustomObject>\n  <label>Invoices</label>\n  <deploymentStatus>InDevelopment</deploymentStatus>\n</CustomObject>"
  );
  const [mode, setMode] = useState<"inline" | "split">("inline");

  const parts = useMemo(() => diffLines(leftText, rightText), [leftText, rightText]);

  return (
    <section className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <EditorPanel
          title="Original"
          onCopy={() => void copyText(leftText)}
          onDownload={() => downloadTextFile("metadata-left.xml", leftText)}
        >
          <CodeEditor value={leftText} onChange={setLeftText} language="xml" />
        </EditorPanel>
        <EditorPanel
          title="Updated"
          onCopy={() => void copyText(rightText)}
          onDownload={() => downloadTextFile("metadata-right.xml", rightText)}
        >
          <CodeEditor value={rightText} onChange={setRightText} language="xml" />
        </EditorPanel>
      </div>

      <Card className="border-white/10 bg-white/[0.03]">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl">Metadata Diff</CardTitle>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Compare two pasted files in inline or split mode to review exact changes before deployment.
            </p>
          </div>
          <Tabs value={mode} onValueChange={(value) => setMode(value as "inline" | "split")}>
            <TabsList>
              <TabsTrigger value="inline">Inline</TabsTrigger>
              <TabsTrigger value="split">Split</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="pt-6">
          {mode === "inline" ? <InlineDiff parts={parts} /> : <SplitDiff parts={parts} />}
        </CardContent>
      </Card>
    </section>
  );
}

function InlineDiff({
  parts
}: {
  parts: ReturnType<typeof diffLines>;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      {parts.map((part, index) => (
        <pre
          key={`${part.value}-${index}`}
          className={`overflow-x-auto px-4 py-3 text-sm leading-6 ${
            part.added
              ? "bg-emerald-500/10 text-emerald-100"
              : part.removed
                ? "bg-red-500/10 text-red-100"
                : "bg-black/20 text-muted-foreground"
          }`}
        >
          {part.value}
        </pre>
      ))}
    </div>
  );
}

function SplitDiff({
  parts
}: {
  parts: ReturnType<typeof diffLines>;
}) {
  const rows = parts.flatMap((part) => {
    const lines = part.value.split("\n").filter((line, index, array) => line || index < array.length - 1);
    return lines.map((line) => ({
      left: part.added ? "" : line,
      right: part.removed ? "" : line,
      status: part.added ? "added" : part.removed ? "removed" : "same"
    }));
  });

  return (
    <div className="grid overflow-hidden rounded-2xl border border-white/10 md:grid-cols-2">
      <div className="border-r border-white/10">
        {rows.map((row, index) => (
          <pre
            key={`left-${index}`}
            className={`px-4 py-3 text-sm leading-6 ${
              row.status === "removed"
                ? "bg-red-500/10 text-red-100"
                : "bg-black/20 text-muted-foreground"
            }`}
          >
            {row.left || " "}
          </pre>
        ))}
      </div>
      <div>
        {rows.map((row, index) => (
          <pre
            key={`right-${index}`}
            className={`px-4 py-3 text-sm leading-6 ${
              row.status === "added"
                ? "bg-emerald-500/10 text-emerald-100"
                : "bg-black/20 text-muted-foreground"
            }`}
          >
            {row.right || " "}
          </pre>
        ))}
      </div>
    </div>
  );
}
