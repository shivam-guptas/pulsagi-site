"use client";

import Link from "next/link";
import { useEffect } from "react";

import { FAQSection } from "@/components/common/faq-section";
import { StructuredData } from "@/components/common/structured-data";
import { ToolHero } from "@/components/common/tool-hero";
import { toolRegistry } from "@/lib/tool-registry";
import { createFaqSchema } from "@/lib/seo";
import { useStudioStore } from "@/lib/studio-store";
import type { ToolDefinition } from "@/types/tool";

import { ToolRenderer } from "./tool-renderer";

export function ToolPageClient({ tool }: { tool: ToolDefinition }) {
  const markRecent = useStudioStore((state) => state.markRecent);
  const starredTools = useStudioStore((state) => state.starredTools);
  const toggleStar = useStudioStore((state) => state.toggleStar);

  useEffect(() => {
    markRecent(tool.slug);
  }, [markRecent, tool.slug]);

  const relatedTools = toolRegistry
    .filter((item) => item.slug !== tool.slug && item.category === tool.category)
    .slice(0, 3);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-4 py-12 sm:px-6 lg:px-8">
      <ToolHero
        tool={tool}
        onToggleStar={() => toggleStar(tool.slug)}
        isStarred={starredTools.includes(tool.slug)}
      />
      <ToolRenderer slug={tool.slug} />
      {relatedTools.length ? (
        <section className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.28em] text-primary">Related tools</p>
            <h2 className="text-3xl font-semibold tracking-tight">
              Continue with the rest of the workflow
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {relatedTools.map((item) => (
              <Link
                key={item.slug}
                href={`/tools/${item.slug}`}
                className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5 transition hover:border-primary/20"
              >
                <p className="text-sm uppercase tracking-[0.28em] text-primary">
                  {item.category}
                </p>
                <h3 className="mt-3 text-lg font-medium">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.tagline}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
      <FAQSection items={tool.faqs ?? defaultToolFaqs(tool.title)} />
      <StructuredData data={createFaqSchema(tool.faqs ?? defaultToolFaqs(tool.title))} />
    </div>
  );
}

function defaultToolFaqs(toolName: string) {
  return [
    {
      question: `Does ${toolName} run in the browser?`,
      answer:
        "Yes. Lightning Studio keeps processing in the browser wherever practical so snippets and payloads stay local by default."
    },
    {
      question: `Can I use ${toolName} without signing in?`,
      answer:
        "Yes. The public tools are designed for direct access with copy, download, upload, and local-history workflows."
    }
  ];
}
