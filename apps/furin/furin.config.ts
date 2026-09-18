import { fileURLToPath } from "node:url";
import { defineConfig } from "@teyik0/furin/config";

const linkedPeerDependencies: Bun.BunPlugin = {
  name: "benchmark-linked-peer-dependencies",
  setup(build) {
    build.onResolve({ filter: /^(?:elysia|evlog|react(?:-dom)?)(?:\/.*)?$/ }, ({ path }) => ({
      path: fileURLToPath(import.meta.resolve(path)),
    }));
  },
};

export default defineConfig({
  plugins: [{ ...linkedPeerDependencies, buildOnly: true }],
  vercel: { regions: ["cdg1"] },
});
