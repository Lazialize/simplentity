import { $ } from "bun";
import { type Options, build } from "tsup";

const tsupConfig: Options = {
  entry: ["src/**/*.ts"],
  splitting: false,
  sourcemap: false,
  clean: true,
  bundle: true,
} satisfies Options;

await Promise.all([
  build({
    outDir: "dist",
    format: "esm",
    target: "node20",
    cjsInterop: false,
    ...tsupConfig,
  }),

  build({
    outDir: "dist/cjs",
    format: "cjs",
    target: "node20",
    ...tsupConfig,
  }),
]);

await $`tsc --project tsconfig.dts.json`;
await $`cp dist/*.d.ts dist/cjs`;

await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: "dist/bun",
  minify: true,
  target: "bun",
});
await $`cp dist/*.d.ts dist/bun`;

process.exit();
