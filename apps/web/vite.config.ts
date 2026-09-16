import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { loadEnv } from "vite";
import path from "node:path";

export default defineConfig(({ mode }) => {
  // The workspace root owns .env; seed process.env so server code can read
  // SUPABASE_URL and friends during `vite dev` without extra tooling.
  const rootEnv = loadEnv(mode, path.resolve(import.meta.dirname, "../.."), "");
  for (const [key, value] of Object.entries(rootEnv)) {
    if (process.env[key] === undefined && value !== undefined) {
      process.env[key] = value;
    }
  }

  return {
    server: {
      port: 3000,
    },
    resolve: {
      tsconfigPaths: true,
    },
    plugins: [
      tailwindcss(),
      cloudflare({ viteEnvironment: { name: "ssr" } }),
      tanstackStart(),
      viteReact(),
    ],
  };
});
