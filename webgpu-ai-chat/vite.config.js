import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  // While this chat is being tested inside the existing site, publish it at /ai-chat/.
  // When this becomes the main homepage later, change the production base to "/".
  base: command === "serve" ? "/" : "/ai-chat/",
  build: {
    // Build directly into the existing site's test route folder.
    // When the chat becomes the primary site, you can change this back to "dist".
    outDir: "../ai-chat",
    emptyOutDir: true,
  },
}));
