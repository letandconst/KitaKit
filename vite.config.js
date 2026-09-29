import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  cacheDir: "node_modules/.vite",
  resolve: {
    alias: {
      "next/navigation": fileURLToPath(
        new URL("./src/next-navigation-stub.ts", import.meta.url),
      ),
    },
  },
  server: {
    fs: {
      allow: ["."],
      strict: true,
    },
  },
});
