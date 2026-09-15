const packagePath = "apps/furin/node_modules/@teyik0/furin/package.json";
if (!(await Bun.file(packagePath).exists())) {
  throw new Error("Furin is not linked. Run `bun link` in Furin packages/core, then `bun install` here.");
}
const packageJson = await Bun.file(packagePath).json();
console.log(`[benchmark] linked ${packageJson.name}@${packageJson.version}`);

const nonceFiles = [
  "apps/furin/src/.benchmark-nonce.ts",
  "apps/next/app/.benchmark-nonce.ts",
  "apps/tanstack/src/.benchmark-nonce.ts",
  "apps/furin/public/.benchmark-nonce.txt",
  "apps/next/public/.benchmark-nonce.txt",
  "apps/tanstack/public/.benchmark-nonce.txt",
];
for (const nonceFile of nonceFiles) {
  if (!(await Bun.file(nonceFile).exists())) {
    await Bun.write(
      nonceFile,
      nonceFile.endsWith(".ts") ? 'export const BENCHMARK_NONCE = "local";\n' : "local"
    );
  }
}

export {};
