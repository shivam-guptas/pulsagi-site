import { ToolDirectoryClient } from "@/components/tools/tool-directory-client";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";

export const metadata = buildMetadata({
  title: `Tool Directory | ${siteConfig.name}`,
  description:
    "Browse Lightning Studio's Salesforce formatters, generators, analyzers, explorers, and builders.",
  path: "/tools",
  keywords: [
    "Salesforce tool directory",
    "Apex tools",
    "SOQL tools",
    "Salesforce generators"
  ]
});

export default function ToolsPage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
      <section className="space-y-4">
        <p className="text-sm uppercase tracking-[0.28em] text-primary">Tools directory</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          One Salesforce toolkit. Multiple focused workflows.
        </h1>
        <p className="max-w-3xl text-base leading-7 text-muted-foreground">
          Search and filter Lightning Studio tools across formatting, code generation, analysis, API exploration, and markup-building tasks.
        </p>
      </section>
      <ToolDirectoryClient />
    </div>
  );
}
