import { notFound } from "next/navigation";

import { ToolPageClient } from "@/features/tools/tool-page-client";
import { buildMetadata } from "@/lib/seo";
import { getToolBySlug, toolRegistry } from "@/lib/tool-registry";

export function generateStaticParams() {
  return toolRegistry.map((tool) => ({
    slug: tool.slug
  }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const tool = getToolBySlug(params.slug);

  if (!tool) {
    return {};
  }

  return buildMetadata({
    title: `${tool.title} | Lightning Studio`,
    description: tool.description,
    path: `/tools/${tool.slug}`,
    keywords: tool.keywords
  });
}

export default function ToolPage({ params }: { params: { slug: string } }) {
  const tool = getToolBySlug(params.slug);

  if (!tool) {
    notFound();
  }

  return <ToolPageClient tool={tool} />;
}
