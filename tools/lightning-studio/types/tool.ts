import type { LucideIcon } from "lucide-react";

export type ToolCategory =
  | "Formatters"
  | "Generators"
  | "Analysis"
  | "Explorers"
  | "Builders";

export type ToolDefinition = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  category: ToolCategory;
  keywords: string[];
  icon: LucideIcon;
  featured?: boolean;
  faqs?: Array<{ question: string; answer: string }>;
};
