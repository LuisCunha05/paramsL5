import { defineConfig } from 'tsdown';

export default defineConfig({
  format: ['cjs', 'esm', 'module'],
  entry: ['./src/index.ts'],
  dts: true,
  shims: true,
  clean: true,
  treeshake: true,
  minify: true,
  outputOptions: {
    exports:"named"
  },
  deps: {
    skipNodeModulesBundle:true
  },
  publint: true,
  attw:true
});
