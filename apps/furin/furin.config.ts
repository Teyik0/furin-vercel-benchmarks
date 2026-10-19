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

let vercelAdapterPath: string | undefined;
try {
  vercelAdapterPath = import.meta.resolve("@teyik0/furin/adapters/vercel");
} catch {
  // CI also builds baseline Furin versions without deployment adapters.
}

const regions: "cdg1"[] = ["cdg1"];
const deployment = vercelAdapterPath
  ? { targets: [(await import(vercelAdapterPath)).vercel({ regions })] }
  : { vercel: { regions } };

export default defineConfig({
  plugins: [{ ...linkedPeerDependencies, buildOnly: true }],
  ...deployment,
});
