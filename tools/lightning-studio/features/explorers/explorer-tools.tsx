"use client";

import { startTransition, useState } from "react";

import { CodeEditor } from "@/components/common/monaco-editor";
import { EditorPanel } from "@/components/common/editor-panel";
import { EmptyState } from "@/components/common/empty-state";
import { StatusCallout } from "@/components/common/status-callout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { copyText } from "@/lib/utils";
import { useLocalStorage } from "@/hooks/use-local-storage";

type RequestHistoryItem = {
  id: string;
  label: string;
  endpoint: string;
  body: string;
  headers: string;
  method?: string;
  query?: string;
  variables?: string;
};

function parseHeaders(input: string) {
  const headers = new Headers();

  input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const separatorIndex = line.indexOf(":");
      if (separatorIndex > -1) {
        const key = line.slice(0, separatorIndex).trim();
        const value = line.slice(separatorIndex + 1).trim();
        headers.set(key, value);
      }
    });

  return headers;
}

function formatResponseText(text: string) {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

export function RestApiExplorerTool() {
  const { value: history, setValue: setHistory } = useLocalStorage<RequestHistoryItem[]>(
    "ls-rest-history",
    []
  );
  const [method, setMethod] = useState("GET");
  const [endpoint, setEndpoint] = useState("https://example.my.salesforce.com/services/data/v61.0/query?q=SELECT+Id+FROM+Account");
  const [headers, setHeaders] = useState("Authorization: Bearer YOUR_TOKEN\nContent-Type: application/json");
  const [body, setBody] = useState('{\n  "Name": "Lightning Studio"\n}');
  const [response, setResponse] = useState("");
  const [status, setStatus] = useState("No request sent yet.");
  const [isLoading, setIsLoading] = useState(false);

  async function sendRequest() {
    setIsLoading(true);

    startTransition(() => {
      setStatus("Sending request...");
    });

    try {
      const requestInit: RequestInit = {
        method,
        headers: parseHeaders(headers)
      };

      if (!["GET", "HEAD"].includes(method) && body.trim()) {
        requestInit.body = body;
      }

      const result = await fetch(endpoint, requestInit);
      const text = await result.text();
      setResponse(formatResponseText(text));
      setStatus(`${result.status} ${result.statusText}`);

      setHistory([
        {
          id: `${Date.now()}`,
          label: `${method} ${endpoint}`,
          endpoint,
          headers,
          body,
          method
        },
        ...history
      ].slice(0, 10));
    } catch (error) {
      setResponse("");
      setStatus(
        error instanceof Error
          ? `${error.message}. This can happen when the target endpoint blocks browser CORS requests.`
          : "Request failed."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="space-y-6">
      <Card className="border-white/10 bg-white/[0.03]">
        <CardHeader>
          <CardTitle className="text-2xl">REST API Explorer</CardTitle>
          <p className="text-sm leading-6 text-muted-foreground">
            Compose requests, inspect formatted responses, and save local history for repeatable API workflows.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <StatusCallout
            tone="info"
            title="Browser request model"
            description="Requests are sent from your browser, so endpoint CORS rules still apply. This tool is ready for auth header configuration but does not proxy requests by default."
          />
          <div className="grid gap-4 md:grid-cols-[140px_minmax(0,1fr)]">
            <div className="space-y-2">
              <Label htmlFor="rest-method">Method</Label>
              <Select id="rest-method" value={method} onChange={(event) => setMethod(event.target.value)}>
                {["GET", "POST", "PUT", "PATCH", "DELETE"].map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rest-endpoint">Endpoint</Label>
              <Input id="rest-endpoint" value={endpoint} onChange={(event) => setEndpoint(event.target.value)} />
            </div>
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            <EditorPanel title="Headers">
              <CodeEditor value={headers} onChange={setHeaders} language="plaintext" height={220} />
            </EditorPanel>
            <EditorPanel title="Body">
              <CodeEditor value={body} onChange={setBody} language="json" height={220} />
            </EditorPanel>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => void sendRequest()} disabled={isLoading}>
              {isLoading ? "Sending..." : "Send request"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setResponse("")}>
              Clear response
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <EditorPanel title={`Response (${status})`} onCopy={() => void copyText(response)}>
          <CodeEditor value={response} onChange={() => undefined} language="json" readOnly />
        </EditorPanel>
        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader>
            <CardTitle>Request history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {history.length ? (
              history.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left transition hover:border-primary/20"
                  onClick={() => {
                    setMethod(item.method || "GET");
                    setEndpoint(item.endpoint);
                    setHeaders(item.headers);
                    setBody(item.body);
                  }}
                >
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.endpoint}</p>
                </button>
              ))
            ) : (
              <EmptyState
                title="No request history yet"
                description="Sent requests are stored locally so you can replay common endpoints quickly."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export function GraphqlExplorerTool() {
  const { value: history, setValue: setHistory } = useLocalStorage<RequestHistoryItem[]>(
    "ls-graphql-history",
    []
  );
  const [endpoint, setEndpoint] = useState("https://example.com/graphql");
  const [headers, setHeaders] = useState("Authorization: Bearer YOUR_TOKEN\nContent-Type: application/json");
  const [query, setQuery] = useState("query Accounts {\n  uiapi {\n    query {\n      Account(first: 5) {\n        edges {\n          node {\n            Id\n            Name {\n              value\n            }\n          }\n        }\n      }\n    }\n  }\n}");
  const [variables, setVariables] = useState("{\n  \"limit\": 5\n}");
  const [response, setResponse] = useState("");
  const [status, setStatus] = useState("No request sent yet.");
  const [isLoading, setIsLoading] = useState(false);

  async function sendQuery() {
    setIsLoading(true);

    startTransition(() => {
      setStatus("Running query...");
    });

    try {
      const result = await fetch(endpoint, {
        method: "POST",
        headers: parseHeaders(headers),
        body: JSON.stringify({
          query,
          variables: variables.trim() ? JSON.parse(variables) : {}
        })
      });

      const text = await result.text();
      setResponse(formatResponseText(text));
      setStatus(`${result.status} ${result.statusText}`);

      setHistory([
        {
          id: `${Date.now()}`,
          label: `GraphQL ${endpoint}`,
          endpoint,
          headers,
          body: "",
          query,
          variables
        },
        ...history
      ].slice(0, 10));
    } catch (error) {
      setResponse("");
      setStatus(
        error instanceof Error
          ? `${error.message}. Check CORS rules and JSON variables.`
          : "GraphQL request failed."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="space-y-6">
      <Card className="border-white/10 bg-white/[0.03]">
        <CardHeader>
          <CardTitle className="text-2xl">GraphQL Explorer</CardTitle>
          <p className="text-sm leading-6 text-muted-foreground">
            Send GraphQL queries with variables and headers in one focused workspace, then replay prior requests from local history.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <StatusCallout
            tone="info"
            title="GraphQL-ready workflow"
            description="This explorer formats JSON responses and stores request history locally for later replay."
          />
          <div className="space-y-2">
            <Label htmlFor="graphql-endpoint">Endpoint</Label>
            <Input id="graphql-endpoint" value={endpoint} onChange={(event) => setEndpoint(event.target.value)} />
          </div>
          <div className="grid gap-6 xl:grid-cols-3">
            <EditorPanel title="Headers">
              <CodeEditor value={headers} onChange={setHeaders} language="plaintext" height={220} />
            </EditorPanel>
            <EditorPanel title="Query">
              <CodeEditor value={query} onChange={setQuery} language="graphql" height={220} />
            </EditorPanel>
            <EditorPanel title="Variables">
              <CodeEditor value={variables} onChange={setVariables} language="json" height={220} />
            </EditorPanel>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => void sendQuery()} disabled={isLoading}>
              {isLoading ? "Running..." : "Run query"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setResponse("")}>
              Clear response
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <EditorPanel title={`Response (${status})`} onCopy={() => void copyText(response)}>
          <CodeEditor value={response} onChange={() => undefined} language="json" readOnly />
        </EditorPanel>
        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader>
            <CardTitle>Query history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {history.length ? (
              history.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left transition hover:border-primary/20"
                  onClick={() => {
                    setEndpoint(item.endpoint);
                    setHeaders(item.headers);
                    setQuery(item.query || "");
                    setVariables(item.variables || "{}");
                  }}
                >
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.endpoint}</p>
                </button>
              ))
            ) : (
              <EmptyState
                title="No query history yet"
                description="Executed queries are saved locally so you can rerun common requests quickly."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
