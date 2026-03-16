"use client";

import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useStudioStore } from "@/lib/studio-store";
import type { ToolDefinition } from "@/types/tool";

export function ToolCard({ tool }: { tool: ToolDefinition }) {
  const starredTools = useStudioStore((state) => state.starredTools);
  const toggleStar = useStudioStore((state) => state.toggleStar);
  const Icon = tool.icon;
  const isStarred = starredTools.includes(tool.slug);

  return (
    <Card className="group h-full overflow-hidden border-white/10 bg-white/[0.03] transition hover:border-primary/25">
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
            <Icon className="h-6 w-6" />
          </div>
          <button
            type="button"
            onClick={() => toggleStar(tool.slug)}
            className="rounded-full border border-white/10 bg-white/[0.03] p-2 text-muted-foreground transition hover:text-primary"
            aria-label={isStarred ? "Remove from favorites" : "Add to favorites"}
          >
            <Star className={`h-4 w-4 ${isStarred ? "fill-current text-primary" : ""}`} />
          </button>
        </div>
        <div className="space-y-3">
          <Badge variant="secondary">{tool.category}</Badge>
          <CardTitle>{tool.title}</CardTitle>
          <CardDescription className="text-sm leading-6">{tool.description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm text-foreground/80">{tool.tagline}</p>
        <div className="flex flex-wrap gap-2">
          {tool.keywords.slice(0, 3).map((keyword) => (
            <span
              key={keyword}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-muted-foreground"
            >
              {keyword}
            </span>
          ))}
        </div>
        <Button asChild className="w-full justify-between">
          <Link href={`/tools/${tool.slug}`}>
            Open tool
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
