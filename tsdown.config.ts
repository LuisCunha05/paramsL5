import { defineConfig } from 'tsdown'

export default defineConfig({
  format: ['cjs', 'esm','module'],
  entry: ['./src/index.ts'],
  dts: true,
  shims: true,
  skipNodeModulesBundle: true,
  clean: true,
  treeshake: true,
  minify:true
})
