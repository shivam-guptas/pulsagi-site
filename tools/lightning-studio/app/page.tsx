import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, Workflow } from "lucide-react";

import { FAQSection } from "@/components/common/faq-section";
import { StructuredData } from "@/components/common/structured-data";
import { ToolCard } from "@/components/common/tool-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildMetadata, createFaqSchema } from "@/lib/seo";
import { absoluteUrl, siteConfig } from "@/lib/site-config";
import { featuredTools, toolCategories, toolRegistry } from "@/lib/tool-registry";

export const metadata = buildMetadata({
  title: `${siteConfig.name} | Build Salesforce Development Easy and Fastest`,
  description: siteConfig.description,
  path: "/",
  keywords: [
    "Lightning Studio",
    "Salesforce toolkit",
    "Apex formatter",
    "LWC generator",
    "Salesforce developer tools"
  ]
});

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
      "Yes. Every tool lives on its own dedicated route with metadata, internal links, and standalone copy designed for indexable SEO landing pages."
  }
];

export default function HomePage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-20 px-4 py-12 sm:px-6 lg:px-8">
      <section className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
        <div className="space-y-8">
          <div className="flex flex-wrap gap-3">
            <Badge>Salesforce developer toolkit</Badge>
            <Badge variant="secondary">Public web app</Badge>
            <Badge variant="secondary">Local-first by default</Badge>
          </div>
          <div className="space-y-6">
            <h1 className="max-w-4xl text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
              LIGHTNING STUDIO
            </h1>
            <p className="max-w-3xl text-xl leading-8 text-muted-foreground">
              Build Salesforce development easy and fastest.
            </p>
            <p className="max-w-3xl text-base leading-7 text-muted-foreground">
              Lightning Studio brings Apex formatting, SOQL cleanup, JSON to Apex conversion, bundle generators, log analysis, metadata diffing, REST and GraphQL exploration, and Salesforce markup workflows into one premium browser-based platform.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/tools">
                Explore tools
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/tools/lwc-generator">Open LWC Generator</Link>
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {toolCategories.map((category) => (
              <span
                key={category}
                className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-muted-foreground"
              >
                {category}
              </span>
            ))}
          </div>
        </div>
        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader>
            <CardTitle className="text-xl">Why teams use it</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 text-sm leading-6 text-muted-foreground">
            <div className="flex gap-3">
              <Sparkles className="mt-0.5 h-5 w-5 text-primary" />
              <p>Build and generate LWC, Aura, Apex classes, triggers, and message channels faster.</p>
            </div>
            <div className="flex gap-3">
              <Workflow className="mt-0.5 h-5 w-5 text-primary" />
              <p>Format, analyze, compare, and inspect code or metadata without leaving the browser.</p>
            </div>
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
              <p>Your code stays in your browser by default. Inputs are processed locally wherever possible.</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {[
          {
            title: "Build & Generate",
            description:
              "LWC, Aura, Apex Classes, Triggers, Message Channels, and metadata helpers."
          },
          {
            title: "Smart Work",
            description:
              "Formatters, log analyzer, governor insights, REST API Explorer, and GraphQL tools."
          },
          {
            title: "Utilities",
            description:
              "JSON to Apex, metadata diff, XML and JSON beautifier, and reusable code builders."
          },
          {
            title: "Privacy & Security",
            description:
              "Your code stays in your browser by default. Inputs are processed locally wherever possible."
          },
          {
            title: "Log Inspector",
            description: "Inspect, analyze, and optimize Salesforce debug logs."
          },
          {
            title: "Salesforce Markup Builder",
            description: "Quickly generate Lightning component markup and UI snippets."
          }
        ].map((item) => (
          <Card key={item.title} className="border-white/10 bg-white/[0.03]">
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-2">
          <p className="text-sm uppercase tracking-[0.28em] text-primary">Featured tools</p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Start with the workflows Salesforce teams need every day
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {featuredTools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="border-white/10 bg-white/[0.03] lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-2xl">SEO-ready tool architecture</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
            <p>
              Each tool has its own clean route, page metadata, canonical-ready structure, internal links, and helpful copy so the full platform can grow organic search traffic over time.
            </p>
            <p>
              Lightning Studio is built to be hosted at a custom subpath such as `/tools/lightning-studio` or a dedicated subdomain like `lightningstudio.domain.com`.
            </p>
            <Button asChild variant="secondary">
              <Link href="/docs">Read setup and deploy docs</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader>
            <CardTitle className="text-2xl">Tool count</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-semibold">{toolRegistry.length}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Dedicated, indexable tools for developers, admins, consultants, and learners.
            </p>
          </CardContent>
        </Card>
      </section>

      <FAQSection items={homeFaqs} />
      <StructuredData
        data={createFaqSchema(homeFaqs)}
      />
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: siteConfig.name,
          applicationCategory: "DeveloperApplication",
          operatingSystem: "Web",
          description: siteConfig.description,
          url: absoluteUrl("/")
        }}
      />
    </div>
  );
}
