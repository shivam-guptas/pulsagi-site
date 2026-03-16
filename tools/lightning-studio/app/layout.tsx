import type { Metadata } from "next";
import type { ReactNode } from "react";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";

import "@/app/globals.css";

import { PageShell } from "@/components/layout/page-shell";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk"
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-mono"
});

export const metadata: Metadata = buildMetadata({
  title: `${siteConfig.name} | Salesforce Developer Toolkit`,
  description: siteConfig.description,
  keywords: [
    "Salesforce developer tools",
    "Apex formatter",
    "SOQL formatter",
    "Salesforce code generator",
    "Lightning Studio"
  ]
});

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${spaceGrotesk.variable} ${ibmPlexMono.variable}`}>
        <PageShell>{children}</PageShell>
      </body>
    </html>
  );
}
