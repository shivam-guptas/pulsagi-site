"use client";

import { useDeferredValue, useMemo, useState } from "react";

import { EmptyState } from "@/components/common/empty-state";
import { ToolCard } from "@/components/common/tool-card";
import { Input } from "@/components/ui/input";
import { toolCategories, toolRegistry } from "@/lib/tool-registry";

export function ToolDirectoryClient() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("All");
  const deferredSearch = useDeferredValue(search);

  const filteredTools = useMemo(() => {
    return toolRegistry.filter((tool) => {
      const matchesCategory = category === "All" || tool.category === category;
      const searchValue = deferredSearch.trim().toLowerCase();
      const matchesSearch =
        !searchValue ||
        [tool.title, tool.description, tool.tagline, ...tool.keywords]
          .join(" ")
          .toLowerCase()
          .includes(searchValue);

      return matchesCategory && matchesSearch;
    });
  }, [category, deferredSearch]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search Apex formatter, REST explorer, metadata diff, JSON to Apex..."
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory("All")}
            className={`rounded-full border px-4 py-2 text-sm ${
              category === "All"
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-white/10 bg-white/[0.03] text-muted-foreground"
            }`}
          >
            All
          </button>
          {toolCategories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`rounded-full border px-4 py-2 text-sm ${
                category === item
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-white/10 bg-white/[0.03] text-muted-foreground"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredTools.length ? (
          filteredTools.map((tool) => <ToolCard key={tool.slug} tool={tool} />)
        ) : (
          <div className="md:col-span-2 xl:col-span-3">
            <EmptyState
              title="No tools match this filter"
              description="Try a broader keyword or switch back to All categories to browse the full Lightning Studio toolkit."
            />
          </div>
        )}
      </div>
    </div>
  );
}
