import { defineConfig } from 'tsdown';

export default defineConfig({
  attw: true,
  clean: true,
  deps: {
    neverBundle: true,
  },
  dts: true,
  entry: ['./src/index.ts'],
  format: ['cjs', 'esm', 'module'],
  minify: true,
  outputOptions: {
    exports: 'named',
  },
  publint: true,
  shims: true,
  treeshake: true,
});
