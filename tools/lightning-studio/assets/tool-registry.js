(function () {
  const siteConfig = {
    name: "LIGHTNING STUDIO",
    tagline: "Build Salesforce development easy and fastest.",
    description:
      "A premium browser-based Salesforce developer toolkit with formatters, generators, analyzers, explorers, and reusable productivity workflows.",
    baseUrl: "https://pulsagi.com/tools/lightning-studio"
  };

  const featureCards = [
    {
      title: "Build & Edit",
      description:
        "LWC, Aura, Apex Classes & Triggers, LMS, and Lightning UI workflows."
    },
    {
      title: "Smart Work",
      description:
        "Formatters, REST and GraphQL exploration, log analysis, and governor insights."
    },
    {
      title: "Package & Utilities",
      description:
        "Metadata diff, JSON to Apex, JSON and XML beautifier, and reusable builders."
    },
    {
      title: "Privacy & Security",
      description:
        "Your code stays in your browser by default. Inputs are processed locally wherever possible."
    },
    {
      title: "Salesforce Log Inspector",
      description:
        "Inspect, analyze, and optimize Salesforce debug logs with targeted summaries."
    },
    {
      title: "Salesforce Markup Builder",
      description:
        "Create Lightning Web Component markup and UI snippets quickly."
    }
  ];

  const homeFaqs = [
    {
      question: "What is Lightning Studio?",
      answer:
        "Lightning Studio is a hosted Salesforce developer toolkit with browser-based formatters, generators, analyzers, API explorers, and markup builders."
    },
    {
      question: "Does Lightning Studio keep my code in the browser?",
      answer:
        "Yes. Inputs are processed locally wherever practical, which makes the tools faster and better for privacy-sensitive snippets."
    },
    {
      question: "Can each tool page rank separately in search?",
      answer:
        "Yes. Every tool lives on its own dedicated route with standalone copy and metadata-friendly structure for organic search traffic."
    }
  ];

  const toolRegistry = [
    {
      slug: "apex-formatter",
      title: "Apex Formatter",
      category: "Formatters",
      featured: true,
      tagline: "Clean up Apex classes, triggers, and snippets in seconds.",
      description:
        "Format Apex with browser-based guardrails, clearer indentation, readable spacing, and safe malformed-input handling.",
      keywords: ["Apex formatter", "Salesforce Apex beautifier", "Apex prettify"]
    },
    {
      slug: "soql-formatter",
      title: "SOQL Formatter",
      category: "Formatters",
      featured: true,
      tagline: "Make long queries readable, reviewable, and safer to share.",
      description:
        "Format SOQL and nested subqueries into clean multiline output with stronger keyword alignment.",
      keywords: ["SOQL formatter", "Salesforce query formatter", "SOQL beautifier"]
    },
    {
      slug: "json-formatter",
      title: "JSON Formatter",
      category: "Formatters",
      featured: true,
      tagline: "Validate, prettify, minify, and inspect JSON instantly.",
      description:
        "Parse JSON safely, highlight syntax problems, and switch between compact and readable output.",
      keywords: ["JSON formatter", "JSON validator", "JSON minifier"]
    },
    {
      slug: "xml-formatter",
      title: "XML Formatter",
      category: "Formatters",
      featured: false,
      tagline: "Beautify XML payloads and metadata without leaving the browser.",
      description:
        "Prettify XML, validate malformed markup, and copy or download the result for debugging workflows.",
      keywords: ["XML formatter", "XML beautifier", "Salesforce metadata XML"]
    },
    {
      slug: "json-to-apex",
      title: "JSON to Apex",
      category: "Generators",
      featured: true,
      tagline: "Convert nested payloads into Apex models with typed properties.",
      description:
        "Generate Apex wrapper classes from JSON objects and arrays, including nested child models and parse helpers.",
      keywords: ["JSON to Apex", "Apex class generator", "Salesforce model generator"]
    },
    {
      slug: "lwc-generator",
      title: "LWC Generator",
      category: "Generators",
      featured: true,
      tagline: "Generate complete Lightning Web Component bundles.",
      description:
        "Create HTML, JS, CSS, and meta XML files with naming validation and optional test scaffolding.",
      keywords: ["LWC generator", "Salesforce Lightning Web Components", "LWC bundle"]
    },
    {
      slug: "aura-generator",
      title: "Aura Generator",
      category: "Generators",
      featured: false,
      tagline: "Spin up Aura bundles with the pieces you actually need.",
      description:
        "Generate component, controller, helper, style, renderer, and docs files with toggleable scaffolding.",
      keywords: ["Aura component generator", "Salesforce Aura bundle"]
    },
    {
      slug: "apex-class-generator",
      title: "Apex Class Generator",
      category: "Generators",
      featured: false,
      tagline: "Create class templates with docs, sharing rules, and tests.",
      description:
        "Build service, utility, or domain class shells with optional test class output and typed method stubs.",
      keywords: ["Apex class template", "Salesforce Apex class generator"]
    },
    {
      slug: "apex-trigger-generator",
      title: "Apex Trigger Generator",
      category: "Generators",
      featured: false,
      tagline: "Generate trigger and handler scaffolds with event switches.",
      description:
        "Create trigger shells with optional handler classes and event-routing boilerplate for cleaner org code.",
      keywords: ["Apex trigger generator", "Trigger handler pattern Salesforce"]
    },
    {
      slug: "lightning-message-channel-generator",
      title: "Lightning Message Channel Generator",
      category: "Generators",
      featured: false,
      tagline: "Build metadata XML for Lightning Message Channels quickly.",
      description:
        "Generate channel XML structure and fields for LWC, Aura, and Visualforce interop patterns.",
      keywords: ["Lightning Message Channel generator", "Salesforce metadata XML"]
    },
    {
      slug: "log-inspector",
      title: "Log Inspector",
      category: "Analysis",
      featured: true,
      tagline: "Inspect Salesforce debug logs and surface what matters first.",
      description:
        "Parse pasted or uploaded logs, filter lines, highlight errors, and summarize SOQL, DML, limits, and exceptions.",
      keywords: ["Salesforce debug log analyzer", "Apex log inspector"]
    },
    {
      slug: "governor-limit-analyzer",
      title: "Governor Limit Analyzer",
      category: "Analysis",
      featured: true,
      tagline: "Find likely Apex governor risks before they hurt production.",
      description:
        "Apply rule-based analysis to Apex code and log content to flag SOQL-in-loop, DML-in-loop, and bulkification issues.",
      keywords: ["Governor limit analyzer", "Apex bulkification review"]
    },
    {
      slug: "metadata-diff",
      title: "Metadata Diff",
      category: "Analysis",
      featured: false,
      tagline: "Compare Salesforce metadata and config text side by side.",
      description:
        "Paste two files, inspect inline or split diffs, and copy exact changes without leaving the browser.",
      keywords: ["Metadata diff", "Salesforce compare tool", "text diff"]
    },
    {
      slug: "rest-api-explorer",
      title: "REST API Explorer",
      category: "Explorers",
      featured: true,
      tagline: "Send requests, inspect responses, and save request history locally.",
      description:
        "Compose headers and body payloads, replay prior requests, and inspect structured JSON responses in-browser.",
      keywords: ["REST API explorer", "Salesforce REST API tester"]
    },
    {
      slug: "graphql-explorer",
      title: "GraphQL Explorer",
      category: "Explorers",
      featured: false,
      tagline: "Write queries, variables, and headers in one focused workspace.",
      description:
        "Explore GraphQL endpoints with a dedicated query editor, variables panel, response formatter, and local request history.",
      keywords: ["GraphQL explorer", "GraphQL query tool", "Salesforce GraphQL API"]
    },
    {
      slug: "salesforce-markup-builder",
      title: "Salesforce Markup Builder",
      category: "Builders",
      featured: false,
      tagline: "Generate Lightning markup snippets from a visual builder.",
      description:
        "Assemble cards, inputs, grids, datatables, and actions visually, then copy clean LWC markup output.",
      keywords: ["Salesforce markup builder", "LWC markup generator"]
    }
  ];

  const toolCategories = ["Formatters", "Generators", "Analysis", "Explorers", "Builders"];

  function getToolBySlug(slug) {
    return toolRegistry.find((tool) => tool.slug === slug);
  }

  window.LightningStudioData = {
    siteConfig,
    featureCards,
    homeFaqs,
    toolRegistry,
    toolCategories,
    getToolBySlug
  };
})();
