"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { Wand2 } from "lucide-react";

import { CodeEditor } from "@/components/common/monaco-editor";
import { EditorPanel } from "@/components/common/editor-panel";
import { EmptyState } from "@/components/common/empty-state";
import { StatusCallout } from "@/components/common/status-callout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatApex } from "@/lib/formatters/apex";
import { formatJson } from "@/lib/formatters/json";
import { formatSoql } from "@/lib/formatters/soql";
import { formatXml } from "@/lib/formatters/xml";
import { generateApexFromJson } from "@/lib/generators/json-to-apex";
import { copyText, downloadTextFile } from "@/lib/utils";
import { useLocalStorage } from "@/hooks/use-local-storage";

function Workspace({
  title,
  description,
  actions,
  status,
  leftTitle,
  rightTitle,
  leftEditor,
  rightEditor
}: {
  title: string;
  description: string;
  actions: ReactNode;
  status?: ReactNode;
  leftTitle: string;
  rightTitle: string;
  leftEditor: ReactNode;
  rightEditor?: ReactNode;
  rightPanel?: ReactNode;
}) {
  return (
    <section className="space-y-6">
      <Card className="border-white/10 bg-white/[0.03]">
        <CardHeader className="flex flex-col gap-4 border-b border-white/10 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <CardTitle className="text-2xl">{title}</CardTitle>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
          <div className="flex flex-wrap gap-2">{actions}</div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {status}
          <div className="grid gap-6 xl:grid-cols-2">
            <EditorPanel title={leftTitle}>{leftEditor}</EditorPanel>
            {rightPanel ?? <EditorPanel title={rightTitle}>{rightEditor}</EditorPanel>}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export function ApexFormatterTool() {
  const { value: input, setValue: setInput } = useLocalStorage(
    "ls-apex-input",
    "public with sharing class InvoiceService {public static void sync(List<Account> accounts){for(Account account:accounts){System.debug(account.Name);}}}"
  );
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  function handleFormat() {
    const result = formatApex(input);
    if (!result.ok) {
      setError(result.error);
      setOutput("");
      return;
    }

    setError("");
    setOutput(result.output);
  }

  return (
    <Workspace
      title="Apex Formatter"
      description="Paste Apex code, clean indentation, copy the result, and safely handle malformed snippets without a page refresh."
      actions={
        <>
          <Button type="button" onClick={handleFormat}>
            <Wand2 className="h-4 w-4" />
            Format Apex
          </Button>
          <Button type="button" variant="secondary" onClick={() => setInput("")}>
            Clear input
          </Button>
        </>
      }
      status={
        error ? (
          <StatusCallout tone="warning" title="Unable to format Apex" description={error} />
        ) : (
          <StatusCallout
            tone="info"
            title="Local-first formatting"
            description="Formatting runs in the browser so classes, triggers, and snippets stay on the current device by default."
          />
        )
      }
      leftTitle="Apex input"
      rightTitle="Formatted output"
      leftEditor={<CodeEditor value={input} onChange={setInput} language="java" />}
      rightPanel={
        output ? (
          <EditorPanel
            title="Formatted output"
            onCopy={() => void copyText(output)}
            onDownload={() => downloadTextFile("formatted-apex.cls", output)}
            onClear={() => setOutput("")}
          >
            <CodeEditor value={output} onChange={() => undefined} language="java" readOnly />
          </EditorPanel>
        ) : (
          <EmptyState
            title="No formatted Apex yet"
            description="Run the formatter to generate cleaned output that you can copy back into Salesforce or your editor."
          />
        )
      }
    />
  );
}

export function SoqlFormatterTool() {
  const { value: input, setValue: setInput } = useLocalStorage(
    "ls-soql-input",
    "select Id, Name, (select Id, LastName from Contacts) from Account where Industry = 'Technology' and CreatedDate = LAST_N_DAYS:30 order by Name desc limit 50"
  );
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  function handleFormat() {
    const result = formatSoql(input);
    if (!result.ok) {
      setError(result.error);
      setOutput("");
      return;
    }

    setError("");
    setOutput(result.output);
  }

  return (
    <Workspace
      title="SOQL Formatter"
      description="Make long queries readable, split clauses cleanly, and improve review quality for nested subqueries and filters."
      actions={
        <>
          <Button type="button" onClick={handleFormat}>
            <Wand2 className="h-4 w-4" />
            Format SOQL
          </Button>
          <Button type="button" variant="secondary" onClick={() => setInput("")}>
            Clear query
          </Button>
        </>
      }
      status={
        error ? (
          <StatusCallout tone="warning" title="SOQL formatting issue" description={error} />
        ) : (
          <StatusCallout
            tone="success"
            title="Readable query structure"
            description="The formatter expands major clauses and keeps nested query blocks easier to scan."
          />
        )
      }
      leftTitle="SOQL input"
      rightTitle="Formatted query"
      leftEditor={<CodeEditor value={input} onChange={setInput} language="sql" />}
      rightPanel={
        output ? (
          <EditorPanel
            title="Formatted query"
            onCopy={() => void copyText(output)}
            onDownload={() => downloadTextFile("formatted-query.soql", output)}
            onClear={() => setOutput("")}
          >
            <CodeEditor value={output} onChange={() => undefined} language="sql" readOnly />
          </EditorPanel>
        ) : (
          <EmptyState
            title="No formatted query yet"
            description="Format your query to copy a more readable version into code review, docs, or debug sessions."
          />
        )
      }
    />
  );
}

export function JsonFormatterTool() {
  const { value: input, setValue: setInput } = useLocalStorage(
    "ls-json-input",
    '{\n  "accountId": "001xx000003DGXw",\n  "features": ["formatter", "generator"],\n  "active": true\n}'
  );
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  function handleFormat(compact: boolean) {
    const result = formatJson(input, compact);
    if (!result.ok) {
      setError(result.error);
      setOutput("");
      return;
    }

    setError("");
    setOutput(result.output);
  }

  return (
    <Workspace
      title="JSON Formatter"
      description="Prettify, minify, validate, and copy JSON with clear parser errors for malformed payloads."
      actions={
        <>
          <Button type="button" onClick={() => handleFormat(false)}>
            Prettify
          </Button>
          <Button type="button" variant="secondary" onClick={() => handleFormat(true)}>
            Minify
          </Button>
          <Button type="button" variant="ghost" onClick={() => setInput("")}>
            Clear
          </Button>
        </>
      }
      status={
        error ? (
          <StatusCallout tone="warning" title="JSON validation failed" description={error} />
        ) : (
          <StatusCallout
            tone="info"
            title="Validation built in"
            description="Every format action parses the payload first, so you get a real error message instead of broken output."
          />
        )
      }
      leftTitle="JSON input"
      rightTitle="JSON output"
      leftEditor={<CodeEditor value={input} onChange={setInput} language="json" />}
      rightPanel={
        output ? (
          <EditorPanel
            title="JSON output"
            onCopy={() => void copyText(output)}
            onDownload={() => downloadTextFile("payload.json", output)}
            onClear={() => setOutput("")}
          >
            <CodeEditor value={output} onChange={() => undefined} language="json" readOnly />
          </EditorPanel>
        ) : (
          <EmptyState
            title="No JSON output yet"
            description="Prettify or minify a payload to inspect it faster or prepare it for transport."
          />
        )
      }
    />
  );
}

export function XmlFormatterTool() {
  const { value: input, setValue: setInput } = useLocalStorage(
    "ls-xml-input",
    "<CustomObject xmlns=\"http://soap.sforce.com/2006/04/metadata\"><label>Invoice</label><pluralLabel>Invoices</pluralLabel></CustomObject>"
  );
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  function handleFormat() {
    const result = formatXml(input);
    if (!result.ok) {
      setError(result.error);
      setOutput("");
      return;
    }

    setError("");
    setOutput(result.output);
  }

  return (
    <Workspace
      title="XML Formatter"
      description="Beautify metadata XML, integration payloads, and config files while catching malformed XML safely in the browser."
      actions={
        <>
          <Button type="button" onClick={handleFormat}>
            <Wand2 className="h-4 w-4" />
            Format XML
          </Button>
          <Button type="button" variant="secondary" onClick={() => setInput("")}>
            Clear
          </Button>
        </>
      }
      status={
        error ? (
          <StatusCallout tone="warning" title="XML parsing failed" description={error} />
        ) : (
          <StatusCallout
            tone="success"
            title="Metadata-friendly output"
            description="Use this for custom metadata, object XML, Lightning bundles, and other Salesforce XML artifacts."
          />
        )
      }
      leftTitle="XML input"
      rightTitle="Formatted XML"
      leftEditor={<CodeEditor value={input} onChange={setInput} language="xml" />}
      rightPanel={
        output ? (
          <EditorPanel
            title="Formatted XML"
            onCopy={() => void copyText(output)}
            onDownload={() => downloadTextFile("formatted.xml", output)}
            onClear={() => setOutput("")}
          >
            <CodeEditor value={output} onChange={() => undefined} language="xml" readOnly />
          </EditorPanel>
        ) : (
          <EmptyState
            title="No XML output yet"
            description="Run the formatter to produce readable XML that is easier to compare and review."
          />
        )
      }
    />
  );
}

export function JsonToApexTool() {
  const { value: input, setValue: setInput } = useLocalStorage(
    "ls-json-to-apex-input",
    '{\n  "name": "Lightning Studio",\n  "active": true,\n  "account": {\n    "id": "001xx000003DGXw",\n    "industry": "Technology"\n  },\n  "contacts": [\n    {\n      "firstName": "Ada",\n      "lastName": "Lovelace"\n    }\n  ]\n}'
  );
  const [className, setClassName] = useState("LightningStudioResponse");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const outputMetrics = useMemo(
    () => ({
      lines: output ? output.split("\n").length : 0,
      classes: output ? (output.match(/public class/g) || []).length : 0
    }),
    [output]
  );

  function handleGenerate() {
    const result = generateApexFromJson(className, input);
    if (!result.ok) {
      setError(result.error);
      setOutput("");
      return;
    }

    setError("");
    setOutput(result.output);
  }

  return (
    <section className="space-y-6">
      <Card className="border-white/10 bg-white/[0.03]">
        <CardHeader className="space-y-4 border-b border-white/10">
          <div className="space-y-2">
            <CardTitle className="text-2xl">JSON to Apex</CardTitle>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Convert JSON payloads into Apex model classes with nested objects, arrays, and a generated parse helper.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-[minmax(0,280px)_auto] md:items-end">
            <div className="space-y-2">
              <label htmlFor="json-to-apex-class" className="text-sm font-medium">
                Root class name
              </label>
              <Input
                id="json-to-apex-class"
                value={className}
                onChange={(event) => setClassName(event.target.value)}
                placeholder="AccountPayload"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={handleGenerate}>
                Generate classes
              </Button>
              <Button type="button" variant="secondary" onClick={() => setInput("")}>
                Clear JSON
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {error ? (
            <StatusCallout tone="warning" title="JSON to Apex failed" description={error} />
          ) : (
            <StatusCallout
              tone="info"
              title="Strongly typed output"
              description="The generator infers scalar types, nested objects, and array models from the current sample payload."
            />
          )}
          <div className="grid gap-6 xl:grid-cols-2">
            <EditorPanel title="JSON payload">
              <CodeEditor value={input} onChange={setInput} language="json" />
            </EditorPanel>
            {output ? (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Card className="bg-white/[0.02]">
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Generated classes</p>
                      <p className="mt-2 text-3xl font-semibold">{outputMetrics.classes || 1}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/[0.02]">
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Lines of Apex</p>
                      <p className="mt-2 text-3xl font-semibold">{outputMetrics.lines}</p>
                    </CardContent>
                  </Card>
                </div>
                <EditorPanel
                  title="Generated Apex"
                  onCopy={() => void copyText(output)}
                  onDownload={() => downloadTextFile(`${className || "RootResponse"}.cls`, output)}
                  onClear={() => setOutput("")}
                >
                  <CodeEditor value={output} onChange={() => undefined} language="java" readOnly />
                </EditorPanel>
              </div>
            ) : (
              <EmptyState
                title="No Apex output yet"
                description="Generate a model class to get strongly typed properties and a parse helper for the current JSON sample."
              />
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
