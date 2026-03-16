import Link from "next/link";
import { ArrowUpRight, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ToolDefinition } from "@/types/tool";

export function ToolHero({
  tool,
  onToggleStar,
  isStarred
}: {
  tool: ToolDefinition;
  onToggleStar: () => void;
  isStarred: boolean;
}) {
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Badge>{tool.category}</Badge>
        <Badge variant="secondary">Runs in browser</Badge>
        <Badge variant="secondary">SEO landing page</Badge>
      </div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
        <div className="space-y-5">
          <h1 className="max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            {tool.title}
          </h1>
          <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
            {tool.description}
          </p>
        </div>
        <div className="flex flex-col gap-3 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
          <p className="text-sm text-muted-foreground">{tool.tagline}</p>
          <Button variant="secondary" onClick={onToggleStar}>
            <Star className={`h-4 w-4 ${isStarred ? "fill-current text-primary" : ""}`} />
            {isStarred ? "Starred" : "Star this tool"}
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/tools" className="justify-between">
              Browse all tools
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
