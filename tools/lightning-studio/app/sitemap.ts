import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/site-config";
import { toolRegistry } from "@/lib/tool-registry";

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      changeFrequency: "weekly",
      priority: 1
    },
    {
      url: absoluteUrl("/tools"),
      changeFrequency: "weekly",
      priority: 0.9
    },
    {
      url: absoluteUrl("/docs"),
      changeFrequency: "monthly",
      priority: 0.7
    }
  ];

  for (const tool of toolRegistry) {
    entries.push({
      url: absoluteUrl(`/tools/${tool.slug}`),
      changeFrequency: "weekly",
      priority: 0.8
    });
  }

  return entries;
}
