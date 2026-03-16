"use client";

import Link from "next/link";
import { Sparkles, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site-config";
import { toolRegistry } from "@/lib/tool-registry";
import { useStudioStore } from "@/lib/studio-store";

export function SiteHeader() {
  const starredTools = useStudioStore((state) => state.starredTools);
  const favorites = toolRegistry.filter((tool) => starredTools.includes(tool.slug)).slice(0, 3);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary shadow-glow">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-medium uppercase tracking-[0.32em] text-primary">
              {siteConfig.name}
            </div>
            <div className="text-xs text-muted-foreground">{siteConfig.tagline}</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" asChild>
            <Link href="/tools">Tools</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/docs">Docs</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/tools/rest-api-explorer">Explorers</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/tools/lwc-generator">Start Building</Link>
          </Button>
        </nav>

        <div className="hidden items-center gap-2 xl:flex">
          {favorites.length > 0 ? (
            favorites.map((tool) => (
              <Link
                key={tool.slug}
                href={`/tools/${tool.slug}`}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-muted-foreground transition hover:border-primary/20 hover:text-foreground"
              >
                <Star className="h-3.5 w-3.5 text-primary" />
                {tool.title}
              </Link>
            ))
          ) : (
            <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-muted-foreground">
              Star tools for quick access
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
