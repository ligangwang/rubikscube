import { defineConfig } from "vite";
export default defineConfig({
  // Published under /g/rubikscube/<version>/, so every URL stays relative.
  base: "./",
  esbuild: { jsx: "automatic" },
  // dingn's playground loads the dev server from a sandboxed frame.
  server: { cors: true },
  build: {
    target: "es2022",
    outDir: "dist",
    emptyOutDir: true,
    // three.js is one large chunk.
    chunkSizeWarningLimit: 1000,
  },
  test: { environment: "jsdom", include: ["tests/**/*.test.tsx"] },
});
