import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";

export const metadata = buildMetadata({
  title: `Docs | ${siteConfig.name}`,
  description:
    "Setup, run, build, deploy, and integration notes for hosting Lightning Studio on your website.",
  path: "/docs",
  keywords: ["Lightning Studio docs", "Next.js deploy guide", "Salesforce toolkit setup"]
});

export default function DocsPage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
      <section className="space-y-4">
        <p className="text-sm uppercase tracking-[0.28em] text-primary">Docs and help</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Host, deploy, and extend Lightning Studio
        </h1>
        <p className="max-w-3xl text-base leading-7 text-muted-foreground">
          Lightning Studio is a Next.js App Router project designed to work as a standalone deploy or as a subpath app inside an existing website.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader>
            <CardTitle>Run locally</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>`npm install`</p>
            <p>`npm run dev`</p>
            <p>Open `http://localhost:3000` and start from the tool directory.</p>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader>
            <CardTitle>Deploy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>Set `NEXT_PUBLIC_SITE_URL` for metadata and canonical URLs.</p>
            <p>Use `NEXT_PUBLIC_BASE_PATH=/tools/lightning-studio` when hosting under a subpath.</p>
            <p>Enable `STATIC_EXPORT=true` for static export builds if needed.</p>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader>
            <CardTitle>Privacy model</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>Formatting, diffing, generation, and analysis run in-browser wherever practical.</p>
            <p>REST and GraphQL requests are sent directly from the browser, so CORS rules still apply.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/10 bg-white/[0.03]">
        <CardHeader>
          <CardTitle>Suggested integration paths</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
          <p>
            Use `/tools/lightning-studio` when embedding into an existing tools section, or move the app to a subdomain if you want an isolated deploy target and analytics profile.
          </p>
          <p>
            Internal linking is already built in between the landing page, docs page, tool directory, and individual tool routes.
          </p>
          <p>
            Head to the <Link href="/tools" className="text-primary">tools directory</Link> to open any workflow directly.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
