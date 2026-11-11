import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    alias: {
      '#/': new URL('src/', import.meta.url).pathname,
      '#gen/': new URL('src/generators', import.meta.url).pathname,
    },
    include: ['__test/**/*.{test,spec}.[jt]s?(x)'],
  },
});
