import { defineConfig } from 'oxfmt';

export default defineConfig({
  printWidth: 80,
  arrowParens: 'always',
  bracketSpacing: true,
  endOfLine: 'lf',
  sortImports: true,
  useTabs: false,
  tabWidth: 2,
  sortPackageJson: true,
  singleQuote: true,
  ignorePatterns: ['dist/**/*'],
});
