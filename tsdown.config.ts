import { defineConfig } from 'tsdown';

export default defineConfig({
  attw: true,
  clean: true,
  deps: {
    neverBundle: true,
  },
  dts: { sourcemap: false },
  entry: ['./src/index.ts'],
  format: ['cjs', 'esm'],
  minify: true,
  outputOptions: {
    exports: 'named',
  },
  publint: true,
  shims: true,
  sourcemap: false,
  treeshake: true,
});
