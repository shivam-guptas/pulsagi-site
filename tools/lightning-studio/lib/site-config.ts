export const siteConfig = {
  name: "LIGHTNING STUDIO",
  tagline: "Build Salesforce development easy and fastest.",
  description:
    "A premium browser-based Salesforce developer toolkit with formatters, generators, analyzers, API explorers, and productivity workflows.",
  siteUrl:
    process.env.NEXT_PUBLIC_SITE_URL || "https://pulsagi.com/tools/lightning-studio",
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  githubHint: "Deploy to Vercel, Netlify, or your existing Node host."
};

export function absoluteUrl(path = "") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${siteConfig.siteUrl.replace(/\/$/, "")}${normalizedPath}`;
}
