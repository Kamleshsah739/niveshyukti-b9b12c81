import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const disableLovableSourceTagging = {
  name: "disable-lovable-source-tagging",
  enforce: "pre",
  config(config: any, env: any) {
    if (env.command === "serve" && env.mode === "development") {
      return {
        ...config,
        plugins: config.plugins?.filter(
          (plugin: any) => plugin?.name !== "lovable-plugin"
        ),
      };
    }
    return config;
  },
  configResolved(config: any) {
    if (config.command === "serve" && config.mode === "development") {
      config.plugins = config.plugins.filter(
        (plugin: any) => plugin?.name !== "lovable-plugin"
      );
    }
  },
};

export default defineConfig({
  tanstackStart: {
    server: {
      entry: "server",
    },
  },

  vite: {
    plugins: [disableLovableSourceTagging],

    build: {
      outDir: "dist",
      emptyOutDir: true,
      // Keep framework, authentication and UI code out of the landing-page
      // route chunk. Browsers can download these cacheable files in parallel
      // and only parse feature code when its route is opened.
      rolldownOptions: {
        output: {
          manualChunks(id: string) {
            if (!id.includes("node_modules")) return undefined;
            if (id.includes("react-dom") || id.includes("/react/")) return "vendor-react";
            if (id.includes("@tanstack")) return "vendor-tanstack";
            if (id.includes("@supabase")) return "vendor-supabase";
            if (id.includes("@radix-ui")) return "vendor-radix";
            if (id.includes("lucide-react")) return "vendor-icons";
            return undefined;
          },
        },
      },
    },
  },
});
