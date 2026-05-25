import { defineConfig } from "vite";
import { crx } from "@crxjs/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import manifest from "./src/manifest.json" with { type: "json" };

export default defineConfig({
  plugins: [tailwindcss(), crx({ manifest })],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "esnext",
    rollupOptions: {
      input: {
        options: "src/options.html",
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
