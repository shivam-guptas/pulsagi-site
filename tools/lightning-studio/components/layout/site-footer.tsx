import Link from "next/link";

import { siteConfig } from "@/lib/site-config";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-black/20">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 text-sm text-muted-foreground sm:px-6 lg:px-8 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-medium text-foreground">{siteConfig.name}</p>
          <p>{siteConfig.tagline}</p>
        </div>
        <div className="flex flex-wrap gap-5">
          <Link href="/">Home</Link>
          <Link href="/tools">Tools</Link>
          <Link href="/docs">Docs</Link>
          <a href="https://pulsagi.com/tools/" rel="noreferrer">
            Pulsagi Tools
          </a>
        </div>
      </div>
    </footer>
  );
}
