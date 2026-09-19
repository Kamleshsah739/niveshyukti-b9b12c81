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
    },
  },
});
