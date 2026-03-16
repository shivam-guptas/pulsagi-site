import {
  Blocks,
  Braces,
  Code2,
  Combine,
  Diff,
  FileCode2,
  FileJson2,
  FileSearch2,
  FileStack,
  Gauge,
  LayoutTemplate,
  MessageSquareCode,
  Network,
  Radar
} from "lucide-react";

import type { ToolDefinition } from "@/types/tool";

export const toolRegistry: ToolDefinition[] = [
  {
    slug: "apex-formatter",
    title: "Apex Formatter",
    tagline: "Clean up Apex classes, triggers, and snippets in seconds.",
    description:
      "Format Apex with browser-based guardrails, clearer indentation, readable spacing, and safe malformed-input handling.",
    category: "Formatters",
    keywords: ["Apex formatter", "Salesforce Apex beautifier", "Apex prettify"],
    icon: Code2,
    featured: true,
    faqs: [
      {
        question: "Does the Apex formatter send code to a server?",
        answer: "No. Formatting runs in the browser by default so snippets stay local."
      },
      {
        question: "Can it handle incomplete Apex?",
        answer: "Yes. It falls back to safe indentation heuristics and surfaces malformed patterns clearly."
      }
    ]
  },
  {
    slug: "soql-formatter",
    title: "SOQL Formatter",
    tagline: "Make long queries readable, reviewable, and safer to share.",
    description:
      "Format SOQL and nested subqueries into clean multiline output with stronger keyword alignment.",
    category: "Formatters",
    keywords: ["SOQL formatter", "Salesforce query formatter", "SOQL beautifier"],
    icon: FileSearch2,
    featured: true
  },
  {
    slug: "json-formatter",
    title: "JSON Formatter",
    tagline: "Validate, prettify, minify, and inspect JSON instantly.",
    description:
      "Parse JSON safely, highlight syntax problems, and switch between compact and readable output.",
    category: "Formatters",
    keywords: ["JSON formatter", "JSON validator", "JSON minifier"],
    icon: FileJson2,
    featured: true
  },
  {
    slug: "xml-formatter",
    title: "XML Formatter",
    tagline: "Beautify XML payloads and metadata without leaving the browser.",
    description:
      "Prettify XML, validate malformed markup, and copy or download the result for debugging workflows.",
    category: "Formatters",
    keywords: ["XML formatter", "XML beautifier", "Salesforce metadata XML"],
    icon: FileCode2
  },
  {
    slug: "json-to-apex",
    title: "JSON to Apex",
    tagline: "Convert nested payloads into Apex models with typed properties.",
    description:
      "Generate Apex wrapper classes from JSON objects and arrays, including nested child models and parse helpers.",
    category: "Generators",
    keywords: ["JSON to Apex", "Apex class generator", "Salesforce model generator"],
    icon: Braces,
    featured: true
  },
  {
    slug: "lwc-generator",
    title: "LWC Generator",
    tagline: "Generate complete Lightning Web Component bundles.",
    description:
      "Create HTML, JS, CSS, and meta XML files with naming validation and optional Jest scaffolding.",
    category: "Generators",
    keywords: ["LWC generator", "Salesforce Lightning Web Components", "LWC bundle"],
    icon: Blocks,
    featured: true
  },
  {
    slug: "aura-generator",
    title: "Aura Generator",
    tagline: "Spin up Aura bundles with the pieces you actually need.",
    description:
      "Generate component, controller, helper, style, documentation, and renderer files with toggleable scaffolding.",
    category: "Generators",
    keywords: ["Aura component generator", "Salesforce Aura bundle"],
    icon: LayoutTemplate
  },
  {
    slug: "apex-class-generator",
    title: "Apex Class Generator",
    tagline: "Create class templates with docs, sharing rules, and tests.",
    description:
      "Build service, utility, or domain class shells with optional test class output and typed method stubs.",
    category: "Generators",
    keywords: ["Apex class template", "Salesforce Apex class generator"],
    icon: FileStack
  },
  {
    slug: "apex-trigger-generator",
    title: "Apex Trigger Generator",
    tagline: "Generate trigger and handler scaffolds with event switches.",
    description:
      "Create trigger shells with optional handler classes and event-routing boilerplate for cleaner org code.",
    category: "Generators",
    keywords: ["Apex trigger generator", "Trigger handler pattern Salesforce"],
    icon: Radar
  },
  {
    slug: "lightning-message-channel-generator",
    title: "Lightning Message Channel Generator",
    tagline: "Build metadata XML for Lightning Message Channels quickly.",
    description:
      "Generate channel XML structure and fields for LWC, Aura, and Visualforce interop patterns.",
    category: "Generators",
    keywords: ["Lightning Message Channel generator", "Salesforce metadata XML"],
    icon: MessageSquareCode
  },
  {
    slug: "log-inspector",
    title: "Log Inspector",
    tagline: "Inspect Salesforce debug logs and surface what matters first.",
    description:
      "Parse pasted or uploaded logs, filter lines, highlight errors, and summarize SOQL, DML, limits, and exceptions.",
    category: "Analysis",
    keywords: ["Salesforce debug log analyzer", "Apex log inspector"],
    icon: FileSearch2,
    featured: true
  },
  {
    slug: "governor-limit-analyzer",
    title: "Governor Limit Analyzer",
    tagline: "Find likely Apex governor risks before they hurt production.",
    description:
      "Apply rule-based analysis to Apex code and log content to flag SOQL-in-loop, DML-in-loop, and bulkification issues.",
    category: "Analysis",
    keywords: ["Governor limit analyzer", "Apex bulkification review"],
    icon: Gauge,
    featured: true
  },
  {
    slug: "metadata-diff",
    title: "Metadata Diff",
    tagline: "Compare Salesforce metadata and config text side by side.",
    description:
      "Paste two files, inspect inline or split diffs, and copy exact changes without leaving the browser.",
    category: "Analysis",
    keywords: ["Metadata diff", "Salesforce compare tool", "text diff"],
    icon: Diff
  },
  {
    slug: "rest-api-explorer",
    title: "REST API Explorer",
    tagline: "Send requests, inspect responses, and save request history locally.",
    description:
      "Compose headers and body payloads, replay prior requests, and inspect structured JSON responses in-browser.",
    category: "Explorers",
    keywords: ["REST API explorer", "Salesforce REST API tester"],
    icon: Network,
    featured: true
  },
  {
    slug: "graphql-explorer",
    title: "GraphQL Explorer",
    tagline: "Write queries, variables, and headers in one focused workspace.",
    description:
      "Explore GraphQL endpoints with a dedicated query editor, variables panel, response formatter, and local request history.",
    category: "Explorers",
    keywords: ["GraphQL explorer", "GraphQL query tool", "Salesforce GraphQL API"],
    icon: Combine
  },
  {
    slug: "salesforce-markup-builder",
    title: "Salesforce Markup Builder",
    tagline: "Generate Lightning markup snippets from a visual builder.",
    description:
      "Assemble cards, inputs, grids, datatables, and actions visually, then copy clean LWC markup output.",
    category: "Builders",
    keywords: ["Salesforce markup builder", "LWC markup generator"],
    icon: LayoutTemplate
  }
];

export const featuredTools = toolRegistry.filter((tool) => tool.featured);

export const toolCategories = [
  "Formatters",
  "Generators",
  "Analysis",
  "Explorers",
  "Builders"
] as const;

export function getToolBySlug(slug: string) {
  return toolRegistry.find((tool) => tool.slug === slug);
}
